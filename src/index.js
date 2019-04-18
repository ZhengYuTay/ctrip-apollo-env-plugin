const apollo = require('ctrip-apollo')
const log = require('util').debuglog('caviar-plugin-apollo-env')
const hasOwnProperty = require('has-own-prop')

const {error} = require('./error')

const APOLLO_APP_OPTIONS = [
  'host',
  'appId',
  'ip',
  'dataCenter'
]

const OVERRIDABLE_OPTIONS = [
  'host',
  'appId',
  'cluster',
  'namespace'
]

const ENV_MAP_KEY = Symbol('keyEnv')

const isSandbox = () => !process.env.CAVIAR_CWD

const createKey = (...args) =>
  Buffer.from(args.join('|')).toString('base64')

// Generate the unique key for apollo application
const uniqueKey = options => createKey(
  ...APOLLO_APP_OPTIONS.map(key => options[key])
)

const assignEnvOptions = (host, opts, envKey) => {
  Object.keys(opts).forEach(key => {
    if (OVERRIDABLE_OPTIONS.includes(key)) {
      host[key] = opts[key]
      return
    }

    throw error('INVALID_OPTION_FOR_KEY', key, envKey)
  })
}

const setEnv = (key, value) => {
  log('set env %s=%s', key, value)
  process.env[key] = value
}

class ApolloEnvPlugin {
  constructor ({
    envs,
    ...apolloOptions
  } = {}) {
    this._apolloOptions = apolloOptions
    this._envs = envs
    this._apollos = Object.create(null)
    this._nsMap = new Map()
    this._clients = []
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
  }, map) {
    const envKey = map[key]
    if (!envKey) {
      return
    }

    setEnv(envKey, newValue)
  }

  _generateApp (options) {
    return apollo(
      isSandbox()
        ? {
          ...options,
          // Do not enable update notification
          enableUpdateNotification: false,
          enableFetch: false,
          // Always fetch from remote first
          skipInitFetchIfCacheFound: false
        }
        : options
    )
  }

  _getApp (options) {
    const id = uniqueKey(options)

    const defined = id in this._apollos
    const app = defined
      ? this._apollos[id]
      : this._apollos[id] = this._generateApp(options)

    return app
  }

  // - envKey `string` env key name
  // - key `string` apollo config key name
  // - options `Object` apollo options
  _add (envKey, key, options) {
    const app = this._getApp(options)

    const client = app
    .cluster(options.cluster)
    .namespace(options.namespace)

    const hasMap = hasOwnProperty(client, ENV_MAP_KEY)

    if (!hasMap) {
      this._clients.push(client)
    }

    const map = hasMap
      ? client[ENV_MAP_KEY]
      : (client[ENV_MAP_KEY] = Object.create(null))

    // If in sandbox, we do not handle events
    if (isSandbox()) {
      return
    }

    map[key] = envKey

    if (hasMap) {
      // Already initalized
      return
    }

    client.on('change', e => {
      this._applyChange(e, map)
    })
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
    }

    assignEnvOptions(options, opts, envKey)

    this._add(envKey, key, options)
  }

  _setEnv () {
    Object.keys(this._envKeyConfig).forEach(envKey => {
      const {key, id} = this._envKeyConfig[envKey]
      const client = this._apollos[id]
      setEnv(envKey, client.get(key))
    })
  }

  apply (lifecycle) {
    // post env
    lifecycle.hooks.environment.tapPromise('ApolloEnvPlugin', async () => {
      Object.keys(this._envs).forEach(k => {
        this._addEnv(k, this._envs[k])
      })

      await Promise.all(this._tasks)
      this._setEnv()
    })
  }
}

module.exports = ApolloEnvPlugin
