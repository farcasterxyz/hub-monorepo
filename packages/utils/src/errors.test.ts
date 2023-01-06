import { HubError } from './errors';

describe('HubError', () => {
  test('can be instantiated', () => {
    const error = new HubError('bad_request.invalid_param', 'test message');
    expect(error).toBeInstanceOf(HubError);
  });
});
