import { ServerWritableStream, HubEvent, SubscribeRequest, HubError, HubResult } from "@farcaster/hub-nodejs";
import { err, ok } from "neverthrow";

export const STREAM_DRAIN_TIMEOUT_MS = 10_000;
export const SLOW_CLIENT_GRACE_PERIOD_MS = 60_000;
// TODO: Make this configurable via CLI
export const STREAM_MESSAGE_BUFFER_SIZE = 10_000;

/**
 * A BufferedStreamWriter is a wrapper around a gRPC stream that will buffer messages when the stream is backed up.
 *
 * It will cache 1000 messages if the stream is full. If the stream is still full after 10 seconds,
 * or if the cache exceeds 1000 messages, the stream will be destroyed.
 */
export class BufferedStreamWriter {
  private streamIsBackedUp = false;
  private stream: ServerWritableStream<SubscribeRequest, HubEvent>;
  // biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
  private dataWaitingForDrain: any[] = [];

  constructor(stream: ServerWritableStream<SubscribeRequest, HubEvent>) {
    this.stream = stream;
  }

  /**
   * Write to the stream. Returns
   * ok(true) if the message was written
   * ok(false) if the message was buffered because the stream is full
   * err if the stream can't be written to any more and will be closed.
   */
  // biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
  public writeToStream(message: any): HubResult<boolean> {
    if (this.streamIsBackedUp) {
      this.dataWaitingForDrain.push(message);

      if (this.dataWaitingForDrain.length > STREAM_MESSAGE_BUFFER_SIZE) {
        this.destroyStream();

        return err(new HubError("unavailable.network_failure", "Stream is backed up and cache is full"));
      }

      return ok(false);
    }

    // If the write() method returns false, it means that the stream is backed up and we should wait for the 'drain' event
    if (this.stream.write(message)) {
      return ok(true);
    } else {
      this.streamIsBackedUp = true;

      // We'll wait only for 10 seconds before destroying the stream
      const timeout = setTimeout(() => this.destroyStream(), STREAM_DRAIN_TIMEOUT_MS);

      this.stream.once("drain", () => {
        this.streamIsBackedUp = false;
        clearTimeout(timeout);

        this.sendWaitingData();
      });
      return ok(true);
    }
  }

  // Send all the data that was waiting for the stream to drain.
  private sendWaitingData() {
    while (this.dataWaitingForDrain.length > 0 && !this.streamIsBackedUp) {
      const message = this.dataWaitingForDrain.shift();

      this.writeToStream(message);
    }
  }

  private destroyStream() {
    this.dataWaitingForDrain = [];
    this.stream.emit("error", new Error("Stream is backed up, please consume events faster. Closing stream."));
    this.stream.end();
  }

  public getCacheSize(): number {
    return this.dataWaitingForDrain.length;
  }

  public isStreamBackedUp(): boolean {
    return this.streamIsBackedUp;
  }
}
