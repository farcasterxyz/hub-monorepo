hubble: cd apps/hubble && rm -rf .rocks && yarn build && yarn start --eth-mainnet-rpc-url $ETH_RPC_URL --l2-rpc-url $L2_RPC_URL --hub-operator-fid 1 --disable-snapshot-sync --catchup-sync-with-snapshot false --network 1 --disable-console-status --admin-server-enabled > hub.log
snapchain1: cd ../snapchain-v0 && rm -rf nodes/1/.rocks && cargo run -- --config-path nodes/1/snapchain.toml > snapchain1.log
snapchain2: cd ../snapchain-v0 && rm -rf nodes/2/.rocks && cargo run -- --config-path nodes/2/snapchain.toml > snapchain2.log
snapchain3: cd ../snapchain-v0 && rm -rf nodes/3/.rocks && cargo run -- --config-path nodes/3/snapchain.toml > snapchain3.log
migrate: cd packages/shuttle && sleep 30 && yarn build && ONCHAIN_EVENTS_HUB_HOST=kassad.merkle.zone:2283 HUB_HOST=127.0.0.1:2283 HUB_ADMIN_HOST=127.0.0.1:2284 SNAPCHAIN_HOST=127.0.0.1:3383 yarn migrate:onchain-events > onchain_events.log&& sleep 30 && ONCHAIN_EVENTS_HUB_HOST=kassad.merkle.zone:2283 HUB_HOST=127.0.0.1:2283 HUB_ADMIN_HOST=127.0.0.1:2284 SNAPCHAIN_HOST=127.0.0.1:3383 yarn migrate:messages > messages.log && sleep 120 && ONCHAIN_EVENTS_HUB_HOST=kassad.merkle.zone:2283 HUB_HOST=127.0.0.1:2283 HUB_ADMIN_HOST=127.0.0.1:2284 SNAPCHAIN_HOST=127.0.0.1:3383 yarn migrate:validate > validate.log