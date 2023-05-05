## Replicate hub data into Postgres

This example shows you how you can quickly start ingesting data from a Farcaster hub into a traditional database like Postgres.

### Run on StackBlitz

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/farcasterxyz/hubble/tree/main/packages/hub-nodejs/examples/replicate-data-postgres)

### Run locally

1. Clone the repo locally
2. Navigate to this folder with `cd packages/hub-nodejs/examples/replicate-data-postgres`
3. Run `yarn install` to install dependencies
4. Run `docker compose up -d` to start a Postgres instance ([install Docker](https://docs.docker.com/get-docker/) if you do not yet have it)
5. Run `yarn start`

To wipe your local data, run `docker compose down -v` from this directory.
