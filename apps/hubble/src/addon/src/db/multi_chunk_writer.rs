use flate2::write::GzEncoder;
use flate2::Compression;
use slog::{info, o};
use std::fs::{self, File};
use std::io::{Result, Write};
use std::path::{Path, PathBuf};

use crate::logger::LOGGER;

/**
* A writer that will write data to multiple files, creating a new file when the current one
* reaches the max size. The files are compressed using Gzip and the individual parts are
* named chunk_XXXX.bin where XXXX is the part number.
*
* The writer will create the `base_path` directory if it does not exist.
*/
pub(crate) struct MultiChunkWriter {
    base_path: PathBuf,
    current_part: usize,
    max_size: usize,
    current_size: usize,
    encoder: Option<GzEncoder<File>>,
    logger: slog::Logger,
}

impl MultiChunkWriter {
    pub fn new(base_path: PathBuf, max_size: usize) -> Self {
        Self {
            base_path,
            current_part: 0,
            max_size,
            current_size: 0,
            encoder: None,
            logger: LOGGER.new(o! ("module" => "snapshot_writer")),
        }
    }

    fn ensure_directory_exists<P: AsRef<Path>>(&self, path: P) -> Result<()> {
        if !path.as_ref().exists() {
            fs::create_dir_all(path)?;
        }
        Ok(())
    }

    pub fn next_part(&mut self) -> Result<()> {
        self.ensure_directory_exists(&self.base_path)?;
        // Finish the current part if it exists
        self.finish()?;

        self.current_part += 1;

        let file_name = self
            .base_path
            .join(format!("chunk_{:04}.bin", self.current_part));
        let file = File::create(&file_name)?;
        self.encoder = Some(GzEncoder::new(file, Compression::default()));
        self.current_size = 0;
        Ok(())
    }

    pub fn finish(&mut self) -> Result<()> {
        if let Some(encoder) = self.encoder.take() {
            info!(self.logger, "Finished writing part"; "part" => self.current_part);

            encoder.finish()?;
        }
        Ok(())
    }
}

impl Write for MultiChunkWriter {
    fn write(&mut self, buf: &[u8]) -> Result<usize> {
        if self.encoder.is_none() || (self.current_size + buf.len() > self.max_size) {
            self.next_part()?;
        }

        if let Some(encoder) = self.encoder.as_mut() {
            let size = encoder.write(buf)?;
            self.current_size += size;
            Ok(size)
        } else {
            Ok(0) // This should never happen
        }
    }

    fn flush(&mut self) -> Result<()> {
        if let Some(encoder) = self.encoder.as_mut() {
            encoder.flush()
        } else {
            Ok(())
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use flate2::read::GzDecoder;
    use std::io::Read as _;
    use tempfile::TempDir;

    #[test]
    fn test_initialization_and_file_creation() {
        let temp_dir = TempDir::new().unwrap();
        let mut writer = MultiChunkWriter::new(temp_dir.path().to_path_buf(), 100);

        writer.write_all(b"Hello, world!").unwrap();
        writer.finish().unwrap();

        let entries = std::fs::read_dir(temp_dir.path()).unwrap();

        // Collect entries and sort them to ensure we read them in the correct order
        let mut files: Vec<_> = entries.map(|e| e.unwrap().path()).collect();
        files.sort();
        assert_eq!(files.len(), 1);

        // Now, verify the contents of each file
        let file = File::open(files.get(0).unwrap()).unwrap();
        let mut gz = GzDecoder::new(file);
        let mut contents = String::new();
        gz.read_to_string(&mut contents).unwrap();

        assert_eq!(
            contents, "Hello, world!",
            "File content did not match expected for file {:?}",
            files[0]
        );
    }

    #[test]
    fn test_handling_maximum_size() {
        let temp_dir = TempDir::new().unwrap();
        let mut writer = MultiChunkWriter::new(temp_dir.path().to_path_buf(), 5);

        writer.write_all(b"12345").unwrap();
        writer.write_all(b"67890").unwrap(); // This should trigger a new part
        writer.finish().unwrap();

        let entries = std::fs::read_dir(temp_dir.path()).unwrap();
        // Collect entries and sort them to ensure we read them in the correct order
        let mut files: Vec<_> = entries.map(|e| e.unwrap().path()).collect();
        files.sort();
        assert_eq!(files.len(), 2); // Expect two files

        // Now, verify the contents of each file
        for (index, file_path) in files.iter().enumerate() {
            let file = File::open(file_path).unwrap();
            let mut gz = GzDecoder::new(file);
            let mut contents = String::new();
            gz.read_to_string(&mut contents).unwrap();

            let expected = if index == 0 { "12345" } else { "67890" };
            assert_eq!(
                contents, expected,
                "File content did not match expected for file {:?}",
                file_path
            );
        }
    }

    #[test]
    fn test_directory_creation() {
        let temp_dir = TempDir::new().unwrap();
        let non_existent_subdir = temp_dir.path().join("subdir");

        let mut writer = MultiChunkWriter::new(non_existent_subdir.clone(), 100);

        writer.write_all(b"Data").unwrap();
        writer.finish().unwrap();

        assert!(non_existent_subdir.exists()); // Directory should now exist
    }
}
