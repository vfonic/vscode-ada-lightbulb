module.exports = {
  env: {
    browser: false,
    commonjs: true,
    es6: true,
    node: true
  },
  parserOptions: {
    ecmaFeatures: {
      modules: true
    },
    sourceType: 'module'
  },
  extends: ['eslint:recommended', 'plugin:prettier/recommended'],
  plugins: ['prettier'],
  rules: {
    eqeqeq: ['error', 'always', { null: 'ignore' }],
    'no-const-assign': 'error',
    'no-this-before-super': 'error',
    'no-throw-literal': 'error',
    'no-undef': 'error',
    'no-unreachable': 'error',
    'no-unused-expressions': 'error',
    'constructor-super': 'error',
    'valid-typeof': 'error',
    'prettier/prettier': 'error',
    'no-extra-boolean-cast': 0,
    'no-unused-vars': ['error', { vars: 'all', args: 'after-used', ignoreRestSiblings: true }],
    'no-debugger': 'error',
    curly: ['error', 'all'],
    'brace-style': ['error', '1tbs'],
    'linebreak-style': ['error', 'unix'],
    'sort-imports': 'error'
  }
};
