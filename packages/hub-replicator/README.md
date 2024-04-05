# Hub Replicator Package

Package to help replicate data between a hub and a database


## Usage
The package is meant to be used as a library. The app provided is just an example.

If you want to run the test the app, do the following:
```bash

# Ensure you have node 21 installed, use nvm to install it

# Within the package directory 
yarn install && yarn build

# Start the dependencies
docker compose up postgres redis
 
# Start the app and sync messages from the event stream
POSTGRES_URL=postgres://replicator:password@0.0.0.0:6541 REDIS_URL=0.0.0.0:16379 HUB_HOST=<host>:<port> HUB_SSL=false yarn start start

# Backfill messages for fids
POSTGRES_URL=postgres://replicator:password@0.0.0.0:6541 REDIS_URL=0.0.0.0:16379 HUB_HOST=<host>:<port> HUB_SSL=false yarn start backfill 
```


If you are using this as a package implement the `MessageHandler` interface and take a look at the `App` class on how to call the other classes.

## TODO
- [ ] Onchain events and fnames
- [ ] Write events to a stream and consume from stream in a worker
- [ ] Job queues for reconciling/backfilling all fids
- [ ] Detect if already backfilled and only backfill if not
- [ ] Better retries and error handling
- [ ] More tests