use cadence::{
    Counted, CountedExt, Gauged, Histogrammed, NopMetricSink, Setted, StatsdClient, Timed,
};
use neon::{
    context::FunctionContext,
    result::JsResult,
    types::{JsNumber, JsString, JsUndefined},
};
use once_cell::sync::Lazy;
use std::{
    net::UdpSocket,
    sync::{Arc, RwLock},
};

pub struct StatsdClientWrapper(Arc<StatsdClient>);

impl Clone for StatsdClientWrapper {
    fn clone(&self) -> Self {
        Self(self.0.clone())
    }
}

/** An implementation of statsd client that ignores errors */
#[allow(dead_code)]
impl StatsdClientWrapper {
    fn new(client: StatsdClient) -> Self {
        Self(Arc::new(client))
    }

    pub fn incr(&self, metric: &str) {
        let _ = self.0.incr(metric);
    }

    pub fn decr(&self, metric: &str) {
        let _ = self.0.decr(metric);
    }

    pub fn count(&self, metric: &str, count: i64) {
        let _ = self.0.count(metric, count);
    }

    pub fn gauge(&self, metric: &str, value: u64) {
        let _ = self.0.gauge(metric, value);
    }

    pub fn time(&self, metric: &str, time: u64) {
        let _ = self.0.time(metric, time);
    }

    pub fn histogram(&self, metric: &str, value: u64) {
        let _ = self.0.histogram(metric, value);
    }

    pub fn set(&self, metric: &str, value: i64) {
        let _ = self.0.set(metric, value);
    }
}

fn create_metrics_client(host: &str, port: u16, prefix: &str) {
    // Use a real metric sink that sends metrics over UDP
    let sink =
        cadence::BufferedUdpMetricSink::from((host, port), UdpSocket::bind("0.0.0.0:0").unwrap())
            .unwrap();

    let client = StatsdClient::from_sink(prefix, sink);

    // Replace the global client with the new one
    *STATSD_CLIENT.write().unwrap() = StatsdClientWrapper::new(client);
}

pub fn js_create_statsd_client(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    let host = cx.argument::<JsString>(0)?.value(&mut cx);
    let port = cx.argument::<JsNumber>(1)?.value(&mut cx) as u16;

    let prefix = cx.argument::<JsString>(2)?.value(&mut cx);

    create_metrics_client(&host, port, &prefix);

    Ok(JsUndefined::new(&mut cx))
}

pub fn statsd() -> StatsdClientWrapper {
    STATSD_CLIENT.read().unwrap().clone()
}

static STATSD_CLIENT: Lazy<RwLock<StatsdClientWrapper>> = Lazy::new(|| {
    RwLock::new(StatsdClientWrapper::new(StatsdClient::from_sink(
        "hubble.",
        NopMetricSink,
    )))
});
