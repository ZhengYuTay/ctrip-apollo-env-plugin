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
    this._envKeyConfig = Object.create(null)
  }

  _findEnvKey (key, namespace, cluster) {
    for (const envKey in this._envKeyConfig) {
      const config = this._envKeyConfig[envKey]
      if (
        config.key === key
        && config.namespace === config.namespace
        && config.cluster === config.cluster
      ) {
        return envKey
      }
    }
  }

  _applyChange ({
    newValue, key
  }, namespace, cluster) {
    const envKey = this._findEnvKey(key, namespace, cluster)
    if (!envKey) {
      return
    }

    process.env[envKey] = newValue
  }

  _add (envKey, key, options) {
    const id = uniqueKey(options)

    const defined = id in this._apollos
    const client = defined
      ? this._apollos[id]
      : this._apollos[id] = apollo(options)

    const {
      namespace,
      cluster
    } = client

    this._envKeyConfig[envKey] = {
      key,
      id,
      namespace,
      cluster
    }

    if (defined) {
      return
    }

    apolloClient.on('change', e => {
      this._applyChange(e, namespace, cluster)
    })

    this._tasks.push(() => apolloClient.ready())
  }

  _addEnv (envKey, config) {
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

    this._add(envKey, key, options)
  }

  _setEnv () {
    Object.keys(this._envKeyConfig).forEach(envKey => {
      const {key, id} = this._envKeyConfig[envKey]
      const apollo = this._apollos[id]
      process.env[envKey] = apollo.get(key)
    })
  }

  apply (lifecycle) {
    // post env
    lifecycle.plugin('env', async () => {
      const tasks = []

      Object.keys(this._envs).forEach(k => {
        this._addEnv(k, this._envs[k])
      })

      await Promise.all(this._tasks)
      this._setEnv()
    })
  }
}
