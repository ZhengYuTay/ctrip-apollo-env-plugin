[![Build Status](https://travis-ci.org/caviarjs/ctrip-apollo-env-plugin.svg?branch=master)](https://travis-ci.org/caviarjs/ctrip-apollo-env-plugin)
[![Coverage](https://codecov.io/gh/caviarjs/ctrip-apollo-env-plugin/branch/master/graph/badge.svg)](https://codecov.io/gh/caviarjs/ctrip-apollo-env-plugin)

# @caviar/ctrip-apollo-env-plugin

[Caviar](https://github.com/caviarjs/caviar) plugin to apply configurations from Ctrip's [apollo](https://github.com/ctripcorp/apollo) config service to `process.env`

## Install

```sh
$ npm i @caviar/ctrip-apollo-env-plugin
```

## Usage

Caviar.config.js

```js
const ApolloEnvPlugin = require('@caviar/ctrip-apollo-env-plugin')

module.exports = {
  plugins: [
    new ApolloEnvPlugin({
      host: process.env.APOLLO_HOST,
      appId: 'my-app',
      namespace: 'application',
      envs: {
        REDIS_HOST: 'redis.host',

        REDIS_PORT: {
          key: 'redis.port',
          // We can override the default namespace 'application'
          namespace: 'common'
        }
      }
    })
  ],
  ...
}
```

## new ApolloEnvPlugin(options)

- **options** `Object`
  - **envs** `{[string]: string | ConfigOptions}` pair of environment variable key and configuration key
  - ...**CtripApolloOptions** options of [`ctrip-apollo`](https://github.com/kaelzhang/ctrip-apollo)

```ts
interface ConfigOptions {
  // Configuration key name
  key: string

  // options of `ctrip-apollo` which could override the default options
  ...CtripApolloOptions
}
```

## License

MIT
