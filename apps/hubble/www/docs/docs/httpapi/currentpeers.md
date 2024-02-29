# CurrentPeers API

## currentPeers

Get a list of the Hub's current sync peers

**Query Parameters**
| Parameter | Description | Example |
| --------- | ----------- | ------- |
| | This endpoint accepts no parameters | |

- **Example**

```bash
curl http://127.0.0.1:2281/v1/currentPeers

```

**Response**

```json
{
    "contacts": [
        {
            "gossipAddress": {
                "address": "84.247.175.196",
                "family": 4,
                "port": 2282,
                "dnsName": ""
            },
            "rpcAddress": {
                "address": "84.247.175.196",
                "family": 4,
                "port": 2283,
                "dnsName": ""
            },
            "excludedHashes": [],
            "count": 10694067,
            "hubVersion": "2023.12.27",
            "network": "FARCASTER_NETWORK_MAINNET",
            "appVersion": "1.9.2",
            "timestamp": 1705796040744
        },
      ...
    ]
}
```
