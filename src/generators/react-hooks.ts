import _ from "lodash";
import { getOperationName } from "oazapfts/lib/codegen/generate";
import * as ts from "typescript";
import { factory } from "typescript";

import { OperationDefinition } from "../type";
import { isQuery } from "../utils/isQuery";

type GetReactHookNameParams = {
  operationDefinition: OperationDefinition;
}

const getReactHookName = ({ operationDefinition: { verb, path, operation } }: GetReactHookNameParams) => factory.createBindingElement(
  undefined,
  undefined,
  factory.createIdentifier(
    `use${_.upperFirst(
      getOperationName(verb, path, operation.operationId)
    )}${isQuery(verb) ? 'Query' : 'Mutation'}`
  ),
  undefined
)

type GenerateReactHooksParams = {
  exportName: string
  operationDefinitions: OperationDefinition[]
}
export const generateReactHooks = ({ exportName, operationDefinitions }: GenerateReactHooksParams) => factory.createVariableStatement(
  [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
  factory.createVariableDeclarationList(
    [factory.createVariableDeclaration(
      factory.createObjectBindingPattern(
        operationDefinitions.map(operationDefinition => getReactHookName({ operationDefinition }))
      ),
      undefined,
      undefined,
      factory.createIdentifier(exportName)
    )],
    ts.NodeFlags.Const
  )
)
