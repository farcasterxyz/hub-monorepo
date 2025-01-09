#!/bin/bash

# Builds and publishes image to Docker Hub.
# This is intended to be run by our GitHub Actions workflow.
#
# MUST be run from the root of the repository so the Docker build context is correct.
#
# You must `docker login ...` first so that we have the necessary permission to
# push the image layers + tags to Docker Hub.

HUBBLE_VERSION=$(node -e "console.log(require('./apps/hubble/package.json').version);")

echo "Publishing $HUBBLE_VERSION"

depot build -f Dockerfile.hubble \
  --platform "linux/amd64,linux/arm64" \
  --push \
  -t farcasterxyz/hubble:${HUBBLE_VERSION} \
  -t farcasterxyz/hubble:latest \
  .
