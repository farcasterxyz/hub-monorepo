fn main() {
    // Copied from snapchain's proto/definitions at the revision generate-protos.sh uses.
    let proto_files = ["proto/message.proto", "proto/username_proof.proto"];

    for proto_file in &proto_files {
        println!("cargo:rerun-if-changed={}", proto_file);
    }

    protobuf_codegen::Codegen::new()
        .pure()
        .includes(["proto"])
        .inputs(proto_files)
        .cargo_out_dir("protos")
        .run_from_script();
}
