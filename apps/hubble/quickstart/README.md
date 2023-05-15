# Start running a hub

The following guide walks you through running a mainnet hub on your own server. It requires the following:

- A server with:
   - 8GB of RAM
   - 20GB of disk space
   - Docker installed
   - Publicly reachable IP address
   - The following ports exposed:
      - 80
      - 443
      - 2282
      - 2283
      - 2285
- A domain name you control (i.e. you can set an `A` record to point at the server)

## Getting started

1. SSH into your server to open a console.

2. Clone this repository:
   ```sh
   git clone https://github.com/farcasterxyz/hub-monorepo.git
   ```

3. Enter the directory for this walkthrough:
   ```sh
   cd apps/hubble/quickstart
   ```

4. Using the DNS zone you control, create an `A` record pointing at your server, e.g. `my-hub.example.com` →> `123.0.10.20`

5. Create a `.env` file with the following content, using the domain name you chose.
   ```
   HUB_HOST=my-hub.example.com
   ```

6. Create an identity for your hub by running
   ```sh
   docker compose run hubble yarn identity create
   ```

7. Finally, start up the hub:
   ```sh
   docker compose up --detach
   ```
   This will start your hub in the background.

8. View the logs to confirm your hub is running:
   ```sh
   docker compose logs -f hubble
   ```

9. Confirm that you can connect to your hub:
   ```sh
   source .env # Load HUB_HOST environment variable

   docker run --rm -v $(git rev-parse --show-toplevel):/app \
     fullstorydev/grpcurl -connect-timeout 5 \
     -proto /app/protobufs/schemas/rpc.proto \
     -import-path /app/protobufs/schemas \
     $HUB_HOST:2283 \
     HubService.GetInfo
   ```
   If you see output saying your hub is syncing, you're all set!
