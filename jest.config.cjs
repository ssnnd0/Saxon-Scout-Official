/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/app/src'],
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/app/tsconfig.json' }],
  },
  setupFilesAfterEnv: [],
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(ts|tsx)$',
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
};
