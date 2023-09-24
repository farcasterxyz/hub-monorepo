

# Storage Limits API


## storageLimitsByFid
Get an FID's storage limits.

**Query Parameters**
| Parameter | Description | Example |
| --------- | ----------- | ------- |
| fid       | The FID that's being requested | `fid=6833` |


**Example**
```bash
curl http://127.0.0.1:2281/v1/storageLimitsByFid?fid=6833
```


**Response**
```json
{
  "limits": [
    {
      "storeType": "STORE_TYPE_CASTS",
      "limit": 10000
    },
    {
      "storeType": "STORE_TYPE_LINKS",
      "limit": 5000
    },
    {
      "storeType": "STORE_TYPE_REACTIONS",
      "limit": 5000
    },
    {
      "storeType": "STORE_TYPE_USER_DATA",
      "limit": 100
    },
    {
      "storeType": "STORE_TYPE_USERNAME_PROOFS",
      "limit": 10
    },
    {
      "storeType": "STORE_TYPE_VERIFICATIONS",
      "limit": 50
    }
  ]
}
```
