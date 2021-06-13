const k8s = require('@kubernetes/client-node')
const shell = require('shelljs')
const fs = require('fs')
const yaml = require('js-yaml')
const { promisify } = require('util')
const { ChaosController } = require('@vyrwu/ts-api')

const validateChaosTestInputs = (mode, routingSpec) => {
  const { Canary, Production } = ChaosController.RunModeEnum
  if (![Canary, Production].includes(mode)) {
    return { message: `Unsupported mode '${mode}'`, code: 400 }
  }
  if (mode === Canary && !routingSpec) {
    return { message: `Missing RoutingSpec. It must be provided for '${mode}' mode.`, code: 400 }
  }
  return null
}

const applySpec = async (spec) => {
  const apply = shell.exec(`echo "${yaml.dump(spec)}" | kubectl apply -f -`)
  if (apply.code !== 0) {
    throw { message: `'kubectl apply -f ...' exitted with '${apply.code}': ${apply.stderr}`, code: 500 }
  }
  return spec
}

/**
 * Replicate the functionality of `kubectl apply`.  That is, create the resources
 * defined in the `specFile` if they do not exist, patch them if they do exist.
 *
 * @param specPath File system path to a YAML Kubernetes spec.
 * @return Array of resources created
 */
async function applyFile(specPath, namespace) {
  const fsReadFileP = promisify(fs.readFile);
  const specString = await fsReadFileP(specPath, 'utf8');
  const specs = yaml.safeLoadAll(specString);
  const validSpecs = specs
    .filter((s) => s && s.kind && s.metadata)
    .map((spec) => {
      if (!namespace) {
        return spec
      }
      const namespacedSpec = spec
      namespacedSpec.metadata.namespace = namespace
      return namespacedSpec
    });
  const created = await Promise.all(
    validSpecs.map(async (vSpec) => {
      const spec = vSpec
      spec.metadata = spec.metadata || {};
      spec.metadata.annotations = spec.metadata.annotations || {};
      delete spec.metadata.annotations['kubectl.kubernetes.io/last-applied-configuration'];
      spec.metadata.annotations['kubectl.kubernetes.io/last-applied-configuration'] = JSON.stringify(spec);
      await applySpec(spec)
    }),
  )
  return created;
}

function read(specPath) {
  const specString = fs.readFileSync(specPath, 'utf8');
  const spec = yaml.safeLoad(specString);
  return spec
}

async function createK8sNamespace(name, labels) {
  const kc = new k8s.KubeConfig();
  kc.loadFromDefault();
  const coreV1 = kc.makeApiClient(k8s.CoreV1Api);
  const result = await coreV1.createNamespace({
    apiVersion: 'v1',
    kind: 'Namespace',
    metadata: {
      name,
      labels,
    },
  })
  return result
}

module.exports = {
  applyFile,
  read,
  applySpec,
  createK8sNamespace,
  validateChaosTestInputs,
}
