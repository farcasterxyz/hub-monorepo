import { Kysely, CamelCasePlugin, Generated, GeneratedAlways, Migrator, FileMigrationProvider } from 'kysely';
import { PostgresJSDialect } from 'kysely-postgres-js';
import postgres from 'postgres';
import { MessageType, ReactionType, UserDataType, HashScheme, SignatureScheme } from '@farcaster/hub-nodejs';
import * as path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { Logger } from './log';
import { err, ok, Result } from 'neverthrow';

export interface Database {
  hubSubscriptions: {
    host: string;
    lastEventId: number;
  };

  casts: {
    id: GeneratedAlways<string>;
    createdAt: Generated<Date>;
    updatedAt: Generated<Date>;
    deletedAt: Date | null;
    timestamp: Date;
    fid: number;
    text: string;
    hash: Uint8Array;
    parentHash: Uint8Array | null;
    parentFid: number | null;
    parentUrl: string | null;
    embeds: Generated<string[]>;
    mentions: Generated<number[]>;
    mentionsPositions: Generated<number[]>;
  };

  messages: {
    id: GeneratedAlways<string>;
    createdAt: Generated<Date>;
    updatedAt: Generated<Date>;
    deletedAt: Date | null;
    revokedAt: Date | null;
    prunedAt: Date | null;
    fid: number;
    messageType: MessageType;
    timestamp: Date;
    hash: Uint8Array;
    hashScheme: HashScheme;
    signature: Uint8Array;
    signatureScheme: SignatureScheme;
    signer: Uint8Array;
    raw: Uint8Array;
  };

  reactions: {
    id: GeneratedAlways<string>;
    createdAt: Generated<Date>;
    updatedAt: Generated<Date>;
    deletedAt: Date | null;
    fid: number;
    reactionType: ReactionType;
    timestamp: Date;
    hash: Uint8Array;
    targetHash: Uint8Array | null;
    targetFid: number | null;
    targetUrl: string | null;
  };

  signers: {
    id: GeneratedAlways<string>;
    createdAt: Generated<Date>;
    updatedAt: Generated<Date>;
    deletedAt: Date | null;
    timestamp: Date;
    fid: number;
    custodyAddress: Uint8Array;
    signer: Uint8Array;
    name: string | null;
    hash: Uint8Array;
  };

  verifications: {
    id: GeneratedAlways<string>;
    createdAt: Generated<Date>;
    updatedAt: Generated<Date>;
    deletedAt: Date | null;
    fid: number;
    timestamp: Date;
    hash: Uint8Array;
    claim: {
      address: string;
      ethSignature: string;
      blockHash: string;
    };
  };

  userData: {
    id: GeneratedAlways<string>;
    createdAt: Generated<Date>;
    updatedAt: Generated<Date>;
    deletedAt: Date | null;
    timestamp: Date;
    fid: number;
    hash: Uint8Array;
    type: UserDataType;
    value: string;
  };

  fids: {
    fid: number;
    createdAt: Generated<Date>;
    updatedAt: Generated<Date>;
    custodyAddress: Uint8Array;
  };

  fnames: {
    fname: string;
    createdAt: Generated<Date>;
    updatedAt: Generated<Date>;
    custodyAddress: Uint8Array;
    expiresAt: Date;
  };

  links: {
    id: GeneratedAlways<string>;
    fid: number;
    targetFid: number | null;
    type: string;
    timestamp: Date;
    createdAt: Generated<Date>;
    updatedAt: Generated<Date>;
    displayTimestamp: Date | null;
    deletedAt: Date | null;
  };
}

export const getDbClient = (connectionString: string) => {
  return new Kysely<Database>({
    dialect: new PostgresJSDialect({
      connectionString,
      options: {
        max: 10,
        types: {
          // BigInts will not exceed Number.MAX_SAFE_INTEGER for our use case.
          // Return as JavaScript's `number` type so it's easier to work with.
          bigint: {
            to: 20,
            from: 20,
            parse: (x: any) => Number(x),
            serialize: (x: any) => x.toString(),
          },
        },
      },
      postgres,
    }),
    plugins: [new CamelCasePlugin()],
  });
};

export const migrateToLatest = async (db: Kysely<any>, log: Logger): Promise<Result<void, unknown>> => {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations'),
    }),
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((it) => {
    if (it.status === 'Success') {
      log.info(`migration "${it.migrationName}" was executed successfully`);
    } else if (it.status === 'Error') {
      log.error(`failed to execute migration "${it.migrationName}"`);
    }
  });

  if (error) {
    log.error('failed to migrate');
    log.error(error);
    return err(error);
  }

  return ok(undefined);
};
