import { exec, ExecException } from 'child_process';
import * as fs from 'fs';
import path from 'path';
import del from 'del';

import { MESSAGES } from '../src/utils';

let id = 0;
const tmpDir = 'test/tmp';

function cli(
  args: string[],
  cwd: string
): Promise<{ error: ExecException | null; stdout: string; stderr: string; output: string }> {
  return new Promise((resolve) => {
    const tmpFileName = path.resolve(tmpDir, `${++id}.test.generated.ts`);
    exec(
      `ts-node -T -P ${path.resolve('./tsconfig.json')} ${path.resolve('./src/bin/cli.ts')} ${[
        `-f ${tmpFileName}`,
        ...args,
      ].join(' ')}`,
      { cwd },
      (error, stdout, stderr) => {
        let output = '';
        if (fs.existsSync(tmpFileName)) {
          output = fs.readFileSync(tmpFileName, { encoding: 'utf-8' });
        }
        // del.sync(tmpFileName)
        resolve({
          error,
          stdout,
          stderr,
          output,
        });
      }
    );
  });
}

beforeAll(() => {
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir);
  }
});

afterAll(() => {
  del.sync(`${tmpDir}/*.ts`);
});

describe('CLI options testing', () => {
  it('should log output to the console when a filename is not specified', async () => {
    const result = await cli([`./test/fixtures/petstore.json`], '.');
    expect(result.output).toMatchSnapshot();
  });

  it('should accept a valid url as the target swagger file and generate a client', async () => {
    const result = await cli([`https://petstore3.swagger.io/api/v3/openapi.json`], '.');
    expect(result.output).toMatchSnapshot();
  });

  it('should generate react hooks as a part of the output', async () => {
    const result = await cli(['-h', `./test/fixtures/petstore.json`], '.');
    expect(result.output).toMatchSnapshot();

    // These are all of the hooks that we expect the petstore schema to output
    const expectedHooks = [
      'useGetHealthcheckQuery',
      'useUpdatePetMutation',
      'useAddPetMutation',
      'useFindPetsByStatusQuery',
      'useFindPetsByTagsQuery',
      'useGetPetByIdQuery',
      'useUpdatePetWithFormMutation',
      'useDeletePetMutation',
      'useUploadFileMutation',
      'useGetInventoryQuery',
      'usePlaceOrderMutation',
      'useGetOrderByIdQuery',
      'useDeleteOrderMutation',
      'useCreateUserMutation',
      'useCreateUsersWithListInputMutation',
      'useLoginUserQuery',
      'useLogoutUserQuery',
      'useGetUserByNameQuery',
      'useUpdateUserMutation',
      'useDeleteUserMutation',
    ];

    const numberOfHooks = expectedHooks.filter((name) => result.output.indexOf(name) > -1).length;
    expect(numberOfHooks).toEqual(expectedHooks.length);
  });

  it('should error out when the specified filename provided to --baseQuery is not found', async () => {
    const result = await cli(
      ['-h', `--baseQuery test/fixtures/nonExistantFile.ts`, `./test/fixtures/petstore.json`],
      '.'
    );
    const expectedErrors = [MESSAGES.FILE_NOT_FOUND];

    const numberOfErrors = expectedErrors.filter((msg) => result.stderr.indexOf(msg) > -1).length;
    expect(numberOfErrors).toEqual(expectedErrors.length);
  });

  it('should error out when the specified filename provided to --baseQuery has no default export', async () => {
    const result = await cli(
      ['-h', `--baseQuery test/fixtures/customBaseQueryWithoutDefault.ts`, `./test/fixtures/petstore.json`],
      '.'
    );

    const expectedErrors = [MESSAGES.DEFAULT_EXPORT_MISSING];

    const numberOfErrors = expectedErrors.filter((msg) => result.stderr.indexOf(msg) > -1).length;
    expect(numberOfErrors).toEqual(expectedErrors.length);
  });

  it('should error out when the named function provided to --baseQuery is not found', async () => {
    const result = await cli(
      ['-h', `--baseQuery test/fixtures/customBaseQuery.ts:missingFunctionName`, `./test/fixtures/petstore.json`],
      '.'
    );

    const expectedErrors = [MESSAGES.NAMED_EXPORT_MISSING];

    const numberOfErrors = expectedErrors.filter((msg) => result.stderr.indexOf(msg) > -1).length;
    expect(numberOfErrors).toEqual(expectedErrors.length);
  });

  it('should not error when a valid named export is provided to --baseQuery', async () => {
    const result = await cli(
      ['-h', `--baseQuery test/fixtures/customBaseQuery.ts:anotherNamedBaseQuery`, `./test/fixtures/petstore.json`],
      '.'
    );

    expect(result.output).not.toContain('fetchBaseQuery');
    expect(result.output).toContain(`import { anotherNamedBaseQuery } from '../fixtures/customBaseQuery'`);

    const expectedErrors = [MESSAGES.NAMED_EXPORT_MISSING];

    const numberOfErrors = expectedErrors.filter((msg) => result.stderr.indexOf(msg) > -1).length;
    expect(numberOfErrors).toEqual(0);
  });

  it('should import { default as customBaseQuery } when a file with a default export is provided to --baseQuery', async () => {
    const result = await cli(
      ['-h', `--baseQuery test/fixtures/customBaseQuery.ts`, `./test/fixtures/petstore.json`],
      '.'
    );

    expect(result.output).not.toContain('fetchBaseQuery');
    expect(result.output).toContain(`import { default as customBaseQuery } from '../fixtures/customBaseQuery'`);

    const expectedErrors = [MESSAGES.NAMED_EXPORT_MISSING];

    const numberOfErrors = expectedErrors.filter((msg) => result.stderr.indexOf(msg) > -1).length;
    expect(numberOfErrors).toEqual(0);
  });

  it('should error out when the specified with path alias is not found', async () => {
    const result = await cli(['-h', `--baseQuery @/hoge/fuga/nonExistantFile`, `./test/fixtures/petstore.json`], '.');
    const expectedErrors = [MESSAGES.FILE_NOT_FOUND];

    const numberOfErrors = expectedErrors.filter((msg) => result.stderr.indexOf(msg) > -1).length;
    expect(numberOfErrors).toEqual(expectedErrors.length);
  });

  it('should work with path alias', async () => {
    const pathAlias = '@/customBaseQuery';
    const result = await cli(
      ['-h', `--baseQuery ${pathAlias}:anotherNamedBaseQuery -c test/tsconfig.json `, `./test/fixtures/petstore.json`],
      '.'
    );

    expect(result.output).not.toContain('fetchBaseQuery');
    expect(result.output).toContain(`import { anotherNamedBaseQuery } from '${pathAlias}'`);

    const expectedErrors = [MESSAGES.NAMED_EXPORT_MISSING];

    const numberOfErrors = expectedErrors.filter((msg) => result.stderr.indexOf(msg) > -1).length;
    expect(numberOfErrors).toEqual(0);
  });

  it('should work with path alias with file extension', async () => {
    const pathAlias = '@/customBaseQuery';
    const result = await cli(
      [
        '-h',
        `--baseQuery ${pathAlias}.ts:anotherNamedBaseQuery -c test/tsconfig.json `,
        `./test/fixtures/petstore.json`,
      ],
      '.'
    );

    expect(result.output).not.toContain('fetchBaseQuery');
    expect(result.output).toContain(`import { anotherNamedBaseQuery } from '${pathAlias}'`);

    const expectedErrors = [MESSAGES.NAMED_EXPORT_MISSING];

    const numberOfErrors = expectedErrors.filter((msg) => result.stderr.indexOf(msg) > -1).length;
    expect(numberOfErrors).toEqual(0);
  });
});

describe('yaml parsing', () => {
  it('should parse a yaml schema from a URL', async () => {
    const result = await cli([`https://petstore3.swagger.io/api/v3/openapi.yaml`], '.');
    expect(result.output).toMatchSnapshot();
  });

  it('should be able to use read a yaml file and create a file with the output when --file is specified', async () => {
    const result = await cli([`../fixtures/petstore.yaml`], tmpDir);

    expect(result.output).toMatchSnapshot();
  });
});
