export default {
  testEnvironment: 'jsdom',
  transform: { '^.+\\.[tj]sx?$': '@swc/jest' },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapper: {
    '^@cms/shared$': '<rootDir>/../shared/src/index.ts',
    '\\.module\\.css$': 'identity-obj-proxy',
  },
};
