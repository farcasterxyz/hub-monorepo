

# Verifications API


## verificationsByFid
Get a list of verifications provided by an FID 

**Query Parameters**
| Parameter | Description | Example |
| --------- | ----------- | ------- |
| fid | The FID being requested | `fid=2` |
| address | The optional ETH address to filter by | `address=0x91031dcfdea024b4d51e775486111d2b2a715871` |


**Example**
```bash
curl http://127.0.0.1:2281/v1/verificationsByFid?fid=2
```


**Response**
```json
{
  "messages": [
    {
      "data": {
        "type": "MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS",
        "fid": 2,
        "timestamp": 73244540,
        "network": "FARCASTER_NETWORK_MAINNET",
        "verificationAddEthAddressBody": {
          "address": "0x91031dcfdea024b4d51e775486111d2b2a715871",
          "ethSignature": "tyxj1...x1cYzhyxw=",
          "blockHash": "0xd74860c4bbf574d5ad60f03a478a30f990e05ac723e138a5c860cdb3095f4296"
        }
      },
      "hash": "0xa505331746ec8c5110a94bdb098cd964e43a8f2b",
      "hashScheme": "HASH_SCHEME_BLAKE3",
      "signature": "bln1zIZM.../4riB9IVBQ==",
      "signatureScheme": "SIGNATURE_SCHEME_ED25519",
      "signer": "0x78ff9...b6d62558c"
    },
  ],
  "nextPageToken": ""
}
```
