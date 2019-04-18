const {Errors} = require('err-object')

const {E, error} = new Errors({
  prefix: '[@caviar/plugin-apollo-env] '
})

E('INVALID_OPTION_FOR_KEY', 'options.%s is not allowed for a certain env "%s"')

module.exports = {
  error
}
