import { GossipVersion } from '@farcaster/hub-nodejs';

// Network topic for Farcaster Messages
export const NETWORK_TOPIC_PRIMARY = 'f_network_topic_primary';

// Network topic for Gossip Node ContactInfo messages
export const NETWORK_TOPIC_CONTACT = 'f_network_topic_contact';

// The rate at which nodes republish ContactInfo
export const GOSSIP_CONTACT_INTERVAL = 10_000;

// List of all valid Gossip Topics
export const GOSSIP_TOPICS = [NETWORK_TOPIC_CONTACT, NETWORK_TOPIC_PRIMARY];

// Current gossip protocol version
export const GOSSIP_PROTOCOL_VERSION = GossipVersion.V1;
