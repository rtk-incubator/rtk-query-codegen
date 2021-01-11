import { exec, ExecException } from 'child_process';
import path from 'path';
import del from 'del';
import { MESSAGES } from '../src/utils';

const SANDBOX = 'test/sandbox/';

function cli(
  args: string[],
  cwd: string
): Promise<{ code: number; error: ExecException | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    exec(`ts-node ${path.resolve('./src/bin/cli.ts')} ${args.join(' ')}`, { cwd }, (error, stdout, stderr) => {
      resolve({
        code: error && error.code ? error.code : 0,
        error,
        stdout,
        stderr,
      });
    });
  });
}

describe('CLI options testing', () => {
  it('should log output to the console when a filename is not specified', async () => {
    const result = await cli([`./test/fixtures/petstore.json`], '.');
    expect(result.stdout).toMatchSnapshot();
  });

  it('should accept a valid url as the target swagger file and generate a client', async () => {
    const result = await cli([`https://petstore3.swagger.io/api/v3/openapi.json`], '.');
    expect(result.stdout).toMatchSnapshot();
  });

  it('should generate react hooks as a part of the output', async () => {
    const result = await cli(['-h', `./test/fixtures/petstore.json`], '.');
    expect(result.stdout).toMatchSnapshot();

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

    const numberOfHooks = expectedHooks.filter((name) => result.stdout.indexOf(name) > -1).length;
    expect(numberOfHooks).toEqual(expectedHooks.length);
  });

  it('should log warnings to the console and default to using fetchBaseQuery when the specified baseQuery is not found', async () => {
    const result = await cli(
      ['-h', `--baseQuery ./test/fixtures/nonExistantFile.ts`, `./test/fixtures/petstore.json`],
      '.'
    );

    expect(result.stdout).toMatchSnapshot();

    const expectedWarnings = [
      `${MESSAGES.FILE_NOT_FOUND} ./test/fixtures/nonExistantFile.ts`,
      'Defaulting to use fetchBaseQuery as the baseQuery',
    ];

    const numberOfWarnings = expectedWarnings.filter((msg) => result.stderr.indexOf(msg) > -1).length;
    expect(numberOfWarnings).toEqual(expectedWarnings.length);

    const expectedBaseQueryStr = `baseQuery: fetchBaseQuery({ baseUrl: "/api/v3" })`;
    expect(result.stdout.indexOf(expectedBaseQueryStr) > -1).toBeTruthy();

    const expectedImportsStr = `import { createApi, fetchBaseQuery } from "@rtk-incubator/rtk-query"`;
    expect(result.stdout.indexOf(expectedImportsStr) > -1).toBeTruthy();
  });
});
