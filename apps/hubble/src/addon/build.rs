fn main() {
    let mut proto_files = Vec::new();

    for entry in glob::glob("./../../../../protobufs/schemas/**/*.proto").unwrap() {
        let file_path = entry.unwrap();
        proto_files.push(file_path);
    }

    let proto_include_dirs = ["./../../../../protobufs/schemas/"];

    tonic_build::configure()
        .build_server(true)
        .build_client(false)
        .protoc_arg("--experimental_allow_proto3_optional")
        .compile(&proto_files, &proto_include_dirs)
        .unwrap_or_else(|e| panic!("Failed to compile protos: {}", e));
}
