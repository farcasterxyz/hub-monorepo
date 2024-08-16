import { BufferedStreamWriter, STREAM_MESSAGE_BUFFER_SIZE } from "../bufferedStreamWriter.js";
import { HubEvent, SubscribeRequest, ServerWritableStream } from "@farcaster/hub-nodejs";

type StreamMessage = { data: number };

class MockStream {
  isFull = false;
  isDestroyed = false;
  totalMessages = 0;
  previousMessage = { data: 0 };

  callback?: () => void;

  write(_msg: StreamMessage): boolean {
    this.totalMessages++;
    expect(_msg.data).toEqual(this.previousMessage.data + 1); // Ensure message order is correct
    this.previousMessage = _msg;
    return !this.isFull;
  }

  once(event: string, callback: () => void) {
    this.callback = callback;
  }

  finishDrain(resetFull = true) {
    this.isFull = !resetFull;
    if (this.callback) {
      this.callback();
    }
  }

  emit(evt: string, error: Error) {}

  end() {
    this.isDestroyed = true;
  }

  reset() {
    this.previousMessage = { data: 0 };
  }
}

describe("Writing to a stream", () => {
  let mockStream: MockStream;
  let stream: BufferedStreamWriter;

  beforeEach(() => {
    mockStream = new MockStream();
    stream = new BufferedStreamWriter(mockStream as unknown as ServerWritableStream<SubscribeRequest, HubEvent>);
  });

  afterEach(() => {
    mockStream.finishDrain();
    mockStream.reset();
  });

  test("should write to a stream", () => {
    expect(stream.writeToStream({ data: 1 }).isOk()).toBe(true);
    expect(mockStream.totalMessages).toBe(1);
    expect(stream.isStreamBackedUp()).toBe(false);

    // Make the stream full
    mockStream.isFull = true;

    // Can still write to the stream, but this time it will be backed up.
    expect(stream.writeToStream({ data: 2 }).isOk()).toBe(true);
    expect(stream.getCacheSize()).toBe(0);
    expect(stream.isStreamBackedUp()).toBe(true);
    expect(mockStream.totalMessages).toBe(2); // The write goes through, but the next one will be buffered

    // Write to the stream again, this time it will be buffered
    expect(stream.writeToStream({ data: 3 }).isOk()).toBe(true);
    expect(stream.getCacheSize()).toBe(1);
    expect(stream.isStreamBackedUp()).toBe(true);
    expect(mockStream.totalMessages).toBe(2); // The write did not go through, it is buffered

    // Drain the stream
    mockStream.finishDrain();

    // The stream is no longer backed up
    expect(stream.isStreamBackedUp()).toBe(false);
    expect(stream.getCacheSize()).toBe(0);
    expect(mockStream.totalMessages).toBe(3); // The write went through
  });

  test("Exceeding the buffer size should destroy the stream", () => {
    // Make the stream full, so all writes will be buffered
    mockStream.isFull = true;
    expect(stream.writeToStream({ data: 1 }).isOk()).toBe(true);

    // Write to the stream until the cache is full
    for (let i = 0; i < STREAM_MESSAGE_BUFFER_SIZE; i++) {
      expect(stream.writeToStream({ data: i }).isOk()).toBe(true);
    }
    expect(stream.getCacheSize()).toBe(STREAM_MESSAGE_BUFFER_SIZE);
    expect(stream.isStreamBackedUp()).toBe(true);
    expect(mockStream.isDestroyed).toBe(false);

    // The cache is full, the stream is still full, so the stream should be destroyed
    expect(stream.writeToStream({ data: 1 }).isErr()).toBe(true);

    expect(stream.getCacheSize()).toBe(0);
    expect(mockStream.isDestroyed).toBe(true);
  });

  test("handles write failing when draining", () => {
    // Make the stream full, so all writes will be buffered
    mockStream.isFull = true;
    expect(stream.writeToStream({ data: 1 }).isOk()).toBe(true);
    expect(stream.writeToStream({ data: 2 }).isOk()).toBe(true);
    expect(stream.writeToStream({ data: 3 }).isOk()).toBe(true);
    expect(stream.writeToStream({ data: 4 }).isOk()).toBe(true);

    // Drain the stream but don't reset full state. Simulates a write failing while draining
    mockStream.finishDrain(false);

    // Stream is still backed up
    expect(stream.isStreamBackedUp()).toBe(true);

    mockStream.finishDrain(true);

    // It's now cleared
    expect(stream.isStreamBackedUp()).toBe(false);
  });
});
