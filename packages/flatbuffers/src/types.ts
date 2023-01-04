import * as message_generated from './generated/message_generated';

export interface CastRemoveMessage extends message_generated.Message {
  body(): message_generated.CastRemoveBody;
}

export interface CastAddMessage extends message_generated.Message {
  body(): message_generated.CastAddBody;
}

export interface AmpAddMessage extends message_generated.Message {
  body(): message_generated.AmpBody;
}

export interface AmpRemoveMessage extends message_generated.Message {
  body(): message_generated.AmpBody;
}

export interface ReactionAddMessage extends message_generated.Message {
  body(): message_generated.ReactionBody;
}

export interface ReactionRemoveMessage extends message_generated.Message {
  body(): message_generated.ReactionBody;
}

export interface VerificationAddEthAddressMessage extends message_generated.Message {
  body(): message_generated.VerificationAddEthAddressBody;
}

export interface VerificationRemoveMessage extends message_generated.Message {
  body(): message_generated.VerificationRemoveBody;
}

export interface SignerAddMessage extends message_generated.Message {
  body(): message_generated.SignerBody;
}

export interface SignerRemoveMessage extends message_generated.Message {
  body(): message_generated.SignerBody;
}

export interface UserDataAddMessage extends message_generated.Message {
  body(): message_generated.UserDataBody;
}
