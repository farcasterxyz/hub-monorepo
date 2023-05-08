## Replicate hub data into Postgres

This example shows you how you can quickly start ingesting data from a Farcaster hub into a traditional database like Postgres.

### Requirements

Note that these are rough guidelines. Recommend you over-allocate resources to accommodate eventual growth of the Farcaster network.

* **Node.js Application**
    * ~200MB for installing NPM packages
    * At most 1GB of RAM (typically around ~250MB is normally used)
* ~2GB of space on your Postgres instance to store all active Farcaster messages.

If you are running both the Node.js application and Postgres instance locally on your own machine, this will take about 3-4 hours to fully sync. If you are running them on separate servers, it may take significantly longer since the time to communicate between the application and Postgres has a significant effect on sync time.

### Run on StackBlitz

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/farcasterxyz/hubble/tree/main/packages/hub-nodejs/examples/replicate-data-postgres)

### Run locally

1. Clone the repo locally
2. Navigate to this folder with `cd packages/hub-nodejs/examples/replicate-data-postgres`
3. Run `yarn install` to install dependencies
4. Run `docker compose up -d` to start a Postgres instance ([install Docker](https://docs.docker.com/get-docker/) if you do not yet have it)
5. Run `yarn start`

To wipe your local data, run `docker compose down -v` from this directory.

### Running on Render.com

1. Create a new Standard Postgres instance in Render's dashboard.
2. Create a new **Background Worker** and copy+paste the GitHub URL for the repo: https://github.com/farcasterxyz/hub-monorepo
  Disable Auto-Deploy

### What does it do?

This example application starts two high-level processes:

1. Backfills all existing data from the hub, one FID (user) at a time.
2. Subscribes to the hub's event stream to sync live events.

If left running, the backfill will eventually complete, and only the subscription will continue processing events. You can therefore start the application and it will remain up to date with the hub you connected to.

If you stop the process and start it again, it will start the backfill process for each FID from the beginning (i.e. will download the same messages again, but ignoring messages it already has). It will start reading live events from the last event it saw from the event stream.

### Caveats

There are some important points to consider when using this example:

* **This is not intended to be used in production!**
  It's intended to be an easy-to-understand example of what a production implementation might look like, but it focuses on how to think about processing messages and events and the associated side effects.

*
