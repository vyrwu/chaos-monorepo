const k8s = require('@kubernetes/client-node')
const fs = require('fs')
const yaml = require('js-yaml')
const { promisify } = require('util')

/**
 * Replicate the functionality of `kubectl apply`.  That is, create the resources
 * defined in the `specFile` if they do not exist, patch them if they do exist.
 *
 * @param specPath File system path to a YAML Kubernetes spec.
 * @return Array of resources created
 */
async function apply(specPath) {
  const kc = new k8s.KubeConfig();
  kc.loadFromDefault();
  const client = k8s.KubernetesObjectApi.makeApiClient(kc);
  const fsReadFileP = promisify(fs.readFile);
  const specString = await fsReadFileP(specPath, 'utf8');
  const specs = yaml.safeLoadAll(specString);
  const validSpecs = specs.filter((s) => s && s.kind && s.metadata);
  const created = await Promise.all(
    validSpecs.map(async (vSpec) => {
      const spec = vSpec
      spec.metadata = spec.metadata || {};
      spec.metadata.annotations = spec.metadata.annotations || {};
      delete spec.metadata.annotations['kubectl.kubernetes.io/last-applied-configuration'];
      spec.metadata.annotations['kubectl.kubernetes.io/last-applied-configuration'] = JSON.stringify(spec);
      try {
        await client.read(spec);
        // we got the resource, so it exists, so patch it
        const response = await client.patch(spec);
        return response.body;
      } catch (e) {
        // we did not get the resource, so it does not exist, so create it
        const response = await client.create(spec);
        return response.body;
      }
    }),
  )
  return created;
}

module.exports = { apply }