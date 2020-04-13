"use strict";
const ENABLE_CODE_COVERAGE = !!process.env.ENABLE_CODE_COVERAGE;

module.exports = {
  setupFiles: ["<rootDir>/tests_config/run_spec.js"],
  snapshotSerializers: [
    "jest-snapshot-serializer-raw",
    // "jest-snapshot-serializer-ansi",
  ],
  testRegex: "jsfmt\\.spec\\.js$|__tests__/.*\\.js$",
  collectCoverage: ENABLE_CODE_COVERAGE,
  // collectCoverageFrom: ["src/**/*.js",  "<rootDir>/src/**/*.js",
  // "!<rootDir>/node_modules/",
  // "!<rootDir>/tests_config/", "!<rootDir>/node_modules/"],
  // coveragePathIgnorePatterns: [
  //   "<rootDir>/standalone.js",
  //   "<rootDir>/src/document/doc-debug.js",
  //   "<rootDir>/src/main/massage-ast.js",
  // ],
  // coverageReporters: ["text", "lcov"],
  testEnvironment: "node",
  transform: {},
};
