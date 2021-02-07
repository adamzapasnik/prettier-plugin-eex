'use strict';
const ENABLE_CODE_COVERAGE = !!process.env.ENABLE_CODE_COVERAGE;

module.exports = {
  setupFiles: ['<rootDir>/tests_config/run_spec.js'],
  snapshotSerializers: ['jest-snapshot-serializer-raw'],
  testRegex: 'jsfmt\\.spec\\.js$|tests/.*\\.js$',
  collectCoverage: ENABLE_CODE_COVERAGE,
  testEnvironment: 'node',
  transform: {},
};
