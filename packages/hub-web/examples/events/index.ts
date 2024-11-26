import axios from "axios";

async function listen() {
  const server = "http://nemes.farcaster.xyz:2281";

  let from_event_id = 0;

  do {
    try {
      import axios from "axios";

const handleEvents = async () => {
  try {
    // Safely construct the URL using the URL object
    const serverUrl = new URL(`${server}/v1/events`);
    serverUrl.searchParams.append("from_event_id", from_event_id);

    // Execute the request using axios
    const response = await axios.get(serverUrl.toString());

    // Process each event from the response
    for (const event of response.data.events) {
      console.log(event);
    }

    // Check for absence or minimal number of events
    if (response.data.events.length <= 1) {
      console.log("No events or only one event found. Waiting...");
      // Implement wait logic here if needed
    }
  } catch (error) {
    // Handle errors and provide meaningful feedback
    console.error("Error fetching events:", error.message);
  }
};

handleEvents();
import axios from "axios";

const handleEvents = async () => {
  try {
    // Safely construct the URL using the URL object
    const serverUrl = new URL(`${server}/v1/events`);
    serverUrl.searchParams.append("from_event_id", from_event_id);

    // Execute the request using axios
    const response = await axios.get(serverUrl.toString());

    // Process each event from the response
    for (const event of response.data.events) {
      console.log(event);
    }

    // Check for absence or minimal number of events
    if (response.data.events.length <= 1) {
      console.log("No events or only one event found. Waiting...");
      // Implement wait logic here if needed
    }
  } catch (error) {
    // Handle errors and provide meaningful feedback
    console.error("Error fetching events:", error.message);
  }
};

handleEvents();

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
