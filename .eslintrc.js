module.exports = {
  env: {
    node: true,
    browser: true,
    commonjs: true,
    es2021: true,
  },
  extends: 'eslint:recommended',
  // extends: "airbnb",
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    indent: ['error', 2, { 'SwitchCase': 1 }],
    quotes: [1, 'single'],
    semi: ['error', 'never'],
    'no-use-before-define': ['error', { functions: false, classes: false }],
    'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
    'linebreak-style': 0,
  },
}
