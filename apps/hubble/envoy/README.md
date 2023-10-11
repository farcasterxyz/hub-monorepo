
**Deprecation Notice:**
grpc-web has been deprecated and is no longer supported. Please use the [HTTP API](https://www.thehubble.xyz/docs/httpapi/httpapi.html) instead. This original document has been kept only for historical reference.


## Using grpc-web
While grpc-web is not supported via Hubble, you can run your own envoy proxy to use grpc-web if you need to. 
In order for farcaster to support grpc-web, we need to set up envoy alongside the server.

## Requirements

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
