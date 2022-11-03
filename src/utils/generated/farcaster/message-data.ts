// automatically generated by the FlatBuffers compiler, do not modify

import * as flatbuffers from 'flatbuffers';

import { CastAddBody, CastAddBodyT } from '../farcaster/cast-add-body';
import { CastRemoveBody, CastRemoveBodyT } from '../farcaster/cast-remove-body';
import { FarcasterNetwork } from '../farcaster/farcaster-network';
import { FollowBody, FollowBodyT } from '../farcaster/follow-body';
import { MessageBody, unionToMessageBody, unionListToMessageBody } from '../farcaster/message-body';
import { MessageType } from '../farcaster/message-type';
import { ReactionBody, ReactionBodyT } from '../farcaster/reaction-body';
import { SignerBody, SignerBodyT } from '../farcaster/signer-body';
import { UserDataBody, UserDataBodyT } from '../farcaster/user-data-body';
import { VerificationAddEthAddressBody, VerificationAddEthAddressBodyT } from '../farcaster/verification-add-eth-address-body';
import { VerificationRemoveBody, VerificationRemoveBodyT } from '../farcaster/verification-remove-body';


export class MessageData {
  bb: flatbuffers.ByteBuffer|null = null;
  bb_pos = 0;
  __init(i:number, bb:flatbuffers.ByteBuffer):MessageData {
  this.bb_pos = i;
  this.bb = bb;
  return this;
}

static getRootAsMessageData(bb:flatbuffers.ByteBuffer, obj?:MessageData):MessageData {
  return (obj || new MessageData()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
}

static getSizePrefixedRootAsMessageData(bb:flatbuffers.ByteBuffer, obj?:MessageData):MessageData {
  bb.setPosition(bb.position() + flatbuffers.SIZE_PREFIX_LENGTH);
  return (obj || new MessageData()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
}

bodyType():MessageBody {
  const offset = this.bb!.__offset(this.bb_pos, 4);
  return offset ? this.bb!.readUint8(this.bb_pos + offset) : MessageBody.NONE;
}

body<T extends flatbuffers.Table>(obj:any):any|null {
  const offset = this.bb!.__offset(this.bb_pos, 6);
  return offset ? this.bb!.__union(obj, this.bb_pos + offset) : null;
}

type():MessageType {
  const offset = this.bb!.__offset(this.bb_pos, 8);
  return offset ? this.bb!.readUint16(this.bb_pos + offset) : MessageType.CastAdd;
}

timestamp():number {
  const offset = this.bb!.__offset(this.bb_pos, 10);
  return offset ? this.bb!.readUint32(this.bb_pos + offset) : 0;
}

fid(index: number):number|null {
  const offset = this.bb!.__offset(this.bb_pos, 12);
  return offset ? this.bb!.readUint8(this.bb!.__vector(this.bb_pos + offset) + index) : 0;
}

fidLength():number {
  const offset = this.bb!.__offset(this.bb_pos, 12);
  return offset ? this.bb!.__vector_len(this.bb_pos + offset) : 0;
}

fidArray():Uint8Array|null {
  const offset = this.bb!.__offset(this.bb_pos, 12);
  return offset ? new Uint8Array(this.bb!.bytes().buffer, this.bb!.bytes().byteOffset + this.bb!.__vector(this.bb_pos + offset), this.bb!.__vector_len(this.bb_pos + offset)) : null;
}

network():FarcasterNetwork {
  const offset = this.bb!.__offset(this.bb_pos, 14);
  return offset ? this.bb!.readUint8(this.bb_pos + offset) : FarcasterNetwork.Mainnet;
}

static startMessageData(builder:flatbuffers.Builder) {
  builder.startObject(6);
}

static addBodyType(builder:flatbuffers.Builder, bodyType:MessageBody) {
  builder.addFieldInt8(0, bodyType, MessageBody.NONE);
}

static addBody(builder:flatbuffers.Builder, bodyOffset:flatbuffers.Offset) {
  builder.addFieldOffset(1, bodyOffset, 0);
}

static addType(builder:flatbuffers.Builder, type:MessageType) {
  builder.addFieldInt16(2, type, MessageType.CastAdd);
}

static addTimestamp(builder:flatbuffers.Builder, timestamp:number) {
  builder.addFieldInt32(3, timestamp, 0);
}

static addFid(builder:flatbuffers.Builder, fidOffset:flatbuffers.Offset) {
  builder.addFieldOffset(4, fidOffset, 0);
}

static createFidVector(builder:flatbuffers.Builder, data:number[]|Uint8Array):flatbuffers.Offset {
  builder.startVector(1, data.length, 1);
  for (let i = data.length - 1; i >= 0; i--) {
    builder.addInt8(data[i]!);
  }
  return builder.endVector();
}

static startFidVector(builder:flatbuffers.Builder, numElems:number) {
  builder.startVector(1, numElems, 1);
}

static addNetwork(builder:flatbuffers.Builder, network:FarcasterNetwork) {
  builder.addFieldInt8(5, network, FarcasterNetwork.Mainnet);
}

static endMessageData(builder:flatbuffers.Builder):flatbuffers.Offset {
  const offset = builder.endObject();
  builder.requiredField(offset, 6) // body
  builder.requiredField(offset, 12) // fid
  return offset;
}

static createMessageData(builder:flatbuffers.Builder, bodyType:MessageBody, bodyOffset:flatbuffers.Offset, type:MessageType, timestamp:number, fidOffset:flatbuffers.Offset, network:FarcasterNetwork):flatbuffers.Offset {
  MessageData.startMessageData(builder);
  MessageData.addBodyType(builder, bodyType);
  MessageData.addBody(builder, bodyOffset);
  MessageData.addType(builder, type);
  MessageData.addTimestamp(builder, timestamp);
  MessageData.addFid(builder, fidOffset);
  MessageData.addNetwork(builder, network);
  return MessageData.endMessageData(builder);
}

unpack(): MessageDataT {
  return new MessageDataT(
    this.bodyType(),
    (() => {
      let temp = unionToMessageBody(this.bodyType(), this.body.bind(this));
      if(temp === null) { return null; }
      return temp.unpack()
  })(),
    this.type(),
    this.timestamp(),
    this.bb!.createScalarList(this.fid.bind(this), this.fidLength()),
    this.network()
  );
}


unpackTo(_o: MessageDataT): void {
  _o.bodyType = this.bodyType();
  _o.body = (() => {
      let temp = unionToMessageBody(this.bodyType(), this.body.bind(this));
      if(temp === null) { return null; }
      return temp.unpack()
  })();
  _o.type = this.type();
  _o.timestamp = this.timestamp();
  _o.fid = this.bb!.createScalarList(this.fid.bind(this), this.fidLength());
  _o.network = this.network();
}
}

export class MessageDataT {
constructor(
  public bodyType: MessageBody = MessageBody.NONE,
  public body: CastAddBodyT|CastRemoveBodyT|FollowBodyT|ReactionBodyT|SignerBodyT|UserDataBodyT|VerificationAddEthAddressBodyT|VerificationRemoveBodyT|null = null,
  public type: MessageType = MessageType.CastAdd,
  public timestamp: number = 0,
  public fid: (number)[] = [],
  public network: FarcasterNetwork = FarcasterNetwork.Mainnet
){}


pack(builder:flatbuffers.Builder): flatbuffers.Offset {
  const body = builder.createObjectOffset(this.body);
  const fid = MessageData.createFidVector(builder, this.fid);

  return MessageData.createMessageData(builder,
    this.bodyType,
    body,
    this.type,
    this.timestamp,
    fid,
    this.network
  );
}
}
