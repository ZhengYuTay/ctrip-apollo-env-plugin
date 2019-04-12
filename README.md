[![Build Status](https://travis-ci.org/kaelzhang/caviar-plugin-apollo-env.svg?branch=master)](https://travis-ci.org/kaelzhang/caviar-plugin-apollo-env)
[![Coverage](https://codecov.io/gh/kaelzhang/caviar-plugin-apollo-env/branch/master/graph/badge.svg)](https://codecov.io/gh/kaelzhang/caviar-plugin-apollo-env)

# @caviar/plugin-apollo-env

[Caviar](https://github.com/kaelzhang/caviar) plugin to apply configurations from Ctrip's [apollo](https://github.com/ctripcorp/apollo) config service to `process.env`

## Install

```sh
$ npm i @caviar/plugin-apollo-env
```

## Usage

Caviar.config.js

```js
const ApolloEnvPlugin = require('@caviar/plugin-apollo-env')

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
          namespace: 'common'
        }
      }
    })
  ],
  ...
}
```

## License

MIT
