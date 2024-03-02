use chrono::Utc;
use slog::{o, Drain, FnValue, Logger, PushFnValue, Record};
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

    pub fn flush_buffer(&mut self) -> io::Result<()> {
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
        self.flush_buffer()
    }
}

impl<W: Write> Drop for BufferedSwitchWriter<W> {
    fn drop(&mut self) {
        let _ = self.flush_buffer();
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
            "time" => FnValue(move |_ : &slog::Record| {
                format!("{}", Utc::now().timestamp_millis())
            }),
            "pid" => process::id().to_string(),
            "hostname" => hostname,
        ))
        .add_key_value(o!(
            "msg" => PushFnValue(move |record : &Record, ser| {
                ser.emit(record.msg())
            }),
            "level" => FnValue(move |rinfo : &Record| {
                (rinfo.level().as_usize() - 1) * 10 // Convert log level to a number for datadog
            }),
        ))
        .set_newlines(true)
        .set_flush(true)
        .build();

    let async_drain = slog_async::Async::new(json_logger.fuse()).build().fuse();

    Logger::root(async_drain, o!("root" => "true"))
}

pub fn flush_log_buffer() {
    FLUSH_NEXT.store(true, Ordering::Relaxed);
}

use once_cell::sync::Lazy;
pub static LOGGER: Lazy<Logger> = Lazy::new(|| create_logger());
static FLUSH_NEXT: Lazy<Arc<AtomicBool>> = Lazy::new(|| Arc::new(AtomicBool::new(false)));
