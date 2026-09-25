const js = require('@eslint/js');
const jsdoc = require('eslint-plugin-jsdoc');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  js.configs.recommended,
  prettierConfig,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'readonly',
        process: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Plain JS has no other source of types, so every function in api/ needs typed JSDoc.
    files: ['api/**/*.js'],
    ...jsdoc.configs['flat/recommended-error'],
    rules: {
      ...jsdoc.configs['flat/recommended-error'].rules,
      'jsdoc/require-jsdoc': [
        'error',
        { require: { FunctionDeclaration: true, FunctionExpression: true } },
      ],
      'jsdoc/require-param-description': 'off',
      'jsdoc/require-returns-description': 'off',
    },
  },
];
