# Hub Shuttle Package

Package to help move data from a hub to a database.

Currently in alpha, everything is subject to change. Do not rely on APIs being stable yet.

However, database schema is stable and will not change (except for addition of new tables).

## Architecture

![Architecture](./architecture.jpg)

There are 3 main components:
- a hub subscriber that listens to the hub for new messages
- an event processor that can process messagees and write them to the database
- a reconciler that can backfill messages and ensures the messages are in sync with the hub

The event processer has a hook for your code to plug into the message processing loop. You must implement the `MessageHandler` interface
and provide it to the system. The system will call your `handleMessageMerge` method for each message it processes, within the same transaction 
where the message is written to the db. The function is always expected to succeed, it is not possible to instruct it to "skip"  a message.
If your function fails, the message will not be written to the db and will be retried at a later time.


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
POSTGRES_URL=postgres://shuttle:password@0.0.0.0:6541 REDIS_URL=0.0.0.0:16379 HUB_HOST=<host>:<port> HUB_SSL=false yarn start start

# Backfill messages for fids
POSTGRES_URL=postgres://shuttle:password@0.0.0.0:6541 REDIS_URL=0.0.0.0:16379 HUB_HOST=<host>:<port> HUB_SSL=false yarn start backfill 
```


If you are using this as a package implement the `MessageHandler` interface and take a look at the `App` class on how to call the other classes.

## TODO
- [ ] Onchain events and fnames
- [ ] Write events to a stream and consume from stream in a worker
- [ ] Job queues for reconciling/backfilling all fids
- [ ] Detect if already backfilled and only backfill if not
- [ ] Better retries and error handling
- [ ] More tests