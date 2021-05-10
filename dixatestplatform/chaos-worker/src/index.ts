// take mode parameter
// needs to take some data in
import * as k8s from '@kubernetes/client-node'
import yaml from 'js-yaml';
import fs from 'fs';

const [mode, upstreamService, downstreamsService, istioRoute] = process.argv.slice(2)

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const defaultNamespace = 'default'
const deployCanary = async () => {

  const updateNetworking = async () => {
    const customObj = kc.makeApiClient(k8s.CustomObjectsApi)
    // update VirtualService
    const vsSpec: any = fs.readFileSync('./src/assets/virtual-service.yaml')

    // const virtualServiceResponse = await customObj.getNamespacedCustomObject('networking.istio.io', 'v1alpha3', defaultNamespace, 'virtualservice', `${upstreamService}`)

    const client = kc.makeApiClient(k8s.KubernetesObjectApi)

    const virtualServiceResponse = { body: (yaml.safeLoad(vsSpec) as any) }
    
    const spec = {
      ...virtualServiceResponse.body,
      spec: {
        ...virtualServiceResponse.body.spec,
        http: [
          ...virtualServiceResponse.body.spec.http,
          {
            ...JSON.parse(istioRoute)
          }
        ]
      }
    }

    console.log(JSON.stringify(spec))
    // try {
    //   await client.read(spec);
    //   // we got the resource, so it exists, so patch it
    //   await client.patch(spec);
    // } catch (e) {
    //   console.log(e)
    //   throw new Error(`Virtual Service '${spec.metadata.name}' does not exist.`)
    // }

    // await customObj.patchNamespacedCustomObject('networking.istio.io', 'v1alpha3', defaultNamespace, 'virtualservice', `${upstreamService}`, payload)
    // add Destination for new deploy
  }

   console.log(await Promise.all([
    redeployUpstreamDeploy(),
    updateNetworking(),
  ]))
}


deployCanary().catch(err => {
  console.log(err)
  throw new Error()
})

// setTimeout(() => {
//   console.log('Test finished\n')
// }, 10000)
// if mode = canary

//   update run(running)
//   await some time and collect any information you want. Evaluate wether test PASS or FAIL
//   update run with results (finished)
//   clean-up chaos resources

// 


// Deploy a separate cluser if canary

// replicate the deployment
// kubectl get deploy
// make that deployment with changed name (a.k.a. deploy-canary)
// What I need
// 1. Destination for a Canary service (conversation-chaos)
// 2. Virtual Service (Upstream) -> split incoming traffic to normal and canary
// 3. Virtual Service (Downstream)\

// Should how to pass parameters to docker image

