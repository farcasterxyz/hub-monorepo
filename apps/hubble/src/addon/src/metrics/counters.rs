use std::{
    collections::{hash_map, HashMap},
    hash::Hash,
    marker::PhantomData,
    sync::{
        atomic::{AtomicU64, Ordering},
        Arc, RwLock,
    },
    time::{Instant, SystemTime, UNIX_EPOCH},
};

use neon::{
    context::{Context, FunctionContext, ModuleContext},
    result::{JsResult, NeonResult},
    types::JsString,
};
use once_cell::sync::Lazy;

use crate::store::StoreDef;

#[derive(Default)]
pub struct Counters {
    prints: CounterMetric,
    store_counters: RwLock<HashMap<(String, StoreAction), CounterMetric>>,
}

#[derive(Eq, PartialEq, Hash, Debug, Clone, Copy)]
pub enum FidLockSource {
    Merge,
    Prune,
}

#[derive(Eq, PartialEq, Hash, Debug, Clone, Copy)]
pub enum StoreAction {
    FidLock(FidLockSource),
    Merge,
    ThreadPoolWait,
    MergeCompactState,
    MergeAdd,
    MergeRemove,
    DeleteMany(usize),
    DeleteMoveTransaction,
    PutRemoveTransaction,
    DeleteAddTransaction,
    DeleteCompactStateTransaction,
    PutAddTransaction,
    PutAddCompactStateTransaction,
    GetRemovesByFid,
    GetAddsByFid,
    GetRemoves,
    GetAdd,
    Revoke,
    GetAllMessagesByFid(Option<usize>),
}

impl Counters {
    pub fn store_action(&self, store_name: String, action: StoreAction, time_us: u64) {
        Self::hash_record(&self.store_counters, (store_name, action), time_us)
    }

    fn hash_record<T: Eq + Hash>(hash: &RwLock<HashMap<T, CounterMetric>>, key: T, time_us: u64) {
        {
            let hash_read = hash.read().unwrap();
            if let Some(entry) = hash_read.get(&key) {
                entry.record_duration(time_us);
                return;
            }
        }

        let mut hash_write = hash.write().unwrap();
        let entry = match hash_write.entry(key) {
            hash_map::Entry::Occupied(o) => o.into_mut(),
            hash_map::Entry::Vacant(v) => v.insert(CounterMetric::default()),
        };

        entry.record_duration(time_us);
    }

    pub fn print_to_writer<W: std::io::Write>(&self, mut out: W) -> Result<(), std::io::Error> {
        let start = Instant::now();

        self.prints.write_to_config("counter_print", &mut out)?;

        {
            let counters = self.store_counters.read().unwrap();
            for ((store, action), counter) in counters.iter() {
                let extra_opt = match action {
                    StoreAction::DeleteMany(0) => continue,
                    StoreAction::DeleteMany(count) => Some(format!(",count=\"{}\"", *count)),
                    StoreAction::GetAllMessagesByFid(Some(page_size)) => {
                        Some(format!(",page_size=\"{}\"", *page_size))
                    }
                    StoreAction::FidLock(source) => Some(format!(",source=\"{:?}\"", source)),
                    _ => None,
                }
                .unwrap_or_default();

                /* write count so summary view is easier */
                {
                    let action_str = match action {
                        StoreAction::DeleteMany(_) => "DeleteMany".to_string(),
                        StoreAction::GetAllMessagesByFid(_) => "GetAllMessagesByFid".to_string(),
                        StoreAction::FidLock(_) => "FidLock".to_string(),
                        action => format!("{action:?}"),
                    };

                    writeln!(out, "#HELP store_count")?;
                    writeln!(out, "#TYPE store_count counter")?;
                    writeln!(
                        out,
                        "store_count{{store=\"{}\",action=\"{}\"{}}} {}",
                        store,
                        action_str,
                        extra_opt,
                        counter.count.load(Ordering::Relaxed)
                    )?;

                    writeln!(out, "#HELP store_total_us")?;
                    writeln!(out, "#TYPE store_total_us counter")?;
                    writeln!(
                        out,
                        "store_total_us{{store=\"{}\",action=\"{}\"{}}} {}",
                        store,
                        action_str,
                        extra_opt,
                        counter.total_us.load(Ordering::Relaxed)
                    )?;

                    writeln!(out, "#HELP store_max_us")?;
                    writeln!(out, "#TYPE store_max_us gauge")?;
                    writeln!(
                        out,
                        "store_max_us{{store=\"{}\",action=\"{}\"{}}} {}",
                        store,
                        action_str,
                        extra_opt,
                        counter.max_us_value.load(Ordering::Relaxed)
                    )?;

                    writeln!(out, "#HELP store_min_us")?;
                    writeln!(out, "#TYPE store_min_us gauge")?;
                    writeln!(
                        out,
                        "store_min_us{{store=\"{}\",action=\"{}\"{}}} {}",
                        store,
                        action_str,
                        extra_opt,
                        counter.min_us_value.load(Ordering::Relaxed)
                    )?;
                }
            }
        }

        self.prints
            .record_duration(start.elapsed().as_micros() as u64);

        Ok(())
    }
}

pub struct StoreLifetimeCounter {
    store_name: Option<String>,
    start: Instant,
    action: StoreAction,
}

impl StoreLifetimeCounter {
    pub fn new<S: StoreName>(name: S, action: StoreAction) -> Self {
        StoreLifetimeCounter {
            store_name: Some(name.name()),
            start: Instant::now(),
            action,
        }
    }
}

impl Drop for StoreLifetimeCounter {
    fn drop(&mut self) {
        counters().store_action(
            self.store_name.take().unwrap(),
            self.action,
            self.start.elapsed().as_micros() as u64,
        );
    }
}

pub trait StoreName {
    fn name(self) -> String;
}

impl StoreName for String {
    fn name(self) -> String {
        self
    }
}

impl StoreName for &'static str {
    fn name(self) -> String {
        self.to_string()
    }
}

impl<'a> StoreName for &'a dyn StoreDef {
    fn name(self) -> String {
        self.debug_name().to_string()
    }
}

impl<S: StoreDef> StoreName for PhantomData<S> {
    fn name(self) -> String {
        std::any::type_name::<S>()
            .rsplit("::")
            .next()
            .unwrap()
            .to_string()
    }
}

#[derive(Default)]
pub struct CounterMetric {
    count: AtomicU64,
    total_us: AtomicU64,
    extrema_last_update: AtomicU64,
    max_us_value: AtomicU64,
    min_us_value: AtomicU64,
}

impl CounterMetric {
    pub fn record_duration(&self, time_us: u64) {
        self.count.fetch_add(1, Ordering::AcqRel);
        self.total_us.fetch_add(time_us, Ordering::AcqRel);

        let current_minute = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs()
            / 60;

        /* note: don't really care about race conditions, we may drop the true peak time and that's fine. */
        let last_update = self.extrema_last_update.load(Ordering::Acquire);
        if last_update != current_minute {
            self.extrema_last_update
                .store(current_minute, Ordering::Release);
            self.max_us_value.store(time_us, Ordering::Release);
            self.min_us_value.store(time_us, Ordering::Release);
        } else {
            let current = self.max_us_value.load(Ordering::Acquire);
            if current < time_us {
                self.max_us_value.store(time_us, Ordering::Release);
            }

            let current = self.min_us_value.load(Ordering::Acquire);
            if time_us < current {
                self.min_us_value.store(time_us, Ordering::Release);
            }
        }
    }

    pub fn write_to_config<W: std::io::Write>(
        &self,
        prefix: &str,
        mut out: W,
    ) -> Result<(), std::io::Error> {
        writeln!(out, "#HELP {}_count", prefix)?;
        writeln!(out, "#TYPE {}_count counter", prefix)?;
        writeln!(
            out,
            "{}_count {}",
            prefix,
            self.count.load(Ordering::Relaxed)
        )?;

        writeln!(out, "#HELP {}_total_us", prefix)?;
        writeln!(out, "#TYPE {}_total_us counter", prefix)?;
        writeln!(
            out,
            "{}_total_us {}",
            prefix,
            self.total_us.load(Ordering::Relaxed)
        )?;

        writeln!(out, "#HELP {}_max_us", prefix)?;
        writeln!(out, "#TYPE {}_max_us gauge", prefix)?;
        writeln!(
            out,
            "{}_max_us {}",
            prefix,
            self.max_us_value.load(Ordering::Relaxed)
        )?;

        writeln!(out, "#HELP {}_min_us", prefix)?;
        writeln!(out, "#TYPE {}_min_us gauge", prefix)?;
        writeln!(
            out,
            "{}_min_us {}",
            prefix,
            self.min_us_value.load(Ordering::Relaxed)
        )?;

        Ok(())
    }
}

static COUNTERS: Lazy<Arc<Counters>> = Lazy::new(|| Arc::new(Counters::default()));

pub fn counters() -> &'static Counters {
    COUNTERS.as_ref()
}

fn js_counters_string(mut cx: FunctionContext) -> JsResult<JsString> {
    let counters = counters();
    let mut out = Vec::<u8>::new();
    counters.print_to_writer(&mut out).unwrap();
    Ok(cx.string(std::str::from_utf8(&out).unwrap()))
}

pub fn register_counters_js(cx: &mut ModuleContext) -> NeonResult<()> {
    cx.export_function("countersString", js_counters_string)?;
    Ok(())
}
