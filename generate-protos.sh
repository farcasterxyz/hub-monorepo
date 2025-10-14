#!/usr/bin/env bash
set -euo pipefail

PROTO_REPO="https://github.com/farcasterxyz/snapchain"
PROTO_PATH="src/proto"
PROTO_REV="e634aa8789fa8196446ce1d68b459864b93a8780" # Update if you want to regenerate with newer protos

TMPDIR="tmp-protogen"

# Clean up any previous temp dir
rm -rf "$TMPDIR"
git clone --depth=1 "$PROTO_REPO" "$TMPDIR"
cd "$TMPDIR"
git checkout "$PROTO_REV"
cd ..

# Determine which files to generate
case "${LIBRARY:-}" in
  core)
    RELEVANT_PROTOS="/defs/request_response.proto /defs/rpc.proto /defs/admin_rpc.proto /defs/message.proto /defs/hub_event.proto /defs/onchain_event.proto /defs/username_proof.proto"
    OUT_PATH="src/protobufs/generated"
    CUSTOM_TS_PROTO_OPTS="outputServices=false"
    ;;
  hub-nodejs)
    RELEVANT_PROTOS="/defs/rpc.proto /defs/admin_rpc.proto"
    OUT_PATH="src/generated"
    CUSTOM_TS_PROTO_OPTS="outputServices=grpc-js"
    ;;
  hub-web)
    RELEVANT_PROTOS="/defs/rpc.proto /defs/admin_rpc.proto"
    OUT_PATH="src/generated"
    CUSTOM_TS_PROTO_OPTS="outputClientImpl=grpc-web,lowerCaseServiceMethods=true"
    ;;
  *)
    echo "Error: LIBRARY environment variable must be set to one of: core, hub-nodejs, hub-web"
    exit 1
    ;;
esac

echo "Generating relevant protos: $RELEVANT_PROTOS"
echo "Outputting generated files to: $OUT_PATH"

docker run --rm \
  --user "$(id -u):$(id -g)" \
  -v "$(pwd)/../../node_modules":/node_modules \
  -v "$(pwd)/$TMPDIR/$PROTO_PATH":/defs \
  -v "$(pwd)/$OUT_PATH":/out \
  namely/protoc:1.50_1 \
  --plugin=/node_modules/ts-proto/protoc-gen-ts_proto \
  --ts_proto_out=/out \
  --ts_proto_opt=esModuleInterop=true,exportCommonSymbols=false,useOptionals=none,unrecognizedEnum=false,removeEnumPrefix=true,"$CUSTOM_TS_PROTO_OPTS" \
  --proto_path=/defs $RELEVANT_PROTOS

# Clean up
rm -rf "$TMPDIR"

echo "✅ Protobuf generation complete."
