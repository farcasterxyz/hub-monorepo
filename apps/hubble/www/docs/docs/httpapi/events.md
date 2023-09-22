
# Events API
The events API returns events as they are merged into the Hub, which can be used to listen to Hub activity.

## eventById
Get an event by its Id


**Query Parameters**
| Parameter | Description | Example |
| --------- | ----------- | ------- |
| event_id | The Hub Id of the event | `event_id=350909155450880` |


**Example**
```bash
curl http://127.0.0.1:2281/v1/eventById?id=350909155450880

```


**Response**
```json
{
  "type": "HUB_EVENT_TYPE_MERGE_USERNAME_PROOF",
  "id": 350909155450880,
  "mergeUsernameProofBody": {
    "usernameProof": {
      "timestamp": 1695049760,
      "name": "nftonyp",
      "owner": "0x23b3c29900762a70def5dc8890e09dc9019eb553",
      "signature": "xp41PgeO...hJpNshw=",
      "fid": 20114,
      "type": "USERNAME_TYPE_FNAME"
    }
  }
}
```

## events
Get a page of Hub events

**Query Parameters**
| Parameter | Description | Example |
| --------- | ----------- | ------- |
| from_event_id | An optional Hub Id to start getting events from. This is also returned from the API as `nextPageEventId`, which can be used to page through all the Hub events. Set it to `0` to start from the first event | `from_event_id=350909155450880` |

**Note**
Hubs prune events older than 3 days, so not all historical events can be fetched via this API

**Example**
```bash
curl http://127.0.0.1:2281/v1/events?from_event_id=350909155450880

```


**Response**
```json
{
  "nextPageEventId": 350909170294785,
  "events": [
    {
      "type": "HUB_EVENT_TYPE_MERGE_USERNAME_PROOF",
      "id": 350909155450880,
      "mergeUsernameProofBody": {
        "usernameProof": {
          "timestamp": 1695049760,
          "name": "nftonyp",
          "owner": "0x23b3c29900762a70def5dc8890e09dc9019eb553",
          "signature": "xp41PgeOz...9Jw5vT/eLnGphJpNshw=",
          "fid": 20114,
          "type": "USERNAME_TYPE_FNAME"
        }
      }
    },
    ...
  ]
}
```