BASE_DIR=../../../../protobufs/schemas/
PROTO_FILES=message.proto username_proof.proto
BINARY_NAME=golang-submitmessage

# Install the Go Protocol Buffers plugin
install-proto:
	go install google.golang.org/protobuf/cmd/protoc-gen-go@latest

# Generate Go code from .proto files
generate: install-proto	
	mkdir -p protobufs
	protoc -I=$(BASE_DIR) --proto_path=$(BASE_DIR) --go_out=protobufs --go_opt=paths=source_relative \
	--go_opt=Mmessage.proto=golang-submitmessage/protobufs \
	--go_opt=Musername_proof.proto=golang-submitmessage/protobufs \
	$(PROTO_FILES)

# Build the Go code
build:
	go build -o $(BINARY_NAME)

# Default target to run if no target specified
all: generate build
