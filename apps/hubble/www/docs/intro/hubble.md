# Hubble

Hubble is an implementation of a [Farcaster Hub](https://github.com/farcasterxyz/protocol), written in [TypeScript](https://www.typescriptlang.org/) and [Rust](https://www.rust-lang.org/).

Hubble creates a private instance of the Farcaster network on your machine. It stores a copy of every message from every user and syncs with other hubs to stay up to date. Messages uploaded to Hubble will be broadcast to other Hubs. 

We recommend running your own instance of Hubble if you are building an application, need access to the latest data or want to help decentralize the network.


## Public Instances

The Farcaster team runs some instances of Hubble for use by the public. These instances are not guaranteed to be stable, and are read-only for now. 

```bash
url: nemes.farcaster.xyz
httpapi_port: 2281
gossipsub_port: 2282
grpc_port: 2283
```


## Hosted Instances

Hubble instances can also be hosted for you by other service providers. While we recommend running your own instance for sovereignty and security, it may be useful to use these services to prototype quickly.

- [Hubs x Neynar](https://hubs.neynar.com/)