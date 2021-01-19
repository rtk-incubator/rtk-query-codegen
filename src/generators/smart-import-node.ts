import * as ts from 'typescript';
import * as fs from 'fs';
import fetch from 'node-fetch';

import { isValidUrl, MESSAGES, stripFileExtension } from '../utils';
import { isModuleInsidePathAlias } from '../utils/isModuleInsidePathAlias';
import { generateImportNode } from './import-node';
import { fnExportExists } from '../utils/fnExportExists';
import { resolveImportPath } from '../utils/resolveImportPath';
import { fnExportExistsByFilePath } from '../utils/fnExportExistsByFilePath';
import { createSourceFile } from '../utils/createSourceFile';

type SmartGenerateImportNode = {
  moduleName: string;
  containingFile?: string;
  importTarget: string;
  importTargetAlias: string;
  compilerOptions?: ts.CompilerOptions;
};
export const generateSmartImportNode = async ({
  moduleName,
  containingFile,
  importTarget,
  importTargetAlias,
  compilerOptions,
}: SmartGenerateImportNode): Promise<ts.ImportDeclaration> => {
  if (fs.existsSync(moduleName)) {
    if (fnExportExistsByFilePath(moduleName, importTarget)) {
      return generateImportNode(
        stripFileExtension(containingFile ? resolveImportPath(moduleName, containingFile) : moduleName),
        {
          [importTarget]: importTargetAlias,
        }
      );
    }

    if (importTarget === 'default') {
      throw new Error(MESSAGES.DEFAULT_EXPORT_MISSING);
    }
    throw new Error(MESSAGES.NAMED_EXPORT_MISSING);
  }

  if (!compilerOptions) {
    throw new Error(MESSAGES.FILE_NOT_FOUND);
  }

  // maybe moduleName is path alias
  const maybeFullPath = isModuleInsidePathAlias(compilerOptions, moduleName);
  if (maybeFullPath && fnExportExistsByFilePath(maybeFullPath, importTarget)) {
    return generateImportNode(stripFileExtension(moduleName), {
      [importTarget]: importTargetAlias,
    });
  }

  // maybe moduleName is url. eg. https://deno.land/std/http/server.ts
  if (isValidUrl(moduleName)) {
    const response = await fetch(moduleName);
    if (response.ok) {
      const maybeJsOrTsFile = await response.text();
      if (fnExportExists(createSourceFile(maybeJsOrTsFile), importTarget)) {
        return generateImportNode(moduleName, {
          [importTarget]: importTargetAlias,
        });
      }

      if (importTarget === 'default') {
        throw new Error(MESSAGES.DEFAULT_EXPORT_MISSING);
      }
      throw new Error(MESSAGES.NAMED_EXPORT_MISSING);
    }

    throw new Error(MESSAGES.URL_NOT_FOUND);
  }

  throw new Error(MESSAGES.FILE_NOT_FOUND);
};
