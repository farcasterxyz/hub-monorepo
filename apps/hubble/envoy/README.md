In order for farcaster to support grpc-web, we need to set up envoy alongside the server.

## Requirement

Install docker if the farcaster instance doesn't support docker yet

```
ssh ubuntu@<farcaster instance ipv4 address> -i key.pem
chmod +x install-docker.sh
./install-docker.sh
logout of the ssh session
re-login
```

## Infra setting

update inbound/outbound traffic to allow tcp through envoy port (default: 2284)

## Start envoy

update envoy.yaml for the correct rpc port (default: 2283) and envoy port (default: 2284)

```
chmod +x envoy-start.sh
./envoy-start.sh
```

you should be able to see an envoy process under docker ps

## Contributing

Please see our [contributing guidelines](https://github.com/farcasterxyz/hubble/blob/main/CONTRIBUTING.md) before making a pull request.

## License

MIT License
