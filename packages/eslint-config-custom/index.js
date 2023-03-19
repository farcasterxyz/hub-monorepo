module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:security/recommended',
  ],
  plugins: ['prefer-arrow-functions'],
  ignorePatterns: ['**/generated/*', '**/.config'],
  rules: {
    '@typescript-eslint/ban-ts-ignore': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'ethers',
            importNames: ['logger'],
            message: 'Did you mean to import ~/utils/logger instead?',
          },
        ],
      },
    ],
    'prefer-arrow-functions/prefer-arrow-functions': 'error',
    'no-console': 'error',
  },
};