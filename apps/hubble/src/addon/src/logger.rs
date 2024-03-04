use chrono::Utc;
use neon::context::FunctionContext;
use neon::result::JsResult;
use neon::types::JsUndefined;
use slog::{o, Drain, FnValue, Level, Logger, PushFnValue, Record};
use std::io::Write;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
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
}

impl<W: Write> Write for BufferedSwitchWriter<W> {
    fn write(&mut self, buf: &[u8]) -> io::Result<usize> {
        // First check if we need to flush the buffer
        if self.flush_next.load(Ordering::Relaxed) {
            self.flush()?;
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
        if let Some(ref mut buffer) = self.buffer {
            self.writer.write_all(&buffer)?;
            self.writer.flush()?;
            self.buffer = None;
        }

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

    let async_drain = slog_async::Async::new(json_logger.fuse()).build().fuse();

    Logger::root(async_drain, o!("root" => "true"))
}

pub fn js_flush_log_buffer(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    FLUSH_NEXT.store(true, Ordering::Relaxed);

    Ok(JsUndefined::new(&mut cx))
}

use once_cell::sync::Lazy;
pub static LOGGER: Lazy<Logger> = Lazy::new(|| create_logger());
static FLUSH_NEXT: Lazy<Arc<AtomicBool>> = Lazy::new(|| Arc::new(AtomicBool::new(false)));
