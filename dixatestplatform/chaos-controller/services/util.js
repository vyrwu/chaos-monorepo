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

module.exports = {
  validateChaosTestInputs,
}
