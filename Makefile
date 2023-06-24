proto_push:
	@echo "Pushing to buf registry";
	buf push protobufs/schemas;