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
  extends: ['airbnb-base', 'eslint:recommended', 'plugin:prettier/recommended'],
  plugins: ['prettier'],
  rules: {
    'brace-style': ['error', '1tbs'],
    'constructor-super': 'error',
    curly: ['error', 'all'],
    eqeqeq: ['error', 'always', { null: 'ignore' }],
    'linebreak-style': ['error', 'unix'],
    'max-len': ['error', { code: 120, ignoreUrls: true }],
    'no-const-assign': 'error',
    'no-tabs': 'error',
    'no-this-before-super': 'error',
    'no-throw-literal': 'error',
    'no-undef': 'error',
    'no-unreachable': 'error',
    'no-unused-expressions': 'error',
    'no-extra-boolean-cast': 0,
    'no-unused-vars': ['error', { vars: 'all', args: 'after-used', ignoreRestSiblings: true }],
    'no-debugger': 'error',
    'prettier/prettier': ['error', { singleQuote: true }],
    'sort-imports': 'error',
    'valid-typeof': 'error'
  }
};
