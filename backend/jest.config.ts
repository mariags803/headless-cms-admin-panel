export default {
  testEnvironment: 'node',
  transform: { '^.+\\.[tj]sx?$': '@swc/jest' },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapper: {
    '^@cms/shared$': '<rootDir>/../shared/src/index.ts'
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
