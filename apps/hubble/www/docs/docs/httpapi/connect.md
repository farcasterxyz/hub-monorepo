# Farcaster Connect API

## connect
Verify a Farcaster Connect message and signature.


**Body Parameters**
| Parameter | Description |
| --------- | ----------- |
| message | Farcaster Connect sign in message |
| signature | ERC-191 signature |


**Example**
```bash
curl http://127.0.0.1:2281/v1/connect \
     -H 'Content-Type: application/json' \
     -d'{"message": "msg", "signature": "sig"}

```


**Response**
```json
{
    "fid": 20943,
    "success": true
}
```
