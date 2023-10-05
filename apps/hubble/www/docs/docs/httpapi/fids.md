# FIDs API


## fids
Get a list of all the FIDs

**Query Parameters**
| Parameter | Description | Example |
| --------- | ----------- | ------- |
|  | This endpoint accepts no parameters |  |


**Example**
```bash
curl http://127.0.0.1:2281/v1/fids
```


**Response**
```json
{
  "fids": [1, 2, 3, 4, 5, 6],
  "nextPageToken": "AAAnEA=="
}
```
