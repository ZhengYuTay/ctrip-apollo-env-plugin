[![Build Status](https://travis-ci.org/kaelzhang/roe-plugin-apollo-env.svg?branch=master)](https://travis-ci.org/kaelzhang/roe-plugin-apollo-env)
[![Coverage](https://codecov.io/gh/kaelzhang/roe-plugin-apollo-env/branch/master/graph/badge.svg)](https://codecov.io/gh/kaelzhang/roe-plugin-apollo-env)
<!-- optional appveyor tst
[![Windows Build Status](https://ci.appveyor.com/api/projects/status/github/kaelzhang/roe-plugin-apollo-env?branch=master&svg=true)](https://ci.appveyor.com/project/kaelzhang/roe-plugin-apollo-env)
-->
<!-- optional npm version
[![NPM version](https://badge.fury.io/js/roe-plugin-apollo-env.svg)](http://badge.fury.io/js/roe-plugin-apollo-env)
-->
<!-- optional npm downloads
[![npm module downloads per month](http://img.shields.io/npm/dm/roe-plugin-apollo-env.svg)](https://www.npmjs.org/package/roe-plugin-apollo-env)
-->
<!-- optional dependency status
[![Dependency Status](https://david-dm.org/kaelzhang/roe-plugin-apollo-env.svg)](https://david-dm.org/kaelzhang/roe-plugin-apollo-env)
-->

# roe-plugin-apollo-env

[Roe](https://github.com/kaelzhang/roe) plugin to apply configurations from Ctrip's [apollo](https://github.com/ctripcorp/apollo) config service to `process.env`

## Install

```sh
$ npm i roe-plugin-apollo-env
```

## Usage

roe.config.js

```js
const ApolloEnvPlugin = require('roe-plugin-apollo-env')

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
