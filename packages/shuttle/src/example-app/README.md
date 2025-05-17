# Shuttle Example App

This is an example application showing how to use the Shuttle package to sync data from a Farcaster Hub to a local database.

## Configuration

The example app can be configured using the following environment variables:

### Hub Connection
- `HUB_HOST`: Hub host URL (default: hub-full.farcaster.xyz:2283)
- `HUB_SSL`: Whether to use SSL for Hub connection (default: false)
- `SUBSCRIBE_RPC_TIMEOUT`: Timeout for RPC calls in milliseconds (default: 30000)

### Database Configuration
- `POSTGRES_URL`: PostgreSQL connection string (default: postgres://shuttle:password@localhost:6541/postgres)
- `POSTGRES_SCHEMA`: PostgreSQL schema (default: public)
- `REDIS_URL`: Redis connection string (default: localhost:6379)

### Sharding
- `SHARDS`: Total number of shards (default: 0, meaning no sharding)
- `SHARD_INDEX`: Current shard index (default: 0)

### Backfill Configuration
- `MAX_FID`: Maximum FID to backfill (default: 1000)
- `BACKFILL_FIDS`: Comma-separated list of specific FIDs to backfill (default: empty, meaning all FIDs up to MAX_FID)
- `CONCURRENCY`: Number of concurrent processes to use for backfill (default: 10)
- `USE_STREAMING_RPCS_FOR_BACKFILL`: Whether to use streaming RPCs for backfill (default: true)

### Event Stream Configuration
- `REWIND_SECONDS`: Number of seconds to rewind in the event stream on restart (default: 0)
  - Set this to a value greater than 0 to ensure you don't miss events that might have been emitted out of order
  - Recommended value: 5-10 seconds for most use cases

## Usage

```bash
# Start the database dependencies
docker compose up postgres redis

# Start the app and sync messages from the event stream
POSTGRES_URL=postgres://shuttle:password@localhost:6541 REDIS_URL=localhost:6379 HUB_HOST=hub-full.farcaster.xyz:2283 HUB_SSL=false REWIND_SECONDS=5 yarn start start

# Perform backfill for all FIDs up to 1000
POSTGRES_URL=postgres://shuttle:password@localhost:6541 REDIS_URL=localhost:6379 HUB_HOST=hub-full.farcaster.xyz:2283 HUB_SSL=false MAX_FID=1000 yarn start backfill

# Perform backfill for specific FIDs
POSTGRES_URL=postgres://shuttle:password@localhost:6541 REDIS_URL=localhost:6379 HUB_HOST=hub-full.farcaster.xyz:2283 HUB_SSL=false BACKFILL_FIDS=1,2,3 yarn start backfill

# Start the worker for processing backfill jobs
POSTGRES_URL=postgres://shuttle:password@localhost:6541 REDIS_URL=localhost:6379 HUB_HOST=hub-full.farcaster.xyz:2283 HUB_SSL=false yarn start worker
``` 
