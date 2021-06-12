const { ChaosController } = require('@vyrwu/ts-api')

const validateChaosTestInputs = (mode, routingSpec) => {
  const { Canary, Production } = ChaosController.RunModeEnum
  if (![Canary, Production].includes(mode)) {
    return { message: `Unsupported mode '${mode}'`, code: 400 }
  }
  if (routingSpec && mode !== Canary) {
    return { message: `RoutingSpec is not supported for '${mode}' mode.`, code: 400 }
  }
  return null
}

module.exports = {
  validateChaosTestInputs,
}
