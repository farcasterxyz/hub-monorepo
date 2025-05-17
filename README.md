# Hub Monorepo

This monorepo contains packages used to communicate with a Farcaster Hub.

## Getting Started

See [CONTRIBUTING.md](./CONTRIBUTING.md) to set up your developer environment and learn about how to contribute.

## Code Organization

The repository is a monorepo with a primary application in the `/apps/` folder that imports several packages `/packages/`. It is written primarily in [Typescript](https://www.typescriptlang.org/) and uses [Yarn](https://yarnpkg.com/) to orchestrate tasks and [TurboRepo](https://turbo.build/) as its build system. Some performance intensive code is written in Rust and compiled with Cargo.

### Packages

| Package Name                                  | Description                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------------ |
| [@farcaster/shuttle](./packages/shuttle)       | A package that streams Hubble events to Postgres |
| [@farcaster/hub-nodejs](./packages/hub-nodejs) | A Node.js client library for Hubble |
| [@farcaster/hub-web](./packages/hub-web)       | A Browser client library for Hubble |
| [@farcaster/core](./packages/core)             | Shared code between all packages |

