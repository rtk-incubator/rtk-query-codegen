const { resolve } = require('path');

const tsConfigPath = resolve('./test/tsconfig');

/** @typedef {import('ts-jest/dist/types')} */
/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
  rootDir: './test',
  globals: {
    'ts-jest': {
      tsconfig: tsConfigPath,
    },
  },
};

module.exports = config;
