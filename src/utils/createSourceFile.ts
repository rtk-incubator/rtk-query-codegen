import * as ts from 'typescript';

export function createSourceFile(blob: string, fileName = '') {
  return ts.createSourceFile(fileName, blob, ts.ScriptTarget.ESNext, /*setParentNodes */ true);
}
