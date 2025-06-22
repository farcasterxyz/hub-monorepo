PROTO_REPO=https://github.com/farcasterxyz/snapchain
PROTO_PATH=src/proto
PROTO_REV=81c7e8ecbb6f110cacdf72a8d52d4bae3144dc9d # Update this if you want to generate off updated snapchain protos

TMPDIR=tmp-protogen
git clone $PROTO_REPO $TMPDIR
cd $TMPDIR 
git checkout $PROTO_REV
cd ..


# Determine which files you care about
if [[ "$LIBRARY" == "core" ]]; then
    RELEVANT_PROTOS=$(ls $TMPDIR/$PROTO_PATH/*.proto | xargs -n 1 basename | xargs -I{} echo '/defs/{}' | tr '\n' ' ')
    OUT_PATH=src/protobufs/generated
elif [[ "$LIBRARY" == "hub-nodejs" ]]; then
    RELEVANT_PROTOS=/defs/rpc.proto
    OUT_PATH=src/generated
elif [[ "$LIBRARY" == "hub-web" ]]; then
    RELEVANT_PROTOS=/defs/rpc.proto
    OUT_PATH=src/generated
fi

echo "Generating relevant protos: $RELEVANT_PROTOS"
echo "Outputting generated files to: $OUT_PATH"

docker run --rm --user $(id -u):$(id -g) -v $(pwd)/../../node_modules:/node_modules -v $(pwd)/$TMPDIR/$PROTO_PATH:/defs -v $(pwd)/$OUT_PATH:/out namely/protoc:1.50_1 --plugin=/node_modules/ts-proto/protoc-gen-ts_proto --ts_proto_out=/out --ts_proto_opt=esModuleInterop=true,exportCommonSymbols=false,outputServices=grpc-js,useOptionals=none,unrecognizedEnum=false,removeEnumPrefix=true --proto_path=/defs $RELEVANT_PROTOS 

rm -rf $TMPDIR