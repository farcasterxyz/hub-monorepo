import * as flatbuffers from '@farcaster/flatbuffers';
import { eventRequests } from './eventRequests';

describe('eventRequests', () => {
  describe('subscribeRequest', () => {
    test('succeeds with no eventTypes', () => {
      const subscribeRequest = eventRequests.subscribeRequest();
      expect(subscribeRequest).toBeInstanceOf(flatbuffers.SubscribeRequest);
      expect(subscribeRequest.eventTypesLength()).toBe(0);
    });

    test('succeeds with eventTypes', () => {
      const eventTypes = [flatbuffers.EventType.MergeMessage, flatbuffers.EventType.PruneMessage];
      const subscribeRequest = eventRequests.subscribeRequest(eventTypes);
      expect(subscribeRequest).toBeInstanceOf(flatbuffers.SubscribeRequest);
      expect(subscribeRequest.eventTypesLength()).toBe(eventTypes.length);
      eventTypes.forEach((eventType, index) => expect(subscribeRequest.eventTypes(index)).toEqual(eventType));
    });
  });
});
