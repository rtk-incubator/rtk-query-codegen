import * as ts from 'typescript';
import { OpenAPIV3 } from 'openapi-types';

export type OperationDefinition = {
  path: string;
  verb: typeof operationKeys[number];
  pathItem: OpenAPIV3.PathItemObject;
  operation: OpenAPIV3.OperationObject;
};

export const operationKeys = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const;

export type GenerationOptions = {
  exportName?: string;
  reducerPath?: string;
  baseQuery?: string;
  argSuffix?: string;
  responseSuffix?: string;
  baseUrl?: string;
  createApiImportPath?: 'base' | 'react';
  hooks?: boolean;
  outputFile?: string;
  compilerOptions?: ts.CompilerOptions;
  isDataResponse?(code: string, response: OpenAPIV3.ResponseObject, allResponses: OpenAPIV3.ResponsesObject): boolean;
};

export interface CommonOptions extends GenerationOptions {
  //apiFile: string;
  schemaFile: string; // filename or url
  apiImport?: string; // defaults to "api"
  tsConfigFilePath?: string;
}

export interface OutputFileOptions extends Partial<GenerationOptions> {
  outputFile: string;
  filterEndpoints?: string | string[] | RegExp | RegExp[];
  endpointOverrides?: EndpointOverrides[];
}

export interface EndpointOverrides {
  pattern: string | string[] | RegExp | RegExp[];
  type: 'mutation' | 'query';
}

export type ConfigFile =
  | (CommonOptions & OutputFileOptions)
  | (Omit<CommonOptions, 'outputFile'> & {
      outputFiles: { [outputFile: string]: Omit<OutputFileOptions, 'outputFile'> };
    });
