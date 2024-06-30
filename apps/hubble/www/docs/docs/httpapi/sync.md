# Sync API
> ⚠️ **WARNING:**
> These APIs are experimental and should not be relied on for general use. They may change without notice or be removed in future versions.
 
## stopSync

Stop the synchronization process

**Query Parameters**
| Parameter | Description | Example |
| --------- | ----------- | ------- |
| | This endpoint accepts no parameters | |

- **Example**

```bash
curl -X POST http://127.0.0.1:2281/v1/stopSync
```

**Response**

```json
{
    "isSyncing": false,
    "syncStatus": [],
    "engineStarted": true
}
```

## syncStatus

Get the current synchronization status

**Query Parameters**
| Parameter | Description | Example |
| --------- | ----------- | ------- |
| peer_id | ID of the peer to get sync status for | 12D3KooWJJ9h4XVrVKgMr8ZgF6FKasEBiFEGtL7bmE8RQgzhKq1o |

- **Example**

```bash
curl http://127.0.0.1:2281/v1/syncStatus?peer_id=12D3KooWJJ9h4XVrVKgMr8ZgF6FKasEBiFEGtL7bmE8RQgzhKq1o
```

**Response**

```json
{
    "isSyncing": true,
    "syncStatus": [
        {
            "peerId": "12D3KooWJJ9h4XVrVKgMr8ZgF6FKasEBiFEGtL7bmE8RQgzhKq1o",
            "inSync": "true",
            "shouldSync": true,
            "divergencePrefix": "0x1234567890abcdef",
            "divergenceSecondsAgo": 300,
            "theirMessages": 1000000,
            "ourMessages": 999950,
            "lastBadSync": 1705796040744,
            "score": 0.95
        }
    ],
    "engineStarted": true
}
```

## forceSync

Force synchronization with a specific peer

**Query Parameters**
| Parameter | Description | Example |
| --------- | ----------- | ------- |
| peer_id | ID of the peer to force sync with | 12D3KooWJJ9h4XVrVKgMr8ZgF6FKasEBiFEGtL7bmE8RQgzhKq1o |

- **Example**

```bash
curl -X POST http://127.0.0.1:2281/v1/forceSync?peer_id=12D3KooWJJ9h4XVrVKgMr8ZgF6FKasEBiFEGtL7bmE8RQgzhKq1o
```

**Response**

```json
{
    "isSyncing": true,
    "syncStatus": [
        {
            "peerId": "12D3KooWJJ9h4XVrVKgMr8ZgF6FKasEBiFEGtL7bmE8RQgzhKq1o",
            "inSync": "false",
            "shouldSync": true,
            "divergencePrefix": "0x1234567890abcdef",
            "divergenceSecondsAgo": 0,
            "theirMessages": 1000000,
            "ourMessages": 999950,
            "lastBadSync": 0,
            "score": 1.0
        }
    ],
    "engineStarted": true
}
```
