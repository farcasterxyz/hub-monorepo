package main

import (
 "bytes"
 "crypto/ed25519"
 "encoding/hex"
 "fmt"
 "log"
 "net/http"
 "time"

 "github.com/golang/protobuf/proto"
 "github.com/zeebo/blake3"

 "golang-submitmessage/protobufs"
)

const farcasterEpoch int64 = 1609459200 // January 1, 2021 UTC

func main() {
 fid := uint64(6833) // FID of the user submitting the message
 network := protobufs.FarcasterNetwork_FARCASTER_NETWORK_MAINNET

 // Construct the cast add message
 castAdd := &protobufs.CastAddBody{
  Text: "Welcome to Go!",
 }

 // Construct the message data object
 msgData := &protobufs.MessageData{
  Type:      protobufs.MessageType_MESSAGE_TYPE_CAST_ADD,
  Fid:       fid,
  Timestamp: uint32(time.Now().Unix() - farcasterEpoch),
  Network:   network,
  Body:      &protobufs.MessageData_CastAddBody{castAdd},
 }

 // Serialize the message data to bytes
 msgDataBytes, err := proto.Marshal(msgData)
 if err != nil {
  log.Fatalf("Failed to encode message data: %v", err)
 }

 // Calculate the blake3 hash, truncated to 20 bytes
 hasher := blake3.New()
 hasher.Write(msgDataBytes)
 hash := hasher.Sum(nil)[:20]

 // Construct the actual message
 msg := &protobufs.Message{
  HashScheme:      protobufs.HashScheme_HASH_SCHEME_BLAKE3,
  Hash:            hash,
  SignatureScheme: protobufs.SignatureScheme_SIGNATURE_SCHEME_ED25519,
 }

 // REPLACE THE PRIVATE KEY WITH YOUR OWN
 privateKeyHex := "your-private-key-in-hex"
 privateKeyBytes, err := hex.DecodeString(privateKeyHex)
 if err != nil {
  log.Fatalf("Invalid hex string: %v", err)
 }

 // Ensure the key length is correct
 if len(privateKeyBytes) != ed25519.SeedSize {
  log.Fatalf("Invalid private key length: expected %d bytes, got %d", ed25519.SeedSize, len(privateKeyBytes))
 }

 // Generate private key from seed
 privateKey := ed25519.NewKeyFromSeed(privateKeyBytes)

 
 // Sign the message
    signature := ed25519.Sign(privateKey, hash)

 // Continue constructing the message
 msg.Signature = signature
 msg.Signer = privateKey.Public().(ed25519.PublicKey)
 msg.DataBytes = msgDataBytes

 // Serialize the message
 msgBytes, err := proto.Marshal(msg)
 if err != nil {
  log.Fatalf("Failed to encode message: %v", err)
 }

 // Finally, submit the message to the network
 url := "http://127.0.0.1:2281/v1/submitMessage"
 resp, err := http.Post(url, "application/octet-stream", bytes.NewBuffer(msgBytes))
 if err != nil {
  log.Fatalf("Failed to send POST request: %v", err)
 }
 defer resp.Body.Close()

 if resp.StatusCode == http.StatusOK {
  fmt.Println("Successfully sent the message.")
 } else {
  fmt.Printf("Failed to send the message. HTTP status: %d\n", resp.StatusCode)
 }
}
