import type { IdentifierSpec } from 'caip/dist/types';

export const REGEX_BLAKE2B_HASH = '0x[a-f0-9]{64}';

export const FarcasterIdSpec: IdentifierSpec = {
  name: 'farcasterId',
  regex: 'id:[1-9][0-9]{0,77}',
  parameters: {
    delimiter: ':',
    values: {
      0: {
        name: 'namespace',
        regex: '^id$',
      },
      1: {
        name: 'value',
        regex: '^[1-9][0-9]{0,77}$',
      },
    },
  },
};

export const CastHashSpec: IdentifierSpec = {
  name: 'castHash',
  regex: 'cast:' + REGEX_BLAKE2B_HASH,
  parameters: {
    delimiter: ':',
    values: {
      0: {
        name: 'messageType',
        regex: '^cast$',
      },
      1: {
        name: 'value',
        regex: '^' + REGEX_BLAKE2B_HASH + '$',
      },
    },
  },
};

export const CastIdSpec: IdentifierSpec = {
  name: 'castId',
  regex: FarcasterIdSpec.regex + '/' + CastHashSpec.regex,
  parameters: {
    delimiter: '/',
    values: {
      0: FarcasterIdSpec,
      1: CastHashSpec,
    },
  },
};
