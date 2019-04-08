module.exports = {
  extends: require.resolve('eslint-config-ostai'),
  rules: {
    // We use Object.create(null) instead
    'guard-for-in': 0,
    // As well as
    'no-restricted-syntax': 0
  }
}
