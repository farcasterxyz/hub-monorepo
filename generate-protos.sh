PROTO_REPO=https://github.com/farcasterxyz/snapchain
PROTO_PATH=proto/definitions
PROTO_REV=e8e89a3e81f2e8da45231ecc5ac44ee85b17bb09 # Update this if you want to generate off updated snapchain protos

TMPDIR=tmp-protogen
git clone --no-single-branch $PROTO_REPO $TMPDIR
cd $TMPDIR
git fetch origin "$PROTO_REV" 2>/dev/null || true
git checkout $PROTO_REV || { echo "Failed to checkout $PROTO_REV — aborting"; exit 1; }
cd ..


# Determine which files you care about
if [[ "$LIBRARY" == "core" ]]; then
    RELEVANT_PROTOS="/defs/request_response.proto /defs/rpc.proto /defs/admin_rpc.proto /defs/message.proto /defs/hub_event.proto /defs/onchain_event.proto /defs/username_proof.proto"
    OUT_PATH=src/protobufs/generated
    CUSTOM_TS_PROTO_OPTS="outputServices=false"
elif [[ "$LIBRARY" == "hub-nodejs" ]]; then
    RELEVANT_PROTOS="/defs/rpc.proto /defs/admin_rpc.proto"
    OUT_PATH=src/generated
    CUSTOM_TS_PROTO_OPTS="outputServices=grpc-js"
elif [[ "$LIBRARY" == "hub-web" ]]; then
    RELEVANT_PROTOS="/defs/rpc.proto /defs/admin_rpc.proto"
    OUT_PATH=src/generated
    CUSTOM_TS_PROTO_OPTS="outputClientImpl=grpc-web,lowerCaseServiceMethods=true"
fi

echo "Generating relevant protos: $RELEVANT_PROTOS"
echo "Outputting generated files to: $OUT_PATH"

docker run --rm --user $(id -u):$(id -g) -v $(pwd)/../../node_modules:/node_modules -v $(pwd)/$TMPDIR/$PROTO_PATH:/defs -v $(pwd)/$OUT_PATH:/out namely/protoc:1.50_1 --plugin=/node_modules/ts-proto/protoc-gen-ts_proto --ts_proto_out=/out --ts_proto_opt=esModuleInterop=true,exportCommonSymbols=false,useOptionals=none,unrecognizedEnum=false,removeEnumPrefix=true,$CUSTOM_TS_PROTO_OPTS --proto_path=/defs $RELEVANT_PROTOS 

rm -rf $TMPDIR