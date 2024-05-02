import axios from "axios";

async function listen() {
  const server = "https://nemes.farcaster.xyz:2281";

  let from_event_id = 0;

  do {
    try {
      const url = `${server}/v1/events?from_event_id=${from_event_id}`;
      const response = await axios.get(url);
      for (const event of response.data.events) {
        console.log(event);
      }
      if (response.data.events.length <= 1) {
        // wait a bit if there are no events
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      from_event_id = response.data.nextPageEventId;
    } catch (e) {
      // handle errors
      console.error("Error getting events: ", e.response.data);
      break;
    }
  } while (true);
}

listen().then(() => console.log("Done!"));
