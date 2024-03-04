fn main() {
    let mut proto_files = Vec::new();
    for entry in glob::glob("./../../../../protobufs/schemas/**/*.proto").unwrap() {
        let file_path = entry.unwrap();
        proto_files.push(file_path);
    }

    let proto_include_dirs = ["./../../../../protobufs/schemas/"];

    prost_build::Config::new()
        .out_dir("src/proto") // Specifies where to save the generated Rust files.
        .default_package_filename("protobufs")
        .enable_type_names()
        .compile_protos(&proto_files, &proto_include_dirs)
        .unwrap_or_else(|e| panic!("Failed to compile protos: {}", e));
}
