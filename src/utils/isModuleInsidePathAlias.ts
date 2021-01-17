import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import globToRegExp from 'glob-to-regexp';

function isAlias(glob: string, moduleName: string): boolean {
  return globToRegExp(glob).test(moduleName);
}

const ext = ['js', 'ts'];
function getFullPathIfExistsModule(moduleName: string): string | false {
  if (/\.(ts|js)$/.test(moduleName)) {
    return fs.existsSync(moduleName) ? moduleName : false;
  }
  for (let i = 0; i < ext.length; i++) {
    const fullPath = `${moduleName}.${ext[i]}`;
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  return false;
}

export function isModuleInsidePathAlias(options: ts.CompilerOptions, moduleName: string): string | false {
  if (!(options.paths && options.baseUrl)) {
    return fs.existsSync(moduleName) ? moduleName : false;
  }

  let baseUrl = options.baseUrl;
  if (!/\/$/.test(baseUrl)) {
    baseUrl = `${baseUrl}/`;
  }

  for (const glob in options.paths) {
    if (isAlias(glob, moduleName)) {
      const before = glob.replace('*', '');
      for (let i = 0; i < options.paths[glob].length; i++) {
        const after = options.paths[glob][i].replace('*', '');
        const maybeFullPath = getFullPathIfExistsModule(path.resolve(baseUrl, after, moduleName.replace(before, '')));
        if (maybeFullPath) {
          return maybeFullPath;
        }
      }
    }
  }

  return false;
}
