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

const PLUGIN_NAME = 'ApolloEnvPlugin'
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

    map[key] = envKey

    if (
      // If in sandbox, we do not handle events
      isSandbox()
      // Already initalized
      || hasMap
    ) {
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

  ready () {
    const tasks = this._clients.map(client => client.ready())
    return Promise.all(tasks)
  }

  setAll (setter = setEnv) {
    this._clients.forEach(client => {
      const map = client[ENV_MAP_KEY]

      Object.keys(map).forEach(key => {
        const envKey = map[key]
        setter(envKey, client.get(key))
      })
    })
  }

  get sandbox () {
    return isSandbox()
  }

  apply (lifecycle) {
    lifecycle.hooks.sandboxEnvironment.tapPromise(
      PLUGIN_NAME,
      async sandbox => {
        // Configurations must be loaded outside the sandbox
        await this.ready()
        this.setAll(sandbox.setEnv)
      }
    )

    lifecycle.hooks.start.tap(PLUGIN_NAME, () => {
      this.ready().catch(err => {
        log(
          '%s: apollo fails to initialize when caviar starting, reason:\n%s',
          PLUGIN_NAME,
          err.stack
        )
      })
    })
  }
}

module.exports = ApolloEnvPlugin
