<p align="center">
  <img src="https://raw.githubusercontent.com/rtk-incubator/rtk-query/main/logo.png" width="400" />
</p>
<h2 align="center">
Code Generator
</h2>

<p align="center">
   <a href="https://discord.gg/0ZcbPKXt5bZ6au5t" target="_blank">
    <img src="https://img.shields.io/badge/chat-online-green" alt="Discord server" />
  </a>
</p>

### Introduction

This is a utility library meant to be used with [RTK Query](https://rtk-query-docs.netlify.app) that will generate a typed API client from an OpenAPI schema.

### Usage

By default, running the CLI will only log the output to the terminal. You can either pipe this output to a new file, or you can specify an output file via CLI args.

#### Piping to a file (including react hooks generation)

```bash
npx @rtk-incubator/rtk-query-codegen-openapi --hooks https://petstore3.swagger.io/api/v3/openapi.json > petstore-api.generated.ts
```

#### Specifying an output file (including react hooks generation)

```bash
npx @rtk-incubator/rtk-query-codegen-openapi --file generated.api.ts --hooks https://petstore3.swagger.io/api/v3/openapi.json
```

### CLI Options

- `--exportName <name>` - change the name of the exported api (default: `api`)
- `--reducerPath <path>` - change the name of the `reducerPath` (default: `api`)
- `--baseQuery <name>` - change the name of `baseQuery` (default: `fetchBaseQuery`)
- `--argSuffix <name>` - change the suffix of the args (default: `ApiArg`)
- `--responseSuffix <name>` - change the suffix of the args (default: `ApiResponse`)
- `--baseUrl <url>` - set the `baseUrl`
- `--hooks` - include React Hooks in the output (ex: `export const { useGetModelQuery, useUpdateModelMutation } = api`)
- `--file <filename>` - specify a filename to output to (ex: `./generated.api.ts`)

### Documentation

[View the RTK Query Code Generation docs](https://rtk-query-docs.netlify.app/concepts/code-generation)
