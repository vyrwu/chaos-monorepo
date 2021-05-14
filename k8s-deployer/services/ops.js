const shell = require('shelljs')
const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
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

const addChaosCanaryRouting = async (upstreamName, upstreamNamespace, downstreamNamespace) => {
  const k8sYamls = `${path.resolve(path.dirname(__filename), '..')}/k8sYamls`
  const upstreamVirtualServiceSpec = read(`${k8sYamls}/${upstreamName}/virtual-service.yaml`)
  const chaosCanaryServicefqdn = `${upstreamName}.${downstreamNamespace}.svc.cluster.local`
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
      value: 20,
    },
  }
  upstreamVirtualServiceSpec.spec.http[routeIndex] = {
    ...upstreamVirtualServiceSpec.spec.http[routeIndex],
    ...routingConf,
  }

  const result = await applySpec(upstreamVirtualServiceSpec)
  return result
}

const addFailureToService = async (service, upstreamNamespace, chaosNamespace, faultSpec) => {
  const k8sYamls = `${path.resolve(path.dirname(__filename), '..')}/k8sYamls`
  const vServiceSpec = read(`${k8sYamls}/${service}/virtual-service.yaml`)
  const routeIndex = vServiceSpec.spec.http
    .findIndex(route => route.name === upstreamNamespace)
  if (routeIndex === -1) {
    throw { message: `No route found for env '${upstreamNamespace}' in Virtual Service '${vServiceSpec.metadata.name}'` }
  }
  vServiceSpec.metadata.namespace = chaosNamespace
  vServiceSpec.spec.http[routeIndex] = {
    ...vServiceSpec.spec.http[routeIndex],
    ...faultSpec,
  }
  const apply = shell.exec(`echo "${yaml.dump(vServiceSpec)}" | kubectl apply -f -`)
  if (apply.code !== 0) {
    throw { message: `'kubectl apply -f ...' exitted with '${apply.code}': ${apply.stderr}`, code: 500 }
  }
  return vServiceSpec
}

module.exports = {
  deployChaosCanaryCluster,
  addChaosCanaryRouting,
  addFailureToService,
}
