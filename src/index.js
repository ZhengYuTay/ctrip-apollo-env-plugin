const apollo = require('ctrip-apollo')

const {AVAILABLE_OPTIONS} = apollo

const createKey = (...args) =>
  Buffer.from(args.join('|')).toString('base64')

const uniqueKey = options => createKey(
  ...AVAILABLE_OPTIONS.map(key => options[key])
)

class ApolloEnvPlugin {
  constructor ({
    envs,
    ...apolloOptions
  } = {}) {
    this._apolloOptions = apolloOptions
    this._envs = envs
  }

  apply (lifecycle) {
    const apollos = {}

    // post env
    lifecycle.plugin('env', () => {
      const tasks = []

      Object.keys(this._envs).forEach(k => {
        const config = this._envs[k]
        const {
          key,
          ...opts
        } = typeof config === 'string'
          ? {
            key: config
          }
          : config

        const options = {
          ...this._apolloOptions,
          ...opts
        }

        const id = uniqueKey(options)
      })
    })
  }
}
