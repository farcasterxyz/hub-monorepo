use chrono::Utc;
use neon::context::{Context, FunctionContext};
use neon::result::JsResult;
use neon::types::{JsString, JsUndefined};
use slog::{info, o, Drain, FnValue, Level, LevelFilter, Logger, PushFnValue, Record};
use slog_async::Async;
use slog_atomic::{AtomicSwitch, AtomicSwitchCtrl};
use std::io::Write;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::{io, process};

struct BufferedSwitchWriter<W: Write> {
    writer: W,
    buffer: Option<Vec<u8>>,
    flush_next: Arc<AtomicBool>,
}

impl<W: Write> BufferedSwitchWriter<W> {
    pub fn new(writer: W, flush_next: Arc<AtomicBool>) -> Self {
        BufferedSwitchWriter {
            writer,
            buffer: Some(Vec::new()),
            flush_next,
        }
    }

    fn flush_buffer(&mut self) -> io::Result<()> {
        if let Some(ref mut buffer) = self.buffer {
            self.writer.write_all(&buffer)?;
            self.writer.flush()?;
            self.buffer = None;
        }

        Ok(())
    }
}

impl<W: Write> Write for BufferedSwitchWriter<W> {
    fn write(&mut self, buf: &[u8]) -> io::Result<usize> {
        // First check if we need to flush the buffer
        if self.flush_next.load(Ordering::Relaxed) {
            self.flush_buffer()?;
            self.flush_next.store(false, Ordering::Relaxed);
        }

        if let Some(ref mut buffer) = self.buffer {
            buffer.extend_from_slice(buf);
            Ok(buf.len()) // Pretend we've written all bytes successfully
        } else {
            self.writer.write(buf)
        }
    }

    fn flush(&mut self) -> io::Result<()> {
        self.writer.flush()
    }
}

impl<W: Write> Drop for BufferedSwitchWriter<W> {
    fn drop(&mut self) {
        let _ = self.flush();
    }
}

fn create_logger() -> Logger {
    let hostname = hostname::get()
        .map(|s| s.into_string().unwrap_or("unknown_os_hostname".to_string()))
        .unwrap_or("unknown".to_string())
        .to_string();

    let buffered_stdout = BufferedSwitchWriter::new(io::stdout(), FLUSH_NEXT.clone());

    let json_logger = slog_json::Json::new(buffered_stdout)
        .add_key_value(o!(
            "time" =>Utc::now().timestamp_millis(),
            "pid" => process::id(),
            "hostname" => hostname,
        ))
        .add_key_value(o!(
            "msg" => PushFnValue(move |record : &Record, ser| {
                ser.emit(record.msg())
            }),
            "level" => FnValue(move |rinfo : &Record| {
                // Convert slog log level to a number for datadog
                match rinfo.level() {
                    Level::Critical => 60,
                    Level::Error => 50,
                    Level::Warning => 40,
                    Level::Info => 30,
                    Level::Debug => 20,
                    Level::Trace => 10,
                }
            }),
        ))
        .set_newlines(true)
        .set_flush(true)
        .build();

    let async_drain = Arc::new(slog_async::Async::new(json_logger.fuse()).build());

    // Store the async drain in a global variable
    *ASYNC_DRAIN.lock().unwrap() = Some(async_drain.clone());

    // Get the environment variable NODE_ENV, and if it is set to "test" or "CI", then set the log level to "critical"
    let log_level = match std::env::var("NODE_ENV") {
        Ok(val) => {
            if val == "test" || val == "CI" {
                Level::Critical
            } else {
                Level::Info
            }
        }
        Err(_) => Level::Info,
    };

    // Log at the info level by default
    let async_drain = LevelFilter::new(async_drain.fuse(), log_level).fuse();

    // Create an AtomicSwitch with the initial drain
    let switch = AtomicSwitch::new(async_drain.fuse());
    let switch_ctrl = switch.ctrl();

    // Store the switch controller in a global variable
    *LOG_LEVEL_SWITCH.lock().unwrap() = Some(switch_ctrl);

    // Wrap the switch in a LevelFilter if needed or directly use the switch
    let drain = switch.fuse();

    Logger::root(drain, o!())
}

pub fn js_flush_log_buffer(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    FLUSH_NEXT.store(true, Ordering::Relaxed);
    info!(LOGGER, "Flushing rust log buffer. Writing logs directly from Rust"; "flush_next" => true);

    Ok(JsUndefined::new(&mut cx))
}

pub fn js_set_log_level(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    let switch = LOG_LEVEL_SWITCH.lock().unwrap();
    if switch.is_none() {
        return cx.throw_error("Log level switch is not initialized");
    }

    let async_drain = ASYNC_DRAIN.lock().unwrap();
    if async_drain.is_none() {
        return cx.throw_error("Async drain is not initialized");
    }

    // Read the level from the arguments
    let level = match cx.argument::<JsString>(0)?.value(&mut cx).as_str() {
        "critical" => Level::Critical,
        "error" => Level::Error,
        "warning" => Level::Warning,
        "info" => Level::Info,
        "debug" => Level::Debug,
        "trace" => Level::Trace,
        _ => return cx.throw_error("Invalid log level"),
    };

    // Create a new drain with the new level
    let async_drain_ref = async_drain.as_ref().unwrap();
    let async_drain = async_drain_ref.clone();
    let new_drain = LevelFilter::new(async_drain.fuse(), level).fuse();

    // Set the new drain
    let switch = switch.as_ref().unwrap();
    switch.set(new_drain);

    Ok(JsUndefined::new(&mut cx))
}

use once_cell::sync::Lazy;
pub static LOGGER: Lazy<Logger> = Lazy::new(|| create_logger());

// This is a global flag that is used to signal to the logger that it should flush the next log
static FLUSH_NEXT: Lazy<Arc<AtomicBool>> = Lazy::new(|| Arc::new(AtomicBool::new(false)));

// Controller to switch the log levels
static LOG_LEVEL_SWITCH: Lazy<Mutex<Option<AtomicSwitchCtrl>>> = Lazy::new(|| Mutex::new(None));

// Controller to filter the log levels
static ASYNC_DRAIN: Lazy<Mutex<Option<Arc<Async>>>> = Lazy::new(|| Mutex::new(None));
