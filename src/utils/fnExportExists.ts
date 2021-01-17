import * as ts from 'typescript';

export function fnExportExists(sourceFile: ts.SourceFile, fnName: string) {
  let found = false;

  ts.forEachChild(sourceFile, (node) => {
    const text = node.getText();
    if (ts.isExportAssignment(node)) {
      if (text.includes(fnName)) {
        found = true;
      }
    } else if (ts.isVariableStatement(node) || ts.isFunctionDeclaration(node) || ts.isExportDeclaration(node)) {
      if (text.includes(fnName) && text.includes('export')) {
        found = true;
      }
    } else if (ts.isExportAssignment(node)) {
      if (text.includes(`export ${fnName}`)) {
        found = true;
      }
    }
  });

  return found;
}
