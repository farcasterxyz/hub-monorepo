extern crate protobuf_codegen_pure;

fn main() {
    // Define the base directory for .proto files
    let base_dir = "../../../../protobufs/schemas/";

    // Define all your .proto files in an array
    let proto_file_names = ["message.proto", "username_proof.proto"];

    // Form full paths by appending the base directory
    let proto_files: Vec<String> = proto_file_names
        .iter()
        .map(|file_name| format!("{}{}", base_dir, file_name))
        .collect();

    // Tell Cargo to re-run this build script if any of the .proto files change.
    for proto_file in &proto_files {
        println!("cargo:rerun-if-changed={}", proto_file);
    }

    // Run the protobuf code generator
    protobuf_codegen_pure::Codegen::new()
        .out_dir("src/")
        .inputs(&proto_files)
        .includes(&[base_dir])
        .run()
        .expect("protoc");
}
