---
"@farcaster/core": minor
"@farcaster/hub-nodejs": minor
"@farcaster/hub-web": minor
"@farcaster/shuttle": major
---

Require Node.js 22.13 or newer. Node 20 reached end-of-life in April 2026; Node 22 is supported in maintenance and Node 24 and 26 are the primary targets.

`@farcaster/core` now depends on `@faker-js/faker` 10 (fixes GHSA-qxc2-j82w-r537). Faker 10 is ESM-only, so the CommonJS build of `@farcaster/core` relies on `require()` of ES modules, which Node supports from 22.12. Browser builds now target Safari 14.1 instead of Safari 12; earlier builds already emitted syntax that needed Safari 14.1.
