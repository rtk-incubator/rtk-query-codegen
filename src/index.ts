#!/usr/bin/env node

import * as path from 'path';
import * as fs from 'fs';
import { generateApi } from './generate';
import { isValidUrl, MESSAGES, prettify } from './utils';
import type { CommonOptions, OutputFileOptions } from './types';
import { getCompilerOptions } from './utils/getTsConfig';

export async function generateEndpoints({
  schemaFile,
  outputFile,
  tsConfigFilePath,
  ...options
}: CommonOptions & OutputFileOptions) {
  try {
    const schemaAbsPath = isValidUrl(schemaFile) ? schemaFile : path.resolve(process.cwd(), schemaFile);
    if (tsConfigFilePath) {
      tsConfigFilePath = path.resolve(tsConfigFilePath);
      if (!fs.existsSync(tsConfigFilePath)) {
        throw Error(MESSAGES.TSCONFIG_FILE_NOT_FOUND);
      }
    }

    const compilerOptions = getCompilerOptions(tsConfigFilePath);
    const generateApiOptions = { ...options, outputFile, compilerOptions };

    var sourceCode = await generateApi(schemaAbsPath, generateApiOptions);
    if (outputFile) {
      fs.writeFileSync(path.resolve(process.cwd(), outputFile), await prettify(outputFile, sourceCode));
    } else {
      console.log(await prettify(null, sourceCode));
    }
  } catch (error) {
    console.error(error);
  }
}
