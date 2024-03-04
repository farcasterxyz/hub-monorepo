use std::{
    net::UdpSocket,
    sync::{Arc, RwLock},
};

use cadence::{CountedExt, NopMetricSink, StatsdClient};
use once_cell::sync::Lazy;

fn create_metrics_client(host: &str, prefix: &str) {
    // Use a real metric sink that sends metrics over UDP
    let sink =
        cadence::BufferedUdpMetricSink::from(host, UdpSocket::bind("0.0.0.0:0").unwrap()).unwrap();

    let client = StatsdClient::from_sink(prefix, sink);
    client.incr("hubble.started");

    // Replace the global client with the new one
    *STATSD_CLIENT.write().unwrap() = Arc::new(client);
}

pub fn statsd() -> Arc<StatsdClient> {
    STATSD_CLIENT.read().unwrap().clone()
}

static STATSD_CLIENT: Lazy<RwLock<Arc<StatsdClient>>> =
    Lazy::new(|| RwLock::new(Arc::new(StatsdClient::from_sink("hubble.", NopMetricSink))));
