const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const { read, applyJSObj, createK8sNamespace } = require('./util')

const deployChaosCanaryCluster = async (runId) => {
  // deploy new namespace (runId)
  const chaosNamespaceName = `chaos-test-${runId}`
  const namespaceResult = await createK8sNamespace(chaosNamespaceName, {
    'istio-injection': 'enabled',
  })
  // deploy canary cluster
  const applyChaosPatches = (deploy) => {
    const cDeploy = deploy
    const chaosCanaryLabel = 'chaos-canary'
    const deploymentType = 'deployment-type'
    cDeploy.metadata.labels[deploymentType] = chaosCanaryLabel
    cDeploy.spec.selector.matchLabels[deploymentType] = chaosCanaryLabel
    cDeploy.spec.template.metadata.labels[deploymentType] = chaosCanaryLabel
    cDeploy.spec.template.metadata.namespace = chaosNamespaceName
    cDeploy.metadata.namespace = chaosNamespaceName
    return cDeploy
  }
  // get all specs as objects
  const k8sYamls = `${path.resolve(path.dirname(__filename), '..')}/k8sYamls`
  const serviceDirs = await fs.promises.readdir(k8sYamls)
  const specs = await Promise.all(
    serviceDirs.map(async (dir) => {
      const chaosDeploySpecs = (await fs.promises.readdir(dir))
        .map(file => yaml.safeLoad(file))
        .filter(rawYaml => rawYaml && rawYaml.kind && rawYaml.metadata)
        .map(spec => applyChaosPatches(spec))
      return chaosDeploySpecs
    }),
  )
  const result = JSON.stringify(specs)
  // const result = await Promise.all(
  //   specs.map(async (spec) => {
  //     const resultApply = await applyJSObj(spec)
  //     return resultApply
  //   }),
  // )
  return { namespace: namespaceResult, services: result }
}

const addChaosCanaryRouting = async (upstreamName, chaosNamespace) => {
  const upstreamNamespace = 'production'
  const k8sYamls = `${path.resolve(path.dirname(__filename), '..')}/k8sYamls`
  const upstreamVirtualServiceSpec = read(`${k8sYamls}/${upstreamName}/virtual-service.yaml`)
  const chaosCanaryServicefqdn = `${upstreamName}.${chaosNamespace}.svc.cluster.local`
  upstreamVirtualServiceSpec.metadata.namespace = upstreamNamespace
  upstreamVirtualServiceSpec.spec.hosts = [
    ...upstreamVirtualServiceSpec.spec.hosts,
    chaosCanaryServicefqdn,
  ]
  const routeIndex = upstreamVirtualServiceSpec.spec.http
    .findIndex(route => route.name === upstreamNamespace)
  if (routeIndex === -1) {
    throw { message: `No route found for env '${upstreamNamespace}' in Virtual Service '${upstreamVirtualServiceSpec.metadata.name}'`}
  }
  // TODO: This can come from the client.
  const routingConf = {
    mirror: {
      host: chaosCanaryServicefqdn,
    },
    mirrorPercentage: {
      value: 100,
    },
  }
  upstreamVirtualServiceSpec.spec.http[routeIndex] = [
    ...upstreamVirtualServiceSpec.spec.http[routeIndex],
    ...routingConf,
  ]
  // const result = await applyJSObj(upstreamVirtualServiceSpec)
  const result = JSON.stringify(upstreamVirtualServiceSpec)
  return result
}

const addFailureToService = (service, namespace, faultSpec) => {
  const upstreamNamespace = 'production'
  const k8sYamls = `${path.resolve(path.dirname(__filename), '..')}/k8sYamls`
  const vServiceSpec = read(`${k8sYamls}/${service}/virtual-service.yaml`)
  vServiceSpec.metadata.namespace = namespace
  const routeIndex = vServiceSpec.spec.http
    .findIndex(route => route.name === upstreamNamespace)
  if (routeIndex === -1) {
    throw { message: `No route found for env '${upstreamNamespace}' in Virtual Service '${vServiceSpec.metadata.name}'` }
  }
  vServiceSpec.spec.http[routeIndex] = [
    ...vServiceSpec.spec.http[routeIndex],
    ...faultSpec,
  ]
  // const result = await applyJSObj(vServiceSpec)
  const result = JSON.stringify(vServiceSpec)
  return result
}

module.exports = {
  deployChaosCanaryCluster,
  addChaosCanaryRouting,
  addFailureToService,
}
