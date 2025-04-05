# Monitoring Hubble

Hubble ships with a default Grafana configuration to monitor sync and perf.

If you used the install script, open localhost:3000 in a browser to see your dashboard. If you used docker manually or installed from source, you may need to set this up yourself. 

## Setting up monitoring

1. Start grafana and statsd
```bash
docker compose up statsd grafana
```

2. Enable monitoring on your Hub by setting this in your `.env`
```bash
STATSD_METRICS_SERVER=statsd:8125
```

If you are running hubble from source, you can pass this in as a command line argument
```bash
yarn start --statsd-metrics-server 127.0.0.1:8125
```
3. Restart your hub

4. Open Grafana in a browser at `127.0.0.1:3000`. The default username/password is `admin`/`admin`. You will need to change your password on the first login

5. Go to `Administration -> Data sources -> Add new data source` and select `Graphite`. Set the URL to `http://statsd:8125` and click `Save & Test` to make sure it is working

6. Go to `Dashboards -> New -> Import`, and in the `Import from Panel JSON`, paste the contents of the [Default Grafana Dashboard](https://github.com/farcasterxyz/hub-monorepo/blob/main/apps/hubble/grafana/grafana-dashboard.json)

## Troubleshooting

- Make sure that the `grafana/data` directory is writable to all users. 
