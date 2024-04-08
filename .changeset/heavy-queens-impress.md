---
"@farcaster/hubble": patch
---

feat(hubble): 
  - Add opt-out diagnostics reporting sent to the Farcaster foundation. Users may opt out with CLI flag `--opt-out-diagnostics true` or environment variable `HUB_OPT_OUT_DIAGNOSTICS=true`. Diagnostics are used to troubleshoot user issues and improve health of the network.
  - Add CLI flag `--diagnostic-report-url <url>`, and environment variables `HUB_DIAGNOSTICS_API_KEY`, `HUB_DIAGNOSTICS_APP_KEY` environment variables to pass in configurable DataDog-compatible URL and authorization tokens.

fix(hubble): Add `L2_RPC_AUTHORIZATION_HEADER` environment variable for use with L2 RPC URLs that require authorization headers for access. 
