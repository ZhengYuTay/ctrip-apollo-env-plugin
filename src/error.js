const {Errors} = require('err-object')

const {E, error} = new Errors({
  prefix: '[@caviar/ctrip-apollo-env-plugin] '
})

E('INVALID_OPTION_FOR_KEY', 'options.%s is not allowed for a certain env "%s"')

module.exports = {
  error
}
