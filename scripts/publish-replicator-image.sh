#!/bin/bash

# Builds and publishes Replicator image to Docker Hub.
# This is intended to be run by our GitHub Actions workflow.
#
# MUST be run from the root of the repository so the Docker build context is correct.
#
# You must `docker login ...` first so that we have the necessary permissions to
# push the image layers + tags to Docker Hub.

REPLICATOR_VERSION=$(node -e "console.log(require('./apps/replicator/package.json').version);")

echo "Publishing $REPLICATOR_VERSION"

docker build -f Dockerfile.replicator \
  -t farcasterxyz/replicator:mbd-${REPLICATOR_VERSION} \
  -t farcasterxyz/replicator:latest \
  .

# depot build -f Dockerfile.replicator \
#   --platform "linux/amd64,linux/arm64" \
#   --push \
#   -t farcasterxyz/replicator:${REPLICATOR_VERSION} \
#   -t farcasterxyz/replicator:latest \
#   .
