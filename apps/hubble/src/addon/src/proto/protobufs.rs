#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct UserNameProof {
    #[prost(uint64, tag = "1")]
    pub timestamp: u64,
    #[prost(bytes = "vec", tag = "2")]
    pub name: ::prost::alloc::vec::Vec<u8>,
    #[prost(bytes = "vec", tag = "3")]
    pub owner: ::prost::alloc::vec::Vec<u8>,
    #[prost(bytes = "vec", tag = "4")]
    pub signature: ::prost::alloc::vec::Vec<u8>,
    #[prost(uint64, tag = "5")]
    pub fid: u64,
    #[prost(enumeration = "UserNameType", tag = "6")]
    pub r#type: i32,
}
impl ::prost::Name for UserNameProof {
    const NAME: &'static str = "UserNameProof";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum UserNameType {
    UsernameTypeNone = 0,
    UsernameTypeFname = 1,
    UsernameTypeEnsL1 = 2,
}
impl UserNameType {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            UserNameType::UsernameTypeNone => "USERNAME_TYPE_NONE",
            UserNameType::UsernameTypeFname => "USERNAME_TYPE_FNAME",
            UserNameType::UsernameTypeEnsL1 => "USERNAME_TYPE_ENS_L1",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "USERNAME_TYPE_NONE" => Some(Self::UsernameTypeNone),
            "USERNAME_TYPE_FNAME" => Some(Self::UsernameTypeFname),
            "USERNAME_TYPE_ENS_L1" => Some(Self::UsernameTypeEnsL1),
            _ => None,
        }
    }
}
/// *
/// A Message is a delta operation on the Farcaster network. The message protobuf is an envelope
/// that wraps a MessageData object and contains a hash and signature which can verify its authenticity.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct Message {
    /// Contents of the message
    #[prost(message, optional, tag = "1")]
    pub data: ::core::option::Option<MessageData>,
    /// Hash digest of data
    #[prost(bytes = "vec", tag = "2")]
    pub hash: ::prost::alloc::vec::Vec<u8>,
    /// Hash scheme that produced the hash digest
    #[prost(enumeration = "HashScheme", tag = "3")]
    pub hash_scheme: i32,
    /// Signature of the hash digest
    #[prost(bytes = "vec", tag = "4")]
    pub signature: ::prost::alloc::vec::Vec<u8>,
    /// Signature scheme that produced the signature
    #[prost(enumeration = "SignatureScheme", tag = "5")]
    pub signature_scheme: i32,
    /// Public key or address of the key pair that produced the signature
    #[prost(bytes = "vec", tag = "6")]
    pub signer: ::prost::alloc::vec::Vec<u8>,
    /// MessageData serialized to bytes if using protobuf serialization other than ts-proto
    #[prost(bytes = "vec", optional, tag = "7")]
    pub data_bytes: ::core::option::Option<::prost::alloc::vec::Vec<u8>>,
}
impl ::prost::Name for Message {
    const NAME: &'static str = "Message";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
/// *
/// A MessageData object contains properties common to all messages and wraps a body object which
/// contains properties specific to the MessageType.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct MessageData {
    /// Type of message contained in the body
    #[prost(enumeration = "MessageType", tag = "1")]
    pub r#type: i32,
    /// Farcaster ID of the user producing the message
    #[prost(uint64, tag = "2")]
    pub fid: u64,
    /// Farcaster epoch timestamp in seconds
    #[prost(uint32, tag = "3")]
    pub timestamp: u32,
    /// Farcaster network the message is intended for
    #[prost(enumeration = "FarcasterNetwork", tag = "4")]
    pub network: i32,
    #[prost(oneof = "message_data::Body", tags = "5, 6, 7, 9, 10, 12, 14, 15, 16")]
    pub body: ::core::option::Option<message_data::Body>,
}
/// Nested message and enum types in `MessageData`.
pub mod message_data {
    #[allow(clippy::derive_partial_eq_without_eq)]
    #[derive(Clone, PartialEq, ::prost::Oneof)]
    pub enum Body {
        #[prost(message, tag = "5")]
        CastAddBody(super::CastAddBody),
        #[prost(message, tag = "6")]
        CastRemoveBody(super::CastRemoveBody),
        #[prost(message, tag = "7")]
        ReactionBody(super::ReactionBody),
        #[prost(message, tag = "9")]
        VerificationAddAddressBody(super::VerificationAddAddressBody),
        #[prost(message, tag = "10")]
        VerificationRemoveBody(super::VerificationRemoveBody),
        /// SignerAddBody signer_add_body = 11; // Deprecated
        #[prost(message, tag = "12")]
        UserDataBody(super::UserDataBody),
        /// SignerRemoveBody signer_remove_body = 13; // Deprecated
        #[prost(message, tag = "14")]
        LinkBody(super::LinkBody),
        #[prost(message, tag = "15")]
        UsernameProofBody(super::UserNameProof),
        #[prost(message, tag = "16")]
        FrameActionBody(super::FrameActionBody),
    }
}
impl ::prost::Name for MessageData {
    const NAME: &'static str = "MessageData";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
/// * Adds metadata about a user
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct UserDataBody {
    /// Type of metadata
    #[prost(enumeration = "UserDataType", tag = "1")]
    pub r#type: i32,
    /// Value of the metadata
    #[prost(string, tag = "2")]
    pub value: ::prost::alloc::string::String,
}
impl ::prost::Name for UserDataBody {
    const NAME: &'static str = "UserDataBody";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct Embed {
    #[prost(oneof = "embed::Embed", tags = "1, 2")]
    pub embed: ::core::option::Option<embed::Embed>,
}
/// Nested message and enum types in `Embed`.
pub mod embed {
    #[allow(clippy::derive_partial_eq_without_eq)]
    #[derive(Clone, PartialEq, ::prost::Oneof)]
    pub enum Embed {
        #[prost(string, tag = "1")]
        Url(::prost::alloc::string::String),
        #[prost(message, tag = "2")]
        CastId(super::CastId),
    }
}
impl ::prost::Name for Embed {
    const NAME: &'static str = "Embed";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
/// * Adds a new Cast
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CastAddBody {
    /// URLs to be embedded in the cast
    #[prost(string, repeated, tag = "1")]
    pub embeds_deprecated: ::prost::alloc::vec::Vec<::prost::alloc::string::String>,
    /// Fids mentioned in the cast
    #[prost(uint64, repeated, tag = "2")]
    pub mentions: ::prost::alloc::vec::Vec<u64>,
    /// Text of the cast
    #[prost(string, tag = "4")]
    pub text: ::prost::alloc::string::String,
    /// Positions of the mentions in the text
    #[prost(uint32, repeated, tag = "5")]
    pub mentions_positions: ::prost::alloc::vec::Vec<u32>,
    /// URLs or cast ids to be embedded in the cast
    #[prost(message, repeated, tag = "6")]
    pub embeds: ::prost::alloc::vec::Vec<Embed>,
    #[prost(oneof = "cast_add_body::Parent", tags = "3, 7")]
    pub parent: ::core::option::Option<cast_add_body::Parent>,
}
/// Nested message and enum types in `CastAddBody`.
pub mod cast_add_body {
    #[allow(clippy::derive_partial_eq_without_eq)]
    #[derive(Clone, PartialEq, ::prost::Oneof)]
    pub enum Parent {
        /// Parent cast of the cast
        #[prost(message, tag = "3")]
        ParentCastId(super::CastId),
        /// Parent URL
        #[prost(string, tag = "7")]
        ParentUrl(::prost::alloc::string::String),
    }
}
impl ::prost::Name for CastAddBody {
    const NAME: &'static str = "CastAddBody";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
/// * Removes an existing Cast
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CastRemoveBody {
    /// Hash of the cast to remove
    #[prost(bytes = "vec", tag = "1")]
    pub target_hash: ::prost::alloc::vec::Vec<u8>,
}
impl ::prost::Name for CastRemoveBody {
    const NAME: &'static str = "CastRemoveBody";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
/// * Identifier used to look up a Cast
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CastId {
    /// Fid of the user who created the cast
    #[prost(uint64, tag = "1")]
    pub fid: u64,
    /// Hash of the cast
    #[prost(bytes = "vec", tag = "2")]
    pub hash: ::prost::alloc::vec::Vec<u8>,
}
impl ::prost::Name for CastId {
    const NAME: &'static str = "CastId";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
/// * Adds or removes a Reaction from a Cast
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct ReactionBody {
    /// Type of reaction
    #[prost(enumeration = "ReactionType", tag = "1")]
    pub r#type: i32,
    #[prost(oneof = "reaction_body::Target", tags = "2, 3")]
    pub target: ::core::option::Option<reaction_body::Target>,
}
/// Nested message and enum types in `ReactionBody`.
pub mod reaction_body {
    #[allow(clippy::derive_partial_eq_without_eq)]
    #[derive(Clone, PartialEq, ::prost::Oneof)]
    pub enum Target {
        /// CastId of the Cast to react to
        #[prost(message, tag = "2")]
        TargetCastId(super::CastId),
        /// URL to react to
        #[prost(string, tag = "3")]
        TargetUrl(::prost::alloc::string::String),
    }
}
impl ::prost::Name for ReactionBody {
    const NAME: &'static str = "ReactionBody";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
/// * Adds a Verification of ownership of an Address based on Protocol
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct VerificationAddAddressBody {
    /// Address being verified for a given Protocol
    #[prost(bytes = "vec", tag = "1")]
    pub address: ::prost::alloc::vec::Vec<u8>,
    /// Signature produced by the user's address for a given Protocol
    #[prost(bytes = "vec", tag = "2")]
    pub claim_signature: ::prost::alloc::vec::Vec<u8>,
    /// Hash of the latest Ethereum block when the signature was produced
    #[prost(bytes = "vec", tag = "3")]
    pub block_hash: ::prost::alloc::vec::Vec<u8>,
    /// Type of verification. 0 = EOA, 1 = contract
    #[prost(uint32, tag = "4")]
    pub verification_type: u32,
    /// 0 for EOA verifications, 1 or 10 for contract verifications
    #[prost(uint32, tag = "5")]
    pub chain_id: u32,
    /// Protocol of the Verification
    #[prost(enumeration = "Protocol", tag = "7")]
    pub protocol: i32,
}
impl ::prost::Name for VerificationAddAddressBody {
    const NAME: &'static str = "VerificationAddAddressBody";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
/// * Removes a Verification of a given protocol
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct VerificationRemoveBody {
    /// Address of the Verification to remove
    #[prost(bytes = "vec", tag = "1")]
    pub address: ::prost::alloc::vec::Vec<u8>,
    /// Protocol of the Verification to remove
    #[prost(enumeration = "Protocol", tag = "2")]
    pub protocol: i32,
}
impl ::prost::Name for VerificationRemoveBody {
    const NAME: &'static str = "VerificationRemoveBody";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
/// * Adds or removes a Link
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct LinkBody {
    /// Type of link, <= 8 characters
    #[prost(string, tag = "1")]
    pub r#type: ::prost::alloc::string::String,
    /// User-defined timestamp that preserves original timestamp when message.data.timestamp needs to be updated for compaction
    #[prost(uint32, optional, tag = "2")]
    pub display_timestamp: ::core::option::Option<u32>,
    #[prost(oneof = "link_body::Target", tags = "3")]
    pub target: ::core::option::Option<link_body::Target>,
}
/// Nested message and enum types in `LinkBody`.
pub mod link_body {
    #[allow(clippy::derive_partial_eq_without_eq)]
    #[derive(Clone, PartialEq, ::prost::Oneof)]
    pub enum Target {
        /// The fid the link relates to
        #[prost(uint64, tag = "3")]
        TargetFid(u64),
    }
}
impl ::prost::Name for LinkBody {
    const NAME: &'static str = "LinkBody";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
/// * A Farcaster Frame action
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct FrameActionBody {
    /// URL of the Frame triggering the action
    #[prost(bytes = "vec", tag = "1")]
    pub url: ::prost::alloc::vec::Vec<u8>,
    /// The index of the button pressed (1-4)
    #[prost(uint32, tag = "2")]
    pub button_index: u32,
    /// The cast which contained the frame url
    #[prost(message, optional, tag = "3")]
    pub cast_id: ::core::option::Option<CastId>,
    /// Text input from the user, if present
    #[prost(bytes = "vec", tag = "4")]
    pub input_text: ::prost::alloc::vec::Vec<u8>,
    /// Serialized frame state value
    #[prost(bytes = "vec", tag = "5")]
    pub state: ::prost::alloc::vec::Vec<u8>,
    /// Chain-specific transaction ID for tx actions
    #[prost(bytes = "vec", tag = "6")]
    pub transaction_id: ::prost::alloc::vec::Vec<u8>,
}
impl ::prost::Name for FrameActionBody {
    const NAME: &'static str = "FrameActionBody";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
/// * Type of hashing scheme used to produce a digest of MessageData
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum HashScheme {
    None = 0,
    /// Default scheme for hashing MessageData
    Blake3 = 1,
}
impl HashScheme {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            HashScheme::None => "HASH_SCHEME_NONE",
            HashScheme::Blake3 => "HASH_SCHEME_BLAKE3",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "HASH_SCHEME_NONE" => Some(Self::None),
            "HASH_SCHEME_BLAKE3" => Some(Self::Blake3),
            _ => None,
        }
    }
}
/// * Type of signature scheme used to sign the Message hash
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum SignatureScheme {
    None = 0,
    /// Ed25519 signature (default)
    Ed25519 = 1,
    /// ECDSA signature using EIP-712 scheme
    Eip712 = 2,
}
impl SignatureScheme {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            SignatureScheme::None => "SIGNATURE_SCHEME_NONE",
            SignatureScheme::Ed25519 => "SIGNATURE_SCHEME_ED25519",
            SignatureScheme::Eip712 => "SIGNATURE_SCHEME_EIP712",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "SIGNATURE_SCHEME_NONE" => Some(Self::None),
            "SIGNATURE_SCHEME_ED25519" => Some(Self::Ed25519),
            "SIGNATURE_SCHEME_EIP712" => Some(Self::Eip712),
            _ => None,
        }
    }
}
/// * Type of the MessageBody
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum MessageType {
    None = 0,
    /// Add a new Cast
    CastAdd = 1,
    /// Remove an existing Cast
    CastRemove = 2,
    /// Add a Reaction to a Cast
    ReactionAdd = 3,
    /// Remove a Reaction from a Cast
    ReactionRemove = 4,
    /// Add a new Link
    LinkAdd = 5,
    /// Remove an existing Link
    LinkRemove = 6,
    /// Add a Verification of an Ethereum Address
    VerificationAddEthAddress = 7,
    /// Remove a Verification
    VerificationRemove = 8,
    ///   Deprecated
    ///   MESSAGE_TYPE_SIGNER_ADD = 9; // Add a new Ed25519 key pair that signs messages for a user
    ///   MESSAGE_TYPE_SIGNER_REMOVE = 10; // Remove an Ed25519 key pair that signs messages for a user
    ///
    /// Add metadata about a user
    UserDataAdd = 11,
    /// Add or replace a username proof
    UsernameProof = 12,
    /// A Farcaster Frame action
    FrameAction = 13,
}
impl MessageType {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            MessageType::None => "MESSAGE_TYPE_NONE",
            MessageType::CastAdd => "MESSAGE_TYPE_CAST_ADD",
            MessageType::CastRemove => "MESSAGE_TYPE_CAST_REMOVE",
            MessageType::ReactionAdd => "MESSAGE_TYPE_REACTION_ADD",
            MessageType::ReactionRemove => "MESSAGE_TYPE_REACTION_REMOVE",
            MessageType::LinkAdd => "MESSAGE_TYPE_LINK_ADD",
            MessageType::LinkRemove => "MESSAGE_TYPE_LINK_REMOVE",
            MessageType::VerificationAddEthAddress => {
                "MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS"
            }
            MessageType::VerificationRemove => "MESSAGE_TYPE_VERIFICATION_REMOVE",
            MessageType::UserDataAdd => "MESSAGE_TYPE_USER_DATA_ADD",
            MessageType::UsernameProof => "MESSAGE_TYPE_USERNAME_PROOF",
            MessageType::FrameAction => "MESSAGE_TYPE_FRAME_ACTION",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "MESSAGE_TYPE_NONE" => Some(Self::None),
            "MESSAGE_TYPE_CAST_ADD" => Some(Self::CastAdd),
            "MESSAGE_TYPE_CAST_REMOVE" => Some(Self::CastRemove),
            "MESSAGE_TYPE_REACTION_ADD" => Some(Self::ReactionAdd),
            "MESSAGE_TYPE_REACTION_REMOVE" => Some(Self::ReactionRemove),
            "MESSAGE_TYPE_LINK_ADD" => Some(Self::LinkAdd),
            "MESSAGE_TYPE_LINK_REMOVE" => Some(Self::LinkRemove),
            "MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS" => {
                Some(Self::VerificationAddEthAddress)
            }
            "MESSAGE_TYPE_VERIFICATION_REMOVE" => Some(Self::VerificationRemove),
            "MESSAGE_TYPE_USER_DATA_ADD" => Some(Self::UserDataAdd),
            "MESSAGE_TYPE_USERNAME_PROOF" => Some(Self::UsernameProof),
            "MESSAGE_TYPE_FRAME_ACTION" => Some(Self::FrameAction),
            _ => None,
        }
    }
}
/// * Farcaster network the message is intended for
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum FarcasterNetwork {
    None = 0,
    /// Public primary network
    Mainnet = 1,
    /// Public test network
    Testnet = 2,
    /// Private test network
    Devnet = 3,
}
impl FarcasterNetwork {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            FarcasterNetwork::None => "FARCASTER_NETWORK_NONE",
            FarcasterNetwork::Mainnet => "FARCASTER_NETWORK_MAINNET",
            FarcasterNetwork::Testnet => "FARCASTER_NETWORK_TESTNET",
            FarcasterNetwork::Devnet => "FARCASTER_NETWORK_DEVNET",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "FARCASTER_NETWORK_NONE" => Some(Self::None),
            "FARCASTER_NETWORK_MAINNET" => Some(Self::Mainnet),
            "FARCASTER_NETWORK_TESTNET" => Some(Self::Testnet),
            "FARCASTER_NETWORK_DEVNET" => Some(Self::Devnet),
            _ => None,
        }
    }
}
/// * Type of UserData
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum UserDataType {
    None = 0,
    /// Profile Picture for the user
    Pfp = 1,
    /// Display Name for the user
    Display = 2,
    /// Bio for the user
    Bio = 3,
    /// URL of the user
    Url = 5,
    /// Preferred Name for the user
    Username = 6,
}
impl UserDataType {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            UserDataType::None => "USER_DATA_TYPE_NONE",
            UserDataType::Pfp => "USER_DATA_TYPE_PFP",
            UserDataType::Display => "USER_DATA_TYPE_DISPLAY",
            UserDataType::Bio => "USER_DATA_TYPE_BIO",
            UserDataType::Url => "USER_DATA_TYPE_URL",
            UserDataType::Username => "USER_DATA_TYPE_USERNAME",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "USER_DATA_TYPE_NONE" => Some(Self::None),
            "USER_DATA_TYPE_PFP" => Some(Self::Pfp),
            "USER_DATA_TYPE_DISPLAY" => Some(Self::Display),
            "USER_DATA_TYPE_BIO" => Some(Self::Bio),
            "USER_DATA_TYPE_URL" => Some(Self::Url),
            "USER_DATA_TYPE_USERNAME" => Some(Self::Username),
            _ => None,
        }
    }
}
/// * Type of Reaction
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum ReactionType {
    None = 0,
    /// Like the target cast
    Like = 1,
    /// Share target cast to the user's audience
    Recast = 2,
}
impl ReactionType {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            ReactionType::None => "REACTION_TYPE_NONE",
            ReactionType::Like => "REACTION_TYPE_LIKE",
            ReactionType::Recast => "REACTION_TYPE_RECAST",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "REACTION_TYPE_NONE" => Some(Self::None),
            "REACTION_TYPE_LIKE" => Some(Self::Like),
            "REACTION_TYPE_RECAST" => Some(Self::Recast),
            _ => None,
        }
    }
}
/// * Type of Protocol to disambiguate verification addresses
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum Protocol {
    Ethereum = 0,
    Solana = 1,
}
impl Protocol {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            Protocol::Ethereum => "PROTOCOL_ETHEREUM",
            Protocol::Solana => "PROTOCOL_SOLANA",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "PROTOCOL_ETHEREUM" => Some(Self::Ethereum),
            "PROTOCOL_SOLANA" => Some(Self::Solana),
            _ => None,
        }
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GossipAddressInfo {
    #[prost(string, tag = "1")]
    pub address: ::prost::alloc::string::String,
    #[prost(uint32, tag = "2")]
    pub family: u32,
    #[prost(uint32, tag = "3")]
    pub port: u32,
    #[prost(string, tag = "4")]
    pub dns_name: ::prost::alloc::string::String,
}
impl ::prost::Name for GossipAddressInfo {
    const NAME: &'static str = "GossipAddressInfo";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct ContactInfoContentBody {
    #[prost(message, optional, tag = "1")]
    pub gossip_address: ::core::option::Option<GossipAddressInfo>,
    #[prost(message, optional, tag = "2")]
    pub rpc_address: ::core::option::Option<GossipAddressInfo>,
    #[prost(string, repeated, tag = "3")]
    pub excluded_hashes: ::prost::alloc::vec::Vec<::prost::alloc::string::String>,
    #[prost(uint32, tag = "4")]
    pub count: u32,
    #[prost(string, tag = "5")]
    pub hub_version: ::prost::alloc::string::String,
    #[prost(enumeration = "FarcasterNetwork", tag = "6")]
    pub network: i32,
    #[prost(string, tag = "7")]
    pub app_version: ::prost::alloc::string::String,
    #[prost(uint64, tag = "8")]
    pub timestamp: u64,
}
impl ::prost::Name for ContactInfoContentBody {
    const NAME: &'static str = "ContactInfoContentBody";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct ContactInfoContent {
    #[prost(message, optional, tag = "1")]
    pub gossip_address: ::core::option::Option<GossipAddressInfo>,
    #[prost(message, optional, tag = "2")]
    pub rpc_address: ::core::option::Option<GossipAddressInfo>,
    #[prost(string, repeated, tag = "3")]
    pub excluded_hashes: ::prost::alloc::vec::Vec<::prost::alloc::string::String>,
    #[prost(uint32, tag = "4")]
    pub count: u32,
    #[prost(string, tag = "5")]
    pub hub_version: ::prost::alloc::string::String,
    #[prost(enumeration = "FarcasterNetwork", tag = "6")]
    pub network: i32,
    #[prost(string, tag = "7")]
    pub app_version: ::prost::alloc::string::String,
    #[prost(uint64, tag = "8")]
    pub timestamp: u64,
    #[prost(message, optional, tag = "9")]
    pub body: ::core::option::Option<ContactInfoContentBody>,
    /// Signature of the message digest
    #[prost(bytes = "vec", tag = "10")]
    pub signature: ::prost::alloc::vec::Vec<u8>,
    /// Public key of the peer that originated the contact info
    #[prost(bytes = "vec", tag = "11")]
    pub signer: ::prost::alloc::vec::Vec<u8>,
    /// Optional alternative serialization used for signing
    #[prost(bytes = "vec", optional, tag = "12")]
    pub data_bytes: ::core::option::Option<::prost::alloc::vec::Vec<u8>>,
}
impl ::prost::Name for ContactInfoContent {
    const NAME: &'static str = "ContactInfoContent";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct PingMessageBody {
    #[prost(bytes = "vec", tag = "1")]
    pub ping_origin_peer_id: ::prost::alloc::vec::Vec<u8>,
    #[prost(uint64, tag = "2")]
    pub ping_timestamp: u64,
}
impl ::prost::Name for PingMessageBody {
    const NAME: &'static str = "PingMessageBody";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct AckMessageBody {
    #[prost(bytes = "vec", tag = "1")]
    pub ping_origin_peer_id: ::prost::alloc::vec::Vec<u8>,
    #[prost(bytes = "vec", tag = "2")]
    pub ack_origin_peer_id: ::prost::alloc::vec::Vec<u8>,
    #[prost(uint64, tag = "3")]
    pub ping_timestamp: u64,
    #[prost(uint64, tag = "4")]
    pub ack_timestamp: u64,
}
impl ::prost::Name for AckMessageBody {
    const NAME: &'static str = "AckMessageBody";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct NetworkLatencyMessage {
    #[prost(oneof = "network_latency_message::Body", tags = "2, 3")]
    pub body: ::core::option::Option<network_latency_message::Body>,
}
/// Nested message and enum types in `NetworkLatencyMessage`.
pub mod network_latency_message {
    #[allow(clippy::derive_partial_eq_without_eq)]
    #[derive(Clone, PartialEq, ::prost::Oneof)]
    pub enum Body {
        #[prost(message, tag = "2")]
        PingMessage(super::PingMessageBody),
        #[prost(message, tag = "3")]
        AckMessage(super::AckMessageBody),
    }
}
impl ::prost::Name for NetworkLatencyMessage {
    const NAME: &'static str = "NetworkLatencyMessage";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GossipMessage {
    #[prost(string, repeated, tag = "4")]
    pub topics: ::prost::alloc::vec::Vec<::prost::alloc::string::String>,
    #[prost(bytes = "vec", tag = "5")]
    pub peer_id: ::prost::alloc::vec::Vec<u8>,
    #[prost(enumeration = "GossipVersion", tag = "6")]
    pub version: i32,
    /// Farcaster epoch timestamp in seconds when this message was first created
    #[prost(uint32, tag = "8")]
    pub timestamp: u32,
    #[prost(oneof = "gossip_message::Content", tags = "1, 3, 7")]
    pub content: ::core::option::Option<gossip_message::Content>,
}
/// Nested message and enum types in `GossipMessage`.
pub mod gossip_message {
    #[allow(clippy::derive_partial_eq_without_eq)]
    #[derive(Clone, PartialEq, ::prost::Oneof)]
    pub enum Content {
        #[prost(message, tag = "1")]
        Message(super::Message),
        ///   Deprecated
        ///   IdRegistryEvent id_registry_event = 2;
        #[prost(message, tag = "3")]
        ContactInfoContent(super::ContactInfoContent),
        #[prost(message, tag = "7")]
        NetworkLatencyMessage(super::NetworkLatencyMessage),
    }
}
impl ::prost::Name for GossipMessage {
    const NAME: &'static str = "GossipMessage";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum GossipVersion {
    V1 = 0,
    V11 = 1,
}
impl GossipVersion {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            GossipVersion::V1 => "GOSSIP_VERSION_V1",
            GossipVersion::V11 => "GOSSIP_VERSION_V1_1",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "GOSSIP_VERSION_V1" => Some(Self::V1),
            "GOSSIP_VERSION_V1_1" => Some(Self::V11),
            _ => None,
        }
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct OnChainEvent {
    #[prost(enumeration = "OnChainEventType", tag = "1")]
    pub r#type: i32,
    #[prost(uint32, tag = "2")]
    pub chain_id: u32,
    #[prost(uint32, tag = "3")]
    pub block_number: u32,
    #[prost(bytes = "vec", tag = "4")]
    pub block_hash: ::prost::alloc::vec::Vec<u8>,
    #[prost(uint64, tag = "5")]
    pub block_timestamp: u64,
    #[prost(bytes = "vec", tag = "6")]
    pub transaction_hash: ::prost::alloc::vec::Vec<u8>,
    #[prost(uint32, tag = "7")]
    pub log_index: u32,
    #[prost(uint64, tag = "8")]
    pub fid: u64,
    #[prost(uint32, tag = "13")]
    pub tx_index: u32,
    #[prost(uint32, tag = "14")]
    pub version: u32,
    #[prost(oneof = "on_chain_event::Body", tags = "9, 10, 11, 12")]
    pub body: ::core::option::Option<on_chain_event::Body>,
}
/// Nested message and enum types in `OnChainEvent`.
pub mod on_chain_event {
    #[allow(clippy::derive_partial_eq_without_eq)]
    #[derive(Clone, PartialEq, ::prost::Oneof)]
    pub enum Body {
        #[prost(message, tag = "9")]
        SignerEventBody(super::SignerEventBody),
        #[prost(message, tag = "10")]
        SignerMigratedEventBody(super::SignerMigratedEventBody),
        #[prost(message, tag = "11")]
        IdRegisterEventBody(super::IdRegisterEventBody),
        #[prost(message, tag = "12")]
        StorageRentEventBody(super::StorageRentEventBody),
    }
}
impl ::prost::Name for OnChainEvent {
    const NAME: &'static str = "OnChainEvent";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct SignerEventBody {
    #[prost(bytes = "vec", tag = "1")]
    pub key: ::prost::alloc::vec::Vec<u8>,
    #[prost(uint32, tag = "2")]
    pub key_type: u32,
    #[prost(enumeration = "SignerEventType", tag = "3")]
    pub event_type: i32,
    #[prost(bytes = "vec", tag = "4")]
    pub metadata: ::prost::alloc::vec::Vec<u8>,
    #[prost(uint32, tag = "5")]
    pub metadata_type: u32,
}
impl ::prost::Name for SignerEventBody {
    const NAME: &'static str = "SignerEventBody";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct SignerMigratedEventBody {
    #[prost(uint32, tag = "1")]
    pub migrated_at: u32,
}
impl ::prost::Name for SignerMigratedEventBody {
    const NAME: &'static str = "SignerMigratedEventBody";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct IdRegisterEventBody {
    #[prost(bytes = "vec", tag = "1")]
    pub to: ::prost::alloc::vec::Vec<u8>,
    #[prost(enumeration = "IdRegisterEventType", tag = "2")]
    pub event_type: i32,
    #[prost(bytes = "vec", tag = "3")]
    pub from: ::prost::alloc::vec::Vec<u8>,
    #[prost(bytes = "vec", tag = "4")]
    pub recovery_address: ::prost::alloc::vec::Vec<u8>,
}
impl ::prost::Name for IdRegisterEventBody {
    const NAME: &'static str = "IdRegisterEventBody";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct StorageRentEventBody {
    #[prost(bytes = "vec", tag = "1")]
    pub payer: ::prost::alloc::vec::Vec<u8>,
    #[prost(uint32, tag = "2")]
    pub units: u32,
    #[prost(uint32, tag = "3")]
    pub expiry: u32,
}
impl ::prost::Name for StorageRentEventBody {
    const NAME: &'static str = "StorageRentEventBody";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum OnChainEventType {
    EventTypeNone = 0,
    EventTypeSigner = 1,
    EventTypeSignerMigrated = 2,
    EventTypeIdRegister = 3,
    EventTypeStorageRent = 4,
}
impl OnChainEventType {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            OnChainEventType::EventTypeNone => "EVENT_TYPE_NONE",
            OnChainEventType::EventTypeSigner => "EVENT_TYPE_SIGNER",
            OnChainEventType::EventTypeSignerMigrated => "EVENT_TYPE_SIGNER_MIGRATED",
            OnChainEventType::EventTypeIdRegister => "EVENT_TYPE_ID_REGISTER",
            OnChainEventType::EventTypeStorageRent => "EVENT_TYPE_STORAGE_RENT",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "EVENT_TYPE_NONE" => Some(Self::EventTypeNone),
            "EVENT_TYPE_SIGNER" => Some(Self::EventTypeSigner),
            "EVENT_TYPE_SIGNER_MIGRATED" => Some(Self::EventTypeSignerMigrated),
            "EVENT_TYPE_ID_REGISTER" => Some(Self::EventTypeIdRegister),
            "EVENT_TYPE_STORAGE_RENT" => Some(Self::EventTypeStorageRent),
            _ => None,
        }
    }
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum SignerEventType {
    None = 0,
    Add = 1,
    Remove = 2,
    AdminReset = 3,
}
impl SignerEventType {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            SignerEventType::None => "SIGNER_EVENT_TYPE_NONE",
            SignerEventType::Add => "SIGNER_EVENT_TYPE_ADD",
            SignerEventType::Remove => "SIGNER_EVENT_TYPE_REMOVE",
            SignerEventType::AdminReset => "SIGNER_EVENT_TYPE_ADMIN_RESET",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "SIGNER_EVENT_TYPE_NONE" => Some(Self::None),
            "SIGNER_EVENT_TYPE_ADD" => Some(Self::Add),
            "SIGNER_EVENT_TYPE_REMOVE" => Some(Self::Remove),
            "SIGNER_EVENT_TYPE_ADMIN_RESET" => Some(Self::AdminReset),
            _ => None,
        }
    }
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum IdRegisterEventType {
    None = 0,
    Register = 1,
    Transfer = 2,
    ChangeRecovery = 3,
}
impl IdRegisterEventType {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            IdRegisterEventType::None => "ID_REGISTER_EVENT_TYPE_NONE",
            IdRegisterEventType::Register => "ID_REGISTER_EVENT_TYPE_REGISTER",
            IdRegisterEventType::Transfer => "ID_REGISTER_EVENT_TYPE_TRANSFER",
            IdRegisterEventType::ChangeRecovery => {
                "ID_REGISTER_EVENT_TYPE_CHANGE_RECOVERY"
            }
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "ID_REGISTER_EVENT_TYPE_NONE" => Some(Self::None),
            "ID_REGISTER_EVENT_TYPE_REGISTER" => Some(Self::Register),
            "ID_REGISTER_EVENT_TYPE_TRANSFER" => Some(Self::Transfer),
            "ID_REGISTER_EVENT_TYPE_CHANGE_RECOVERY" => Some(Self::ChangeRecovery),
            _ => None,
        }
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct MergeMessageBody {
    #[prost(message, optional, tag = "1")]
    pub message: ::core::option::Option<Message>,
    #[prost(message, repeated, tag = "2")]
    pub deleted_messages: ::prost::alloc::vec::Vec<Message>,
}
impl ::prost::Name for MergeMessageBody {
    const NAME: &'static str = "MergeMessageBody";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct PruneMessageBody {
    #[prost(message, optional, tag = "1")]
    pub message: ::core::option::Option<Message>,
}
impl ::prost::Name for PruneMessageBody {
    const NAME: &'static str = "PruneMessageBody";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct RevokeMessageBody {
    #[prost(message, optional, tag = "1")]
    pub message: ::core::option::Option<Message>,
}
impl ::prost::Name for RevokeMessageBody {
    const NAME: &'static str = "RevokeMessageBody";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct MergeOnChainEventBody {
    #[prost(message, optional, tag = "1")]
    pub on_chain_event: ::core::option::Option<OnChainEvent>,
}
impl ::prost::Name for MergeOnChainEventBody {
    const NAME: &'static str = "MergeOnChainEventBody";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct MergeUserNameProofBody {
    #[prost(message, optional, tag = "1")]
    pub username_proof: ::core::option::Option<UserNameProof>,
    #[prost(message, optional, tag = "2")]
    pub deleted_username_proof: ::core::option::Option<UserNameProof>,
    #[prost(message, optional, tag = "3")]
    pub username_proof_message: ::core::option::Option<Message>,
    #[prost(message, optional, tag = "4")]
    pub deleted_username_proof_message: ::core::option::Option<Message>,
}
impl ::prost::Name for MergeUserNameProofBody {
    const NAME: &'static str = "MergeUserNameProofBody";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct HubEvent {
    #[prost(enumeration = "HubEventType", tag = "1")]
    pub r#type: i32,
    #[prost(uint64, tag = "2")]
    pub id: u64,
    #[prost(oneof = "hub_event::Body", tags = "3, 4, 5, 8, 11")]
    pub body: ::core::option::Option<hub_event::Body>,
}
/// Nested message and enum types in `HubEvent`.
pub mod hub_event {
    #[allow(clippy::derive_partial_eq_without_eq)]
    #[derive(Clone, PartialEq, ::prost::Oneof)]
    pub enum Body {
        #[prost(message, tag = "3")]
        MergeMessageBody(super::MergeMessageBody),
        #[prost(message, tag = "4")]
        PruneMessageBody(super::PruneMessageBody),
        #[prost(message, tag = "5")]
        RevokeMessageBody(super::RevokeMessageBody),
        ///     Deprecated
        ///     MergeIdRegistryEventBody merge_id_registry_event_body = 6;
        ///     MergeNameRegistryEventBody merge_name_registry_event_body = 7;
        #[prost(message, tag = "8")]
        MergeUsernameProofBody(super::MergeUserNameProofBody),
        ///     Deprecated
        ///     MergeRentRegistryEventBody merge_rent_registry_event_body = 9;
        ///     MergeStorageAdminRegistryEventBody merge_storage_admin_registry_event_body = 10;
        #[prost(message, tag = "11")]
        MergeOnChainEventBody(super::MergeOnChainEventBody),
    }
}
impl ::prost::Name for HubEvent {
    const NAME: &'static str = "HubEvent";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum HubEventType {
    None = 0,
    MergeMessage = 1,
    PruneMessage = 2,
    RevokeMessage = 3,
    /// Deprecated
    ///   HUB_EVENT_TYPE_MERGE_ID_REGISTRY_EVENT = 4;
    ///   HUB_EVENT_TYPE_MERGE_NAME_REGISTRY_EVENT = 5;
    MergeUsernameProof = 6,
    /// Deprecated
    ///   HUB_EVENT_TYPE_MERGE_RENT_REGISTRY_EVENT = 7;
    ///   HUB_EVENT_TYPE_MERGE_STORAGE_ADMIN_REGISTRY_EVENT = 8;
    MergeOnChainEvent = 9,
}
impl HubEventType {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            HubEventType::None => "HUB_EVENT_TYPE_NONE",
            HubEventType::MergeMessage => "HUB_EVENT_TYPE_MERGE_MESSAGE",
            HubEventType::PruneMessage => "HUB_EVENT_TYPE_PRUNE_MESSAGE",
            HubEventType::RevokeMessage => "HUB_EVENT_TYPE_REVOKE_MESSAGE",
            HubEventType::MergeUsernameProof => "HUB_EVENT_TYPE_MERGE_USERNAME_PROOF",
            HubEventType::MergeOnChainEvent => "HUB_EVENT_TYPE_MERGE_ON_CHAIN_EVENT",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "HUB_EVENT_TYPE_NONE" => Some(Self::None),
            "HUB_EVENT_TYPE_MERGE_MESSAGE" => Some(Self::MergeMessage),
            "HUB_EVENT_TYPE_PRUNE_MESSAGE" => Some(Self::PruneMessage),
            "HUB_EVENT_TYPE_REVOKE_MESSAGE" => Some(Self::RevokeMessage),
            "HUB_EVENT_TYPE_MERGE_USERNAME_PROOF" => Some(Self::MergeUsernameProof),
            "HUB_EVENT_TYPE_MERGE_ON_CHAIN_EVENT" => Some(Self::MergeOnChainEvent),
            _ => None,
        }
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct ValidateOrRevokeJobState {
    /// The (Farcaster time epoch) timestamp where the last job started
    #[prost(uint32, tag = "1")]
    pub last_job_timestamp: u32,
    /// The last FID to complete successfully. If this is 0, then the last job finished successfully
    #[prost(uint32, tag = "2")]
    pub last_fid: u32,
}
impl ::prost::Name for ValidateOrRevokeJobState {
    const NAME: &'static str = "ValidateOrRevokeJobState";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct HubState {
    ///   uint32 last_eth_block = 1; // Deprecated
    #[prost(uint64, tag = "2")]
    pub last_fname_proof: u64,
    #[prost(uint64, tag = "3")]
    pub last_l2_block: u64,
    ///   bool syncEvents = 4; // Deprecated
    #[prost(message, optional, tag = "5")]
    pub validate_or_revoke_state: ::core::option::Option<ValidateOrRevokeJobState>,
}
impl ::prost::Name for HubState {
    const NAME: &'static str = "HubState";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct RevokeMessagesBySignerJobPayload {
    #[prost(uint32, tag = "1")]
    pub fid: u32,
    #[prost(bytes = "vec", tag = "2")]
    pub signer: ::prost::alloc::vec::Vec<u8>,
}
impl ::prost::Name for RevokeMessagesBySignerJobPayload {
    const NAME: &'static str = "RevokeMessagesBySignerJobPayload";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct UpdateNameRegistryEventExpiryJobPayload {
    #[prost(bytes = "vec", tag = "1")]
    pub fname: ::prost::alloc::vec::Vec<u8>,
}
impl ::prost::Name for UpdateNameRegistryEventExpiryJobPayload {
    const NAME: &'static str = "UpdateNameRegistryEventExpiryJobPayload";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct Empty {}
impl ::prost::Name for Empty {
    const NAME: &'static str = "Empty";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct SubscribeRequest {
    #[prost(enumeration = "HubEventType", repeated, tag = "1")]
    pub event_types: ::prost::alloc::vec::Vec<i32>,
    #[prost(uint64, optional, tag = "2")]
    pub from_id: ::core::option::Option<u64>,
}
impl ::prost::Name for SubscribeRequest {
    const NAME: &'static str = "SubscribeRequest";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct EventRequest {
    #[prost(uint64, tag = "1")]
    pub id: u64,
}
impl ::prost::Name for EventRequest {
    const NAME: &'static str = "EventRequest";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct HubInfoRequest {
    #[prost(bool, tag = "1")]
    pub db_stats: bool,
}
impl ::prost::Name for HubInfoRequest {
    const NAME: &'static str = "HubInfoRequest";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
/// Response Types for the Sync RPC Methods
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct HubInfoResponse {
    #[prost(string, tag = "1")]
    pub version: ::prost::alloc::string::String,
    #[prost(bool, tag = "2")]
    pub is_syncing: bool,
    #[prost(string, tag = "3")]
    pub nickname: ::prost::alloc::string::String,
    #[prost(string, tag = "4")]
    pub root_hash: ::prost::alloc::string::String,
    #[prost(message, optional, tag = "5")]
    pub db_stats: ::core::option::Option<DbStats>,
    #[prost(string, tag = "6")]
    pub peer_id: ::prost::alloc::string::String,
    #[prost(uint64, tag = "7")]
    pub hub_operator_fid: u64,
}
impl ::prost::Name for HubInfoResponse {
    const NAME: &'static str = "HubInfoResponse";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct DbStats {
    #[prost(uint64, tag = "1")]
    pub num_messages: u64,
    #[prost(uint64, tag = "2")]
    pub num_fid_events: u64,
    #[prost(uint64, tag = "3")]
    pub num_fname_events: u64,
}
impl ::prost::Name for DbStats {
    const NAME: &'static str = "DbStats";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct SyncStatusRequest {
    #[prost(string, optional, tag = "1")]
    pub peer_id: ::core::option::Option<::prost::alloc::string::String>,
}
impl ::prost::Name for SyncStatusRequest {
    const NAME: &'static str = "SyncStatusRequest";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct SyncStatusResponse {
    #[prost(bool, tag = "1")]
    pub is_syncing: bool,
    #[prost(message, repeated, tag = "2")]
    pub sync_status: ::prost::alloc::vec::Vec<SyncStatus>,
    #[prost(bool, tag = "3")]
    pub engine_started: bool,
}
impl ::prost::Name for SyncStatusResponse {
    const NAME: &'static str = "SyncStatusResponse";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct SyncStatus {
    #[prost(string, tag = "1")]
    pub peer_id: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub in_sync: ::prost::alloc::string::String,
    #[prost(bool, tag = "3")]
    pub should_sync: bool,
    #[prost(string, tag = "4")]
    pub divergence_prefix: ::prost::alloc::string::String,
    #[prost(int32, tag = "5")]
    pub divergence_seconds_ago: i32,
    #[prost(uint64, tag = "6")]
    pub their_messages: u64,
    #[prost(uint64, tag = "7")]
    pub our_messages: u64,
    #[prost(int64, tag = "8")]
    pub last_bad_sync: i64,
    #[prost(int64, tag = "9")]
    pub score: i64,
}
impl ::prost::Name for SyncStatus {
    const NAME: &'static str = "SyncStatus";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct TrieNodeMetadataResponse {
    #[prost(bytes = "vec", tag = "1")]
    pub prefix: ::prost::alloc::vec::Vec<u8>,
    #[prost(uint64, tag = "2")]
    pub num_messages: u64,
    #[prost(string, tag = "3")]
    pub hash: ::prost::alloc::string::String,
    #[prost(message, repeated, tag = "4")]
    pub children: ::prost::alloc::vec::Vec<TrieNodeMetadataResponse>,
}
impl ::prost::Name for TrieNodeMetadataResponse {
    const NAME: &'static str = "TrieNodeMetadataResponse";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct TrieNodeSnapshotResponse {
    #[prost(bytes = "vec", tag = "1")]
    pub prefix: ::prost::alloc::vec::Vec<u8>,
    #[prost(string, repeated, tag = "2")]
    pub excluded_hashes: ::prost::alloc::vec::Vec<::prost::alloc::string::String>,
    #[prost(uint64, tag = "3")]
    pub num_messages: u64,
    #[prost(string, tag = "4")]
    pub root_hash: ::prost::alloc::string::String,
}
impl ::prost::Name for TrieNodeSnapshotResponse {
    const NAME: &'static str = "TrieNodeSnapshotResponse";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct TrieNodePrefix {
    #[prost(bytes = "vec", tag = "1")]
    pub prefix: ::prost::alloc::vec::Vec<u8>,
}
impl ::prost::Name for TrieNodePrefix {
    const NAME: &'static str = "TrieNodePrefix";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct SyncIds {
    #[prost(bytes = "vec", repeated, tag = "1")]
    pub sync_ids: ::prost::alloc::vec::Vec<::prost::alloc::vec::Vec<u8>>,
}
impl ::prost::Name for SyncIds {
    const NAME: &'static str = "SyncIds";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct FidRequest {
    #[prost(uint64, tag = "1")]
    pub fid: u64,
    #[prost(uint32, optional, tag = "2")]
    pub page_size: ::core::option::Option<u32>,
    #[prost(bytes = "vec", optional, tag = "3")]
    pub page_token: ::core::option::Option<::prost::alloc::vec::Vec<u8>>,
    #[prost(bool, optional, tag = "4")]
    pub reverse: ::core::option::Option<bool>,
}
impl ::prost::Name for FidRequest {
    const NAME: &'static str = "FidRequest";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct FidsRequest {
    #[prost(uint32, optional, tag = "1")]
    pub page_size: ::core::option::Option<u32>,
    #[prost(bytes = "vec", optional, tag = "2")]
    pub page_token: ::core::option::Option<::prost::alloc::vec::Vec<u8>>,
    #[prost(bool, optional, tag = "3")]
    pub reverse: ::core::option::Option<bool>,
}
impl ::prost::Name for FidsRequest {
    const NAME: &'static str = "FidsRequest";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct FidsResponse {
    #[prost(uint64, repeated, tag = "1")]
    pub fids: ::prost::alloc::vec::Vec<u64>,
    #[prost(bytes = "vec", optional, tag = "2")]
    pub next_page_token: ::core::option::Option<::prost::alloc::vec::Vec<u8>>,
}
impl ::prost::Name for FidsResponse {
    const NAME: &'static str = "FidsResponse";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct MessagesResponse {
    #[prost(message, repeated, tag = "1")]
    pub messages: ::prost::alloc::vec::Vec<Message>,
    #[prost(bytes = "vec", optional, tag = "2")]
    pub next_page_token: ::core::option::Option<::prost::alloc::vec::Vec<u8>>,
}
impl ::prost::Name for MessagesResponse {
    const NAME: &'static str = "MessagesResponse";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CastsByParentRequest {
    #[prost(uint32, optional, tag = "2")]
    pub page_size: ::core::option::Option<u32>,
    #[prost(bytes = "vec", optional, tag = "3")]
    pub page_token: ::core::option::Option<::prost::alloc::vec::Vec<u8>>,
    #[prost(bool, optional, tag = "4")]
    pub reverse: ::core::option::Option<bool>,
    #[prost(oneof = "casts_by_parent_request::Parent", tags = "1, 5")]
    pub parent: ::core::option::Option<casts_by_parent_request::Parent>,
}
/// Nested message and enum types in `CastsByParentRequest`.
pub mod casts_by_parent_request {
    #[allow(clippy::derive_partial_eq_without_eq)]
    #[derive(Clone, PartialEq, ::prost::Oneof)]
    pub enum Parent {
        #[prost(message, tag = "1")]
        ParentCastId(super::CastId),
        #[prost(string, tag = "5")]
        ParentUrl(::prost::alloc::string::String),
    }
}
impl ::prost::Name for CastsByParentRequest {
    const NAME: &'static str = "CastsByParentRequest";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct ReactionRequest {
    #[prost(uint64, tag = "1")]
    pub fid: u64,
    #[prost(enumeration = "ReactionType", tag = "2")]
    pub reaction_type: i32,
    #[prost(oneof = "reaction_request::Target", tags = "3, 4")]
    pub target: ::core::option::Option<reaction_request::Target>,
}
/// Nested message and enum types in `ReactionRequest`.
pub mod reaction_request {
    #[allow(clippy::derive_partial_eq_without_eq)]
    #[derive(Clone, PartialEq, ::prost::Oneof)]
    pub enum Target {
        #[prost(message, tag = "3")]
        TargetCastId(super::CastId),
        #[prost(string, tag = "4")]
        TargetUrl(::prost::alloc::string::String),
    }
}
impl ::prost::Name for ReactionRequest {
    const NAME: &'static str = "ReactionRequest";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct ReactionsByFidRequest {
    #[prost(uint64, tag = "1")]
    pub fid: u64,
    #[prost(enumeration = "ReactionType", optional, tag = "2")]
    pub reaction_type: ::core::option::Option<i32>,
    #[prost(uint32, optional, tag = "3")]
    pub page_size: ::core::option::Option<u32>,
    #[prost(bytes = "vec", optional, tag = "4")]
    pub page_token: ::core::option::Option<::prost::alloc::vec::Vec<u8>>,
    #[prost(bool, optional, tag = "5")]
    pub reverse: ::core::option::Option<bool>,
}
impl ::prost::Name for ReactionsByFidRequest {
    const NAME: &'static str = "ReactionsByFidRequest";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct ReactionsByTargetRequest {
    #[prost(enumeration = "ReactionType", optional, tag = "2")]
    pub reaction_type: ::core::option::Option<i32>,
    #[prost(uint32, optional, tag = "3")]
    pub page_size: ::core::option::Option<u32>,
    #[prost(bytes = "vec", optional, tag = "4")]
    pub page_token: ::core::option::Option<::prost::alloc::vec::Vec<u8>>,
    #[prost(bool, optional, tag = "5")]
    pub reverse: ::core::option::Option<bool>,
    #[prost(oneof = "reactions_by_target_request::Target", tags = "1, 6")]
    pub target: ::core::option::Option<reactions_by_target_request::Target>,
}
/// Nested message and enum types in `ReactionsByTargetRequest`.
pub mod reactions_by_target_request {
    #[allow(clippy::derive_partial_eq_without_eq)]
    #[derive(Clone, PartialEq, ::prost::Oneof)]
    pub enum Target {
        #[prost(message, tag = "1")]
        TargetCastId(super::CastId),
        #[prost(string, tag = "6")]
        TargetUrl(::prost::alloc::string::String),
    }
}
impl ::prost::Name for ReactionsByTargetRequest {
    const NAME: &'static str = "ReactionsByTargetRequest";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct UserDataRequest {
    #[prost(uint64, tag = "1")]
    pub fid: u64,
    #[prost(enumeration = "UserDataType", tag = "2")]
    pub user_data_type: i32,
}
impl ::prost::Name for UserDataRequest {
    const NAME: &'static str = "UserDataRequest";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct NameRegistryEventRequest {
    #[prost(bytes = "vec", tag = "1")]
    pub name: ::prost::alloc::vec::Vec<u8>,
}
impl ::prost::Name for NameRegistryEventRequest {
    const NAME: &'static str = "NameRegistryEventRequest";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct RentRegistryEventsRequest {
    #[prost(uint64, tag = "1")]
    pub fid: u64,
}
impl ::prost::Name for RentRegistryEventsRequest {
    const NAME: &'static str = "RentRegistryEventsRequest";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct OnChainEventRequest {
    #[prost(uint64, tag = "1")]
    pub fid: u64,
    #[prost(enumeration = "OnChainEventType", tag = "2")]
    pub event_type: i32,
    #[prost(uint32, optional, tag = "3")]
    pub page_size: ::core::option::Option<u32>,
    #[prost(bytes = "vec", optional, tag = "4")]
    pub page_token: ::core::option::Option<::prost::alloc::vec::Vec<u8>>,
    #[prost(bool, optional, tag = "5")]
    pub reverse: ::core::option::Option<bool>,
}
impl ::prost::Name for OnChainEventRequest {
    const NAME: &'static str = "OnChainEventRequest";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct OnChainEventResponse {
    #[prost(message, repeated, tag = "1")]
    pub events: ::prost::alloc::vec::Vec<OnChainEvent>,
    #[prost(bytes = "vec", optional, tag = "2")]
    pub next_page_token: ::core::option::Option<::prost::alloc::vec::Vec<u8>>,
}
impl ::prost::Name for OnChainEventResponse {
    const NAME: &'static str = "OnChainEventResponse";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct StorageLimitsResponse {
    #[prost(message, repeated, tag = "1")]
    pub limits: ::prost::alloc::vec::Vec<StorageLimit>,
    #[prost(uint32, tag = "2")]
    pub units: u32,
}
impl ::prost::Name for StorageLimitsResponse {
    const NAME: &'static str = "StorageLimitsResponse";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct StorageLimit {
    #[prost(enumeration = "StoreType", tag = "1")]
    pub store_type: i32,
    #[prost(string, tag = "2")]
    pub name: ::prost::alloc::string::String,
    #[prost(uint64, tag = "3")]
    pub limit: u64,
    #[prost(uint64, tag = "4")]
    pub used: u64,
    #[prost(uint64, tag = "5")]
    pub earliest_timestamp: u64,
    #[prost(bytes = "vec", tag = "6")]
    pub earliest_hash: ::prost::alloc::vec::Vec<u8>,
}
impl ::prost::Name for StorageLimit {
    const NAME: &'static str = "StorageLimit";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct UsernameProofRequest {
    #[prost(bytes = "vec", tag = "1")]
    pub name: ::prost::alloc::vec::Vec<u8>,
}
impl ::prost::Name for UsernameProofRequest {
    const NAME: &'static str = "UsernameProofRequest";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct UsernameProofsResponse {
    #[prost(message, repeated, tag = "1")]
    pub proofs: ::prost::alloc::vec::Vec<UserNameProof>,
}
impl ::prost::Name for UsernameProofsResponse {
    const NAME: &'static str = "UsernameProofsResponse";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct VerificationRequest {
    #[prost(uint64, tag = "1")]
    pub fid: u64,
    #[prost(bytes = "vec", tag = "2")]
    pub address: ::prost::alloc::vec::Vec<u8>,
}
impl ::prost::Name for VerificationRequest {
    const NAME: &'static str = "VerificationRequest";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct SignerRequest {
    #[prost(uint64, tag = "1")]
    pub fid: u64,
    #[prost(bytes = "vec", tag = "2")]
    pub signer: ::prost::alloc::vec::Vec<u8>,
}
impl ::prost::Name for SignerRequest {
    const NAME: &'static str = "SignerRequest";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct LinkRequest {
    #[prost(uint64, tag = "1")]
    pub fid: u64,
    #[prost(string, tag = "2")]
    pub link_type: ::prost::alloc::string::String,
    #[prost(oneof = "link_request::Target", tags = "3")]
    pub target: ::core::option::Option<link_request::Target>,
}
/// Nested message and enum types in `LinkRequest`.
pub mod link_request {
    #[allow(clippy::derive_partial_eq_without_eq)]
    #[derive(Clone, PartialEq, ::prost::Oneof)]
    pub enum Target {
        #[prost(uint64, tag = "3")]
        TargetFid(u64),
    }
}
impl ::prost::Name for LinkRequest {
    const NAME: &'static str = "LinkRequest";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct LinksByFidRequest {
    #[prost(uint64, tag = "1")]
    pub fid: u64,
    #[prost(string, optional, tag = "2")]
    pub link_type: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(uint32, optional, tag = "3")]
    pub page_size: ::core::option::Option<u32>,
    #[prost(bytes = "vec", optional, tag = "4")]
    pub page_token: ::core::option::Option<::prost::alloc::vec::Vec<u8>>,
    #[prost(bool, optional, tag = "5")]
    pub reverse: ::core::option::Option<bool>,
}
impl ::prost::Name for LinksByFidRequest {
    const NAME: &'static str = "LinksByFidRequest";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct LinksByTargetRequest {
    #[prost(string, optional, tag = "2")]
    pub link_type: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(uint32, optional, tag = "3")]
    pub page_size: ::core::option::Option<u32>,
    #[prost(bytes = "vec", optional, tag = "4")]
    pub page_token: ::core::option::Option<::prost::alloc::vec::Vec<u8>>,
    #[prost(bool, optional, tag = "5")]
    pub reverse: ::core::option::Option<bool>,
    #[prost(oneof = "links_by_target_request::Target", tags = "1")]
    pub target: ::core::option::Option<links_by_target_request::Target>,
}
/// Nested message and enum types in `LinksByTargetRequest`.
pub mod links_by_target_request {
    #[allow(clippy::derive_partial_eq_without_eq)]
    #[derive(Clone, PartialEq, ::prost::Oneof)]
    pub enum Target {
        #[prost(uint64, tag = "1")]
        TargetFid(u64),
    }
}
impl ::prost::Name for LinksByTargetRequest {
    const NAME: &'static str = "LinksByTargetRequest";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct IdRegistryEventByAddressRequest {
    #[prost(bytes = "vec", tag = "1")]
    pub address: ::prost::alloc::vec::Vec<u8>,
}
impl ::prost::Name for IdRegistryEventByAddressRequest {
    const NAME: &'static str = "IdRegistryEventByAddressRequest";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct ContactInfoResponse {
    #[prost(message, repeated, tag = "1")]
    pub contacts: ::prost::alloc::vec::Vec<ContactInfoContentBody>,
}
impl ::prost::Name for ContactInfoResponse {
    const NAME: &'static str = "ContactInfoResponse";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct ValidationResponse {
    #[prost(bool, tag = "1")]
    pub valid: bool,
    #[prost(message, optional, tag = "2")]
    pub message: ::core::option::Option<Message>,
}
impl ::prost::Name for ValidationResponse {
    const NAME: &'static str = "ValidationResponse";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum StoreType {
    None = 0,
    Casts = 1,
    Links = 2,
    Reactions = 3,
    UserData = 4,
    Verifications = 5,
    UsernameProofs = 6,
}
impl StoreType {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            StoreType::None => "STORE_TYPE_NONE",
            StoreType::Casts => "STORE_TYPE_CASTS",
            StoreType::Links => "STORE_TYPE_LINKS",
            StoreType::Reactions => "STORE_TYPE_REACTIONS",
            StoreType::UserData => "STORE_TYPE_USER_DATA",
            StoreType::Verifications => "STORE_TYPE_VERIFICATIONS",
            StoreType::UsernameProofs => "STORE_TYPE_USERNAME_PROOFS",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "STORE_TYPE_NONE" => Some(Self::None),
            "STORE_TYPE_CASTS" => Some(Self::Casts),
            "STORE_TYPE_LINKS" => Some(Self::Links),
            "STORE_TYPE_REACTIONS" => Some(Self::Reactions),
            "STORE_TYPE_USER_DATA" => Some(Self::UserData),
            "STORE_TYPE_VERIFICATIONS" => Some(Self::Verifications),
            "STORE_TYPE_USERNAME_PROOFS" => Some(Self::UsernameProofs),
            _ => None,
        }
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct DbTrieNode {
    #[prost(bytes = "vec", tag = "1")]
    pub key: ::prost::alloc::vec::Vec<u8>,
    #[prost(uint32, repeated, tag = "2")]
    pub child_chars: ::prost::alloc::vec::Vec<u32>,
    #[prost(uint32, tag = "3")]
    pub items: u32,
    #[prost(bytes = "vec", tag = "4")]
    pub hash: ::prost::alloc::vec::Vec<u8>,
}
impl ::prost::Name for DbTrieNode {
    const NAME: &'static str = "DbTrieNode";
    const PACKAGE: &'static str = "";
    fn full_name() -> ::prost::alloc::string::String {
        ::prost::alloc::format!("{}", Self::NAME)
    }
}
