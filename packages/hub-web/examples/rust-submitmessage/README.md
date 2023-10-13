## Submitting messages to a Hub using Rust

This Rust example generates and submits a message to the Hub. You will need a Signer for the user you are submitting a message on behalf of.

You need openSSL installed to compile this. On Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install pkg-config libssl-dev

```

MacOS:
```bash
brew install openssl
```

To run this example,
```bash
cargo build 
cargo run
```
