import { GossipVersion } from '@farcaster/protobufs';

// Network topic for all FC protocol messages
export const NETWORK_TOPIC_PRIMARY = 'f_network_topic_primary';
// Network topic for node contact info messages
export const NETWORK_TOPIC_CONTACT = 'f_network_topic_contact';
// The rate at which nodes republish their contact info
export const GOSSIP_CONTACT_INTERVAL = 10_000;
// A list of all gossip topics in use by our protocol
export const GOSSIP_TOPICS = [NETWORK_TOPIC_CONTACT, NETWORK_TOPIC_PRIMARY];
// The current gossip protocol version
export const GOSSIP_PROTOCOL_VERSION = GossipVersion.GOSSIP_VERSION_1;
