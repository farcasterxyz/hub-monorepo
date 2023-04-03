#!/bin/bash

docker run -d -v "$(pwd)"/envoy.yaml:/etc/envoy/envoy.yaml:ro \
    --network=host envoyproxy/envoy:v1.22.0

# command to run in Mac/Windows
# docker run -d -v "$(pwd)"/envoy.yaml:/etc/envoy/envoy.yaml:ro \
#    -p 2284:2284 -p 9901:9901 envoyproxy/envoy:v1.22.0
