import * as fs from 'fs';
import * as path from 'path';
import { fnExportExists } from './fnExportExists';
import { createSourceFile } from './createSourceFile';

export function fnExportExistsByFilePath(filePath: string, fnName: string) {
  const fileName = path.resolve(process.cwd(), filePath);

  const sourceFile = createSourceFile(fs.readFileSync(fileName).toString(), fileName);

  return fnExportExists(sourceFile, fnName);
}
