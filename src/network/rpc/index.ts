/* eslint-disable no-restricted-imports */

import { RPCClient } from './client';
import { RPCServer } from './server';

// node --experimental-modules does not play nicely with exports and refuses to import a default interface even when
// implementing the fix described here: https://github.com/ardatan/graphql-tools/issues/913
// Requires further investigating, but export * seems like a decent workaround for now
export * from './interfaces';

export { RPCClient, RPCServer };
