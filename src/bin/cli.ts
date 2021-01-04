#!/usr/bin/env node

import path = require('path')
import program = require('commander')

// tslint:disable-next-line
const meta = require('../../package.json')
import { generateApi } from '../generate'
import { GenerationOptions } from '../type'

program
  .version(meta.version)
  .usage('</path/to/some-swagger.yaml>')
  .option('--exportName <name>', 'change RTK Query Tree root name')
  .option('--reducerPath <path>', 'pass reducer path')
  .option('--baseQuery <name>', 'pass baseQuery name')
  .option('--argSuffix <name>', 'pass arg suffix')
  .option('--responseSuffix <name>', 'pass response suffix')
  .option('--baseUrl <url>', 'pass baseUrl')
  .option('-h, --hooks', 'generate React Hooks')
  .parse(process.argv)

if (program.args.length === 0) {
  program.help()
} else {
  const schemaAbsPath = path.resolve(process.cwd(), program.args[0])

  const options = [
    'exportName',
    'reducerPath',
    'baseQuery',
    'argSuffix',
    'responseSuffix',
    'baseUrl',
    'hooks',
  ] as const

  const generateApiOptions = options.reduce((s, key) => program[key] ? ({
    ...s,
    [key]: program[key]
  }) : s, {} as GenerationOptions);
  generateApi(schemaAbsPath, generateApiOptions).then(sourceCode => console.log(sourceCode))
}
