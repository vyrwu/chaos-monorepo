const k8s = require('@kubernetes/client-node');
const path = require('path')
const { read } = require('./util')

const deployChaosCanaryCluster = async (name, namespace) => {
  const kc = new k8s.KubeConfig();
  kc.loadFromDefault();
  // const appsV1 = kc.makeApiClient(k8s.AppsV1Api)
  const k8sYamls = `${path.resolve(path.dirname(__filename), '..')}/k8sYamls`
  const upstreamDeploySpec = read(`${k8sYamls}/${name}/deployment.yaml`)
  const chaosCanaryLabel = 'chaos-canary'
  upstreamDeploySpec.metadata.name = `${name}-chaos`
  upstreamDeploySpec.metadata.labels['deployment-type'] = chaosCanaryLabel
  upstreamDeploySpec.spec.selector.matchLabels['deployment-type'] = chaosCanaryLabel
  upstreamDeploySpec.spec.template.metadata.labels['deployment-type'] = chaosCanaryLabel
  // const deploymentResult = await appsV1.createNamespacedDeployment(namespace, upstreamDeploySpec)
  return JSON.stringify(upstreamDeploySpec)
}

const addChaosRouting = async (name, namespace, routeSpec) => {
  // const kc = new k8s.KubeConfig();
  // kc.loadFromDefault();
  // const appsV1 = kc.makeApiClient(k8s.AppsV1Api)
  const k8sYamls = `${path.resolve(path.dirname(__filename), '..')}/k8sYamls`
  const upstreamVirtualServiceSpec = read(`${k8sYamls}/${name}/virtual-service.yaml`)
  upstreamVirtualServiceSpec.spec.http = [
    ...upstreamVirtualServiceSpec.spec.http,
    {
      ...routeSpec,
      name: 'chaos-canary',
      route: {
        destination: {
          host: `${name}-chaos.default.svc.cluster.local`,
          subset: 'chaos-canary',
        },
      },
    },
  ]
  return JSON.stringify(upstreamVirtualServiceSpec)
}

const addChaosDestinationSubset = async (name, namespace) => {
  // const kc = new k8s.KubeConfig();
  // kc.loadFromDefault();
  // const appsV1 = kc.makeApiClient(k8s.AppsV1Api)
  const k8sYamls = `${path.resolve(path.dirname(__filename), '..')}/k8sYamls`
  const upstreamDestinationSpec = read(`${k8sYamls}/${name}/destination-rule.yaml`)
  upstreamDestinationSpec.spec.subsets = [
    ...upstreamDestinationSpec.spec.subsets,
    {
      name: 'chaos-canary',
      labels: {
        'deployment-type': 'chaos-canary',
      },
    },
  ]
  return JSON.stringify(upstreamDestinationSpec)
}

module.exports = { deployChaosCanaryCluster, addChaosRouting, addChaosDestinationSubset }
