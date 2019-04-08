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
        && config.namespace === namespace
        && config.cluster === cluster
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

  // - envKey `string` env key name
  // - key `string` apollo config key name
  // - options `Object` apollo options
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

    client.on('change', e => {
      this._applyChange(e, namespace, cluster)
    })

    this._tasks.push(client.ready())
  }

  _addEnv (envKey, config) {
    const {
      key,
      ...opts
    } = typeof config === 'string'
      // 'REDIS_HOST': 'redis.host'
      ? {
        key: config
      }
      // 'REDIS_HOST': {
      //   key: 'redis.host',
      //   namespace: 'common'
      // }
      : config

    // Merge with the default options
    const options = {
      ...this._apolloOptions,
      ...opts
    }

    this._add(envKey, key, options)
  }

  _setEnv () {
    Object.keys(this._envKeyConfig).forEach(envKey => {
      const {key, id} = this._envKeyConfig[envKey]
      const client = this._apollos[id]
      process.env[envKey] = client.get(key)
    })
  }

  apply (lifecycle) {
    // post env
    lifecycle.hooks.environment.tapPromise('ApolloEnvPlugin', async context => {
      context.clearPlugins()

      Object.keys(this._envs).forEach(k => {
        this._addEnv(k, this._envs[k])
      })

      await Promise.all(this._tasks)
      this._setEnv()
      context.reloadConfig()
      context.applyPlugins()
    })
  }
}

module.exports = ApolloEnvPlugin
