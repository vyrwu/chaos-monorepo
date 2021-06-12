const fs = require('fs')
const path = require('path')
const { ChaosController } = require('@vyrwu/ts-api')
const { read, applySpec, createK8sNamespace } = require('./util')

const patchYaml = (kind, chaosNamespaceName) => {
  const patches = {
    Deployment: (spec) => {
      const cDeploy = spec
      const chaosCanaryLabel = 'chaos-canary'
      const deploymentType = 'deployment-type'
      cDeploy.metadata.labels[deploymentType] = chaosCanaryLabel
      cDeploy.spec.selector.matchLabels[deploymentType] = chaosCanaryLabel
      cDeploy.spec.template.metadata.labels[deploymentType] = chaosCanaryLabel
      cDeploy.spec.template.metadata.namespace = chaosNamespaceName
      cDeploy.metadata.namespace = chaosNamespaceName
      return cDeploy
    },
    Default: (spec) => {
      const cSpec = spec
      cSpec.metadata.namespace = chaosNamespaceName
      return cSpec
    },
  }
  return patches[kind] || patches.Default
}

const deployChaosCanaryCluster = async (runId) => {
  // deploy new namespace (runId)
  const chaosNamespaceName = `chaos-test-${runId.slice(runId.length - 6, runId.length)}`
  const namespaceResult = await createK8sNamespace(chaosNamespaceName, {
    'istio-injection': 'enabled',
    testType: 'chaos',
    runId,
  })
  // get all specs as objects
  const rootDir = path.resolve(path.dirname(__filename), '..')
  const k8sYamls = `${rootDir}/k8sYamls`
  const serviceDirs = await fs.promises.readdir(k8sYamls)
  const specs = (await Promise.all(
    serviceDirs.map(async (dir) => {
      const serviceDir = `${k8sYamls}/${dir}`
      const chaosDeploySpecs = (await fs.promises.readdir(serviceDir))
        .map(file => read(`${serviceDir}/${file}`))
        .filter(rawYaml => rawYaml && rawYaml.kind && rawYaml.metadata)
        .map(spec => patchYaml(spec.kind, chaosNamespaceName)(spec))
      return chaosDeploySpecs
    }),
  )).flat()
  const clusterResult = await Promise.all(
    specs.map(async (spec) => {
      const resultApply = await applySpec(spec)
      return resultApply
    }),
  )
  return { namespace: namespaceResult, cluster: clusterResult }
}

const addCanaryTrafficMirror = async ({
  serviceName,
  upstreamNamespace,
  downstreamNamespace,
  mirrorPercentageValue,
}) => {
  const k8sYamls = `${path.resolve(path.dirname(__filename), '..')}/k8sYamls`
  const upstreamVirtualServiceSpec = read(`${k8sYamls}/${serviceName}/virtual-service.yaml`)
  const chaosCanaryServicefqdn = `${serviceName}.${downstreamNamespace}.svc.cluster.local`
  upstreamVirtualServiceSpec.metadata.namespace = upstreamNamespace
  upstreamVirtualServiceSpec.spec.hosts = [
    ...upstreamVirtualServiceSpec.spec.hosts,
    chaosCanaryServicefqdn,
  ]
  const routeIndex = upstreamVirtualServiceSpec.spec.http
    .findIndex(route => route.name === upstreamNamespace)
  if (routeIndex === -1) {
    throw { message: `No route found for env '${upstreamNamespace}' in Virtual Service '${upstreamVirtualServiceSpec.metadata.name}'` }
  }
  const routingConf = {
    mirror: {
      host: chaosCanaryServicefqdn,
    },
    mirrorPercentage: {
      value: mirrorPercentageValue,
    },
  }
  upstreamVirtualServiceSpec.spec.http[routeIndex] = {
    ...upstreamVirtualServiceSpec.spec.http[routeIndex],
    ...routingConf,
  }

  const result = await applySpec(upstreamVirtualServiceSpec)
  return result
}

const addCanaryTrafficSplit = async ({
  serviceName,
  upstreamNamespace,
  downstreamNamespace,
  splitPercentageValue,
}) => {
  const k8sYamls = `${path.resolve(path.dirname(__filename), '..')}/k8sYamls`
  const upstreamVirtualServiceSpec = read(`${k8sYamls}/${serviceName}/virtual-service.yaml`)
  const chaosCanaryServicefqdn = `${serviceName}.${downstreamNamespace}.svc.cluster.local`
  upstreamVirtualServiceSpec.metadata.namespace = upstreamNamespace
  upstreamVirtualServiceSpec.spec.hosts = [
    ...upstreamVirtualServiceSpec.spec.hosts,
    chaosCanaryServicefqdn,
  ]
  const routeIndex = upstreamVirtualServiceSpec.spec.http
    .findIndex(route => route.name === 'production')
  if (routeIndex === -1) {
    throw { message: `No route found for env '${upstreamNamespace}' in Virtual Service '${upstreamVirtualServiceSpec.metadata.name}'` }
  }
  const currentHTTPRoute = upstreamVirtualServiceSpec.spec.http[routeIndex]
  const prodRoute = currentHTTPRoute.route[0]
  const newProdWeight = prodRoute.weight - splitPercentageValue
  prodRoute.weight = newProdWeight
  upstreamVirtualServiceSpec.spec.http[routeIndex] = {
    ...currentHTTPRoute,
    route: [
      prodRoute,
      {
        destination: {
          host: chaosCanaryServicefqdn,
        },
        weight: splitPercentageValue,
      },
    ],
  }

  const result = await applySpec(upstreamVirtualServiceSpec)
  return result
}

const addFailureToService = async (service, upstreamNamespace, faultSpec, chaosNamespace) => {
  const k8sYamls = `${path.resolve(path.dirname(__filename), '..')}/k8sYamls`
  const vServiceSpec = read(`${k8sYamls}/${service}/virtual-service.yaml`)
  const routeIndex = vServiceSpec.spec.http
    .findIndex(route => route.name === upstreamNamespace)
  if (routeIndex === -1) {
    throw { message: `No route found for env '${upstreamNamespace}' in Virtual Service '${vServiceSpec.metadata.name}'` }
  }
  vServiceSpec.metadata.namespace = chaosNamespace || upstreamNamespace
  vServiceSpec.spec.http[routeIndex] = {
    ...vServiceSpec.spec.http[routeIndex],
    ...faultSpec,
  }
  const applyResult = applySpec(vServiceSpec)
  return applyResult
}

const makeChaosTestDeployment = ({
  testMode,
  runId,
  productionNamespace,
  upstreamService,
  downstreamService,
}) => {
  const modes = {
    canary: async ({ failureSpec, routingSpec }) => {
      // create chaos canary
      const { namespace } = await deployChaosCanaryCluster(runId)
      const chaosNamespace = namespace.body.metadata.name
      await addFailureToService(
        downstreamService,
        productionNamespace,
        failureSpec,
        chaosNamespace,
      )
      // TODO more error-handing here
      const { Mirror, Split } = ChaosController.RoutingSpecRoutingTypeEnum
      const { routingType, weight } = routingSpec
      if (routingType === Mirror) {
        console.log(`Applying '${routingType}' routing...`)
        await addCanaryTrafficMirror({
          serviceName: upstreamService,
          upstreamNamespace: productionNamespace,
          downstreamNamespace: chaosNamespace,
          mirrorPercentageValue: weight,
        })
      } else if (routingType === Split) {
        console.log(`Applying '${routingType}' routing...`)
        await addCanaryTrafficSplit({
          serviceName: upstreamService,
          upstreamNamespace: productionNamespace,
          downstreamNamespace: chaosNamespace,
          splitPercentageValue: weight,
        })
      }
      return {
        namespace: chaosNamespace,
      }
    },
    production: async ({ failureSpec }) => {
      await addFailureToService(
        downstreamService,
        productionNamespace,
        failureSpec,
      )
      return {
        namespace: productionNamespace,
      }
    },
  }
  if (!Object.keys(modes).includes(testMode)) {
    throw { message: `Unsupported deployment mode '${testMode}'`, code: 400 }
  }
  return modes[testMode]
}

module.exports = {
  deployChaosCanaryCluster,
  addFailureToService,
  addCanaryTrafficMirror,
  addCanaryTrafficSplit,
  makeChaosTestDeployment,
}
