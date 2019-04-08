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
    this._apollos = Object.create(null)
    this._tasks = []
  }

  add (envKey, config) {
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

    this._add(key, options)
  }

  _add (options) {
    const id = uniqueKey(options)
    if (id in this._apollos) {
      return
    }

    const apolloClient = apollo(options)
    const this._apollos[id] = apolloClient
  }

  apply (lifecycle) {
    // post env
    lifecycle.plugin('env', () => {
      const tasks = []

      Object.keys(this._envs).forEach(k => {
        const config = this._envs[k]


      })
    })
  }
}
