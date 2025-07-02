import { HubEvent, HubRpcClient, SubscribeRequest, fromFarcasterTime } from "@farcaster/hub-nodejs";
import { ConsoleCommandInterface } from "./console.js";

export class TrackHubDelayCommand implements ConsoleCommandInterface {
  constructor(private readonly rpcClient: HubRpcClient) {}

  commandName(): string {
    return "trackHubDelay";
  }
  shortHelp(): string {
    return "Track the delay between the hub's eventId timestamp and the message's timestamp";
  }
  help(): string {
    return `
    Usage: trackHubDelay()

        Track the amount of delay that the connected hub is experiencing while merging messages
    `;
  }
  object() {
    return {
      start: async () => {
        // Create a client stream to connect to the hub
        const request = SubscribeRequest.create({});
        const streamResult = await this.rpcClient.subscribe(request);
        if (streamResult.isErr()) {
          console.error("Failed to subscribe to hub");
          return;
        }

        // Get the stream from the result
        const stream = streamResult.value;

        let totalDelay = 0;
        let numMessages = 0;

        const interval = setInterval(() => {
          if (numMessages > 0) {
            console.log(
              `Average delay: ${
                Math.round((totalDelay * 10 ** 2) / numMessages) / 10 ** 2
              } s from ${numMessages} messages`,
            );
          }
        }, 5 * 1000);

        // Listen for messages from the hub
        stream.on("data", (hubEvent: HubEvent) => {
          // Get the timestamp of the event
          const eventTimestamp = hubEvent.id / 4096 / 1000;

          // Get the message timeStamp
          const messageTimestamp = hubEvent.mergeMessageBody?.message?.data?.timestamp ?? 0;

          if (messageTimestamp) {
            // Calculate the delay
            const delay = eventTimestamp - messageTimestamp;
            if (delay > 1000) {
              console.log(
                `Huge Delay: ${Math.round(delay / 1000)}s.  Message timestamp: ${new Date(
                  fromFarcasterTime(messageTimestamp)._unsafeUnwrap(),
                )}`,
              );
            } else {
              totalDelay += delay;
              numMessages++;
            }
          }
        });

        const finished = new Promise((resolve) => {
          stream.on("close", () => {
            resolve(true);
          });
          stream.on("end", () => {
            resolve(true);
          });
          stream.on("error", () => {
            resolve(true);
          });
        });

        await finished;
        clearInterval(interval);
      },
    };
  }
}
