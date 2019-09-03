const apollo = require('apollo-declare')
const log = require('util').debuglog('caviar-plugin-apollo-env')

const PLUGIN_NAME = 'ApolloEnvPlugin'

const isNotInSandbox = () => !process.env.CAVIAR_SANDBOX

const setEnv = (key, value) => {
  log('set env %s=%s', key, value)
  process.env[key] = value
}

class ApolloEnvPlugin {
  constructor ({
    keys,
    ...apolloOptions
  } = {}) {
    this._apolloOptions = apolloOptions
    this._keys = keys
    this._app = this._generateApp()
  }

  _generateApp () {
    const sandbox = isNotInSandbox()
    const options = sandbox
      ? {
        ...this._apolloOptions,
        // Do not enable update notification
        enableUpdateNotification: false,
        enableFetch: false,
        // Always fetch from remote first
        skipInitFetchIfCacheFound: false
      }
      : this._apolloOptions

    const app = apollo({
      ...options,
      keys: this._keys
    })

    if (!sandbox) {
      app.on('change', ({key, newValue}) => {
        setEnv(key, newValue)
      })
    }

    return app
  }

  ready () {
    return this._app.ready()
  }

  setAll (setter = setEnv) {
    this._app.each((value, key) => {
      setter(key, value)
    })
  }

  get sandbox () {
    return isNotInSandbox()
  }

  apply (getHooks) {
    const hooks = getHooks()

    if (isNotInSandbox()) {
      hooks.sandboxEnvironment.tapPromise(
        PLUGIN_NAME,
        async sandbox => {
          // Configurations must be loaded outside the sandbox
          await this.ready()
          this.setAll(sandbox.setEnv)
        }
      )

      return
    }

    hooks.start.tap(PLUGIN_NAME, () => {
      // Then the process inside the sandbox could receive
      // apollo update notifications
      this.ready().catch(err => {
        // eslint-disable-next-line no-console
        console.error(
          `${PLUGIN_NAME}: apollo fails to initialize when caviar starting, reason:\n`,
          err.stack
        )
      })
    })
  }
}

module.exports = ApolloEnvPlugin
