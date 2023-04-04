import { validations } from '@farcaster/hub-nodejs';
import { parentPort } from 'worker_threads';

// Wait for messages from the main thread and validate them, posting the result back
parentPort?.on('message', (data) => {
  (async () => {
    const { id, message } = data;
    const result = await validations.validateMessage(message);

    if (result.isErr()) {
      parentPort?.postMessage({ id, errCode: result.error.errCode, errMessage: result.error.message });
    } else {
      parentPort?.postMessage({ id, message: result.value });
    }
  })();
});
