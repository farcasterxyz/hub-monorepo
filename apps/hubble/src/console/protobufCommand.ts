import * as protobufs from '@farcaster/protobufs';
import { Factories } from '@farcaster/utils';
import { ConsoleCommandInterface } from './console';

export class ProtobufCommand implements ConsoleCommandInterface {
  commandName(): string {
    return 'protobufs';
  }
  shortHelp(): string {
    return 'Use the protobufs library to create and parse messages';
  }
  help(): string {
    return `
        Usage: protobufs.<protobuf>.<method>(<args>)
            eg.: protobufs.FidRequest.create({fid: 1})
            
        Note: Some protobuf methods are async, so you'll have to await them.            
        `;
  }
  object() {
    return protobufs;
  }
}

export class FactoriesCommand implements ConsoleCommandInterface {
  commandName(): string {
    return 'factories';
  }
  shortHelp(): string {
    return 'Use the factories library to create test messages';
  }
  help(): string {
    return `
        Usage: factories.<factory>.<method>(<args>)
            eg.: factories.Fid.build()
            
        Note: Some factory methods are async, so you'll have to await them.            
        `;
  }
  object() {
    return Factories;
  }
}
