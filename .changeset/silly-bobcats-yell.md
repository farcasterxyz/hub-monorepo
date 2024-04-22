---
"@farcaster/hubble": patch
---

fix(hubble): Add startup check for hub to verify gRPC port is reachable from public internet. Reachable address is required for hub to perform diff sync via gRPC API and sync with the network. Hub operators may need to enable port-forwarding of traffic to hub's host and port if they are behind a NAT.
