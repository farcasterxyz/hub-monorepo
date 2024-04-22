use std::ffi::CStr;

use rocksdb::{
    compaction_filter::CompactionFilter, compaction_filter::Decision,
    compaction_filter_factory::CompactionFilterContext,
    compaction_filter_factory::CompactionFilterFactory,
};
use zstd::stream::raw::{Encoder, Operation};
use zstd::zstd_safe::{InBuffer, OutBuffer};

// Define a static mutable array of size 8192.
static mut BUFFER: [u8; 8192] = [0; 8192];

// Function to safely fill the buffer with data.
// Ensures that the data slice does not exceed the buffer size.
fn fill_buffer(data: &[u8]) {
    unsafe {
        // Ensure we do not write out of bounds.
        if data.len() <= BUFFER.len() {
            BUFFER[..data.len()].copy_from_slice(data);
        }
    }
}

// Function to safely access the buffer as a slice.
// Returns a 'static lifetime slice by extending the lifetime unsafely.
// NOTE: This is safe as long as no concurrent modifications are made to the buffer.
unsafe fn get_buffer_slice(size: usize) -> &'static [u8] {
    &BUFFER[..size]
}

const ZSTD_COMPRESSION_LEVEL: i32 = 22;

// Define a custom compaction filter
pub struct CompressionFilter {
    context: CompactionFilterContext,
    encoder: Encoder<'static>,
    // Temporarily store modified values for ongoing operations
}

impl CompressionFilter {
    pub fn new(context: CompactionFilterContext) -> Self {
        CompressionFilter {
            context,
            encoder: Encoder::new(ZSTD_COMPRESSION_LEVEL).unwrap(),
        }
    }
}
impl CompactionFilter for CompressionFilter {
    fn filter(&mut self, level: u32, _key: &[u8], value: &[u8]) -> Decision {
        let mut buffer = Vec::new();

        let mut input_buffer = InBuffer::around(value);
        let mut output_buffer = OutBuffer::around(&mut buffer);

        loop {
            self.encoder
                .run(&mut input_buffer, &mut output_buffer)
                .unwrap();
            if input_buffer.pos == input_buffer.src.len() {
                break;
            }
        }

        if input_buffer.pos != input_buffer.src.len() {
            Decision::Keep
        } else {
            fill_buffer(output_buffer.as_slice());
            unsafe { Decision::Change(get_buffer_slice(output_buffer.as_slice().len())) }
        }
    }

    fn name(&self) -> &CStr {
        CStr::from_bytes_with_nul(b"CompressionFilter\0").unwrap()
    }
}

impl CompactionFilterFactory for CompressionFilter {
    type Filter = CompressionFilter;

    fn create(&mut self, context: CompactionFilterContext) -> Self::Filter {
        CompressionFilter::new(context)
    }

    fn name(&self) -> &CStr {
        CStr::from_bytes_with_nul(b"CompressionFilter\0").unwrap()
    }
}
