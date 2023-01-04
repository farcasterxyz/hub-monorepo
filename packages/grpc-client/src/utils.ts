import grpc from '@grpc/grpc-js';
import { HubError } from '@hub/errors';

export const fromServiceError = (err: grpc.ServiceError): HubError => {
  return new HubError(err.metadata.get('errCode')[0] as HubErrorCode, err.details);
};
