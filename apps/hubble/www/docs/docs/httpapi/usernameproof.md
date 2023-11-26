
# Username Proofs API


## userNameProofByName
Get an proof for a username by the Farcaster username

**Query Parameters**
| Parameter | Description | Example |
| --------- | ----------- | ------- |
| name       | The Farcaster username or ENS address  | `name=adityapk` OR `name=dwr.eth` |


**Example**
```bash
curl http://127.0.0.1:2281/v1/userNameProofByName?name=adityapk
```


**Response**
```json
{
  "timestamp": 1670603245,
  "name": "adityapk",
  "owner": "Oi7uUaECifDm+larm+rzl3qQhcM=",
  "signature": "fo5OhBP/ud...3IoJdhs=",
  "fid": 6833,
  "type": "USERNAME_TYPE_FNAME"
}
```


## userNameProofsByFid
Get a list of proofs provided by an FID

**Query Parameters**
| Parameter | Description | Example |
| --------- | ----------- | ------- |
| fid | The FID being requested | `fid=2` |


**Example**
```bash
curl http://127.0.0.1:2281/v1/userNameProofsByFid?fid=2
```


**Response**
```json
{
  "proofs": [
    {
      "timestamp": 1623910393,
      "name": "v",
      "owner": "0x4114e33eb831858649ea3702e1c9a2db3f626446",
      "signature": "bANBae+Ub...kr3Bik4xs=",
      "fid": 2,
      "type": "USERNAME_TYPE_FNAME"
    },
    {
      "timestamp": 1690329118,
      "name": "varunsrin.eth",
      "owner": "0x182327170fc284caaa5b1bc3e3878233f529d741",
      "signature": "zCEszPt...zqxTiFqVBs=",
      "fid": 2,
      "type": "USERNAME_TYPE_ENS_L1"
    }
  ]
}
```