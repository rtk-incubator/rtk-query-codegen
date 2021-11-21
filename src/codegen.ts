import * as ts from 'typescript';
import semver from 'semver';
const { factory } = ts;
import { GenerationOptions } from './types';

const defaultEndpointBuilder = factory.createIdentifier('build');

export type ObjectPropertyDefinitions = Record<string, ts.Expression>;
export function generateObjectProperties(obj: ObjectPropertyDefinitions) {
  return Object.entries(obj).map(([k, v]) => factory.createPropertyAssignment(factory.createIdentifier(k), v));
}

export function generateStringLiteralArray(arr: string[]) {
  return factory.createArrayLiteralExpression(
    arr.map((elem) => factory.createStringLiteral(elem)),
    false
  );
}

export function createImportSpecifier(
  propertyName: ts.Identifier | undefined,
  name: ts.Identifier
): ts.ImportSpecifier {
  if (semver.satisfies(ts.version, '>= 4.5'))
    // @ts-ignore
    return factory.createImportSpecifier(false, propertyName, name);
  // @ts-ignore
  return factory.createImportSpecifier(propertyName, name);
}

export function generateImportNode(pkg: string, namedImports: Record<string, string>, defaultImportName?: string) {
  return factory.createImportDeclaration(
    undefined,
    undefined,
    factory.createImportClause(
      false,
      defaultImportName !== undefined ? factory.createIdentifier(defaultImportName) : undefined,
      factory.createNamedImports(
        Object.entries(namedImports).map(([propertyName, name]) =>
          createImportSpecifier(
            name === propertyName ? undefined : factory.createIdentifier(propertyName),
            factory.createIdentifier(name)
          )
        )
      )
    ),
    factory.createStringLiteral(pkg)
  );
}

export function generateCreateApiCall({
  exportName,
  reducerPath,
  createApiFn,
  baseQuery,
  tagTypes,
  endpointBuilder = defaultEndpointBuilder,
  endpointDefinitions,
}: {
  exportName: string;
  reducerPath?: string;
  createApiFn: ts.Expression;
  baseQuery: ts.Expression;
  tagTypes: ts.Expression;
  endpointBuilder?: ts.Identifier;
  endpointDefinitions: ts.ObjectLiteralExpression;
}) {
  return factory.createVariableStatement(
    [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    factory.createVariableDeclarationList(
      [
        factory.createVariableDeclaration(
          factory.createIdentifier(exportName),
          undefined,
          undefined,
          factory.createCallExpression(createApiFn, undefined, [
            factory.createObjectLiteralExpression(
              generateObjectProperties({
                ...(!reducerPath ? {} : { reducerPath: factory.createStringLiteral(reducerPath) }),
                baseQuery,
                tagTypes,
                endpoints: factory.createArrowFunction(
                  undefined,
                  undefined,
                  [
                    factory.createParameterDeclaration(
                      undefined,
                      undefined,
                      undefined,
                      endpointBuilder,
                      undefined,
                      undefined,
                      undefined
                    ),
                  ],
                  undefined,
                  factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                  factory.createParenthesizedExpression(endpointDefinitions)
                ),
              }),
              true
            ),
          ])
        ),
      ],
      ts.NodeFlags.Const
    )
  );
}

export function generateEndpointDefinition({
  operationName,
  type,
  Response,
  QueryArg,
  queryFn,
  endpointBuilder = defaultEndpointBuilder,
  extraEndpointsProps,
}: {
  operationName: string;
  type: 'query' | 'mutation';
  Response: ts.TypeReferenceNode;
  QueryArg: ts.TypeReferenceNode;
  queryFn: ts.Expression;
  endpointBuilder?: ts.Identifier;
  extraEndpointsProps: ObjectPropertyDefinitions;
}) {
  return factory.createPropertyAssignment(
    factory.createIdentifier(operationName),

    factory.createCallExpression(
      factory.createPropertyAccessExpression(endpointBuilder, factory.createIdentifier(type)),
      [Response, QueryArg],
      [
        factory.createObjectLiteralExpression(
          generateObjectProperties({ query: queryFn, ...extraEndpointsProps }),
          true
        ),
      ]
    )
  );
}

export function generatePackageImports({
  createApiImportPath,
  hooks,
  isUsingFetchBaseQuery,
}: {
  createApiImportPath?: GenerationOptions['createApiImportPath'];
  isUsingFetchBaseQuery: boolean;
  hooks?: boolean;
}) {
  const DEFAULT_IMPORT_PATH = '@reduxjs/toolkit/query';

  const entryPoint = hooks ? 'react' : createApiImportPath;

  function getBasePackageImportsFromOptions() {
    return {
      ...(entryPoint === 'base' ? { createApi: 'createApi' } : {}),
      ...(isUsingFetchBaseQuery ? { fetchBaseQuery: 'fetchBaseQuery' } : {}),
    };
  }

  const basePackageImports = getBasePackageImportsFromOptions();

  const hasBasePackageImports = Object.keys(basePackageImports).length > 0;

  const basePackageImportNode = hasBasePackageImports
    ? [generateImportNode(DEFAULT_IMPORT_PATH, getBasePackageImportsFromOptions())]
    : [];

  const subPackageImportNode =
    entryPoint !== 'base'
      ? [generateImportNode(`${DEFAULT_IMPORT_PATH}/${entryPoint}`, { createApi: 'createApi' })]
      : [];

  return [...subPackageImportNode, ...basePackageImportNode];
}
