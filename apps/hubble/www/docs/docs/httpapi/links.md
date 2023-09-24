
# Links API

The Links API will accept the following values for the `link_type` field. 

| String |  Description |
| ------ |  ----------- |
| follow | Follow from FID to Target FID |

## linkById
Get a link by its FID and target FID.

**Query Parameters**
| Parameter | Description | Example |
| --------- | ----------- | ------- |
| fid       | The FID of the link's originator | `fid=6833` |
| target_fid | The FID of the target of the link | `target_fid=2` |
| link_type | The type of link, as a string value| `link_type=follow` |


**Example**
```bash
curl http://127.0.0.1:2281/v1/linkById?fid=6833&target_fid=2&link_type=follow
```


**Response**
```json
{
  "data": {
    "type": "MESSAGE_TYPE_LINK_ADD",
    "fid": 6833,
    "timestamp": 61144470,
    "network": "FARCASTER_NETWORK_MAINNET",
    "linkBody": {
      "type": "follow",
      "targetFid": 2
    }
  },
  "hash": "0x58c23eaf4f6e597bf3af44303a041afe9732971b",
  "hashScheme": "HASH_SCHEME_BLAKE3",
  "signature": "sMypYEMqSyY...nfCA==",
  "signatureScheme": "SIGNATURE_SCHEME_ED25519",
  "signer": "0x0852c07b56...06e999cdd"
}
```


## linksByFid
Get all links from a source FID

**Query Parameters**
| Parameter | Description | Example |
| --------- | ----------- | ------- |
| fid       | The FID of the reaction's creator | `fid=6833` |
| link_type | The type of link, as a string value| `link_type=follow` |


**Example**
```bash
curl http://127.0.0.1:2281/v1/linksByFid?fid=6833
```


**Response**
```json
{
  "messages": [
    {
      "data": {
        "type": "MESSAGE_TYPE_LINK_ADD",
        "fid": 6833,
        "timestamp": 61144470,
        "network": "FARCASTER_NETWORK_MAINNET",
        "linkBody": {
          "type": "follow",
          "targetFid": 83
        }
      },
      "hash": "0x094e35891519c0e04791a6ba4d2eb63d17462f02",
      "hashScheme": "HASH_SCHEME_BLAKE3",
      "signature": "qYsfX08mS...McYq6IYMl+ECw==",
      "signatureScheme": "SIGNATURE_SCHEME_ED25519",
      "signer": "0x0852c0...a06e999cdd"
    },
  ],
  "nextPageToken": ""
}
```

## linksByTargetFid
Get all links to a target FID

**Query Parameters**
| Parameter | Description | Example |
| --------- | ----------- | ------- |
| target_fid       | The FID of the reaction's creator | `fid=6833` |
| link_type | The type of link, as a string value| `link_type=follow` |


**Example**
```bash
curl http://127.0.0.1:2281/v1/linksByTargetFid?target_fid=6833
```


**Response**
```json
{
  "messages": [
    {
      "data": {
        "type": "MESSAGE_TYPE_LINK_ADD",
        "fid": 302,
        "timestamp": 61144668,
        "network": "FARCASTER_NETWORK_MAINNET",
        "linkBody": {
          "type": "follow",
          "targetFid": 6833
        }
      },
      "hash": "0x78c62531d96088f640ffe7e62088b49749efe286",
      "hashScheme": "HASH_SCHEME_BLAKE3",
      "signature": "frIZJGIizv...qQd9QJyCg==",
      "signatureScheme": "SIGNATURE_SCHEME_ED25519",
      "signer": "0x59a04...6860ddfab"
    },
  ],
  "nextPageToken": ""
}
```