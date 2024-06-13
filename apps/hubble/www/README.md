# farcaster.xyz

Homepage for the Farcaster Protocol

### Getting Started

1. Run `npm install -D vitepress`
2. Run `npm run docs:dev`


### Generate Docs

Documentation of gRPC endpoints is done manually, but `protoc` can be used to generate Message docs:

1. Install [protoc](https://grpc.io/docs/protoc-installation/)
2. Download latest `protoc-gen-doc` binary from the [repo](https://github.com/pseudomuto/protoc-gen-doc) and place in this folder
3. On OS X, you may need to remove the binary from quarantine with `xattr -d com.apple.quarantine protoc-gen-doc`
4. Run `protoc --plugin=protoc-gen-doc=./protoc-gen-doc --doc_out=./docs --doc_opt=markdown,docs.md -I ../../../protobufs/schemas  ../../../protobufs/schemas/*.proto`
5. Move the generated docs to the appropriate sections manually, and then delete the `docs/docs.md` file.

The output should be merged with the existing documentation by hand because it makes some errors like not correctly documenting [oneOf](https://github.com/pseudomuto/protoc-gen-doc/issues/333). It also organizes items alphabetically which makes it harder to parse.
