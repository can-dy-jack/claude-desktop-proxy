use std::collections::VecDeque;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct LogEntry {
    pub ts_ms: u128,
    pub level: String,
    pub source: String,
    pub message: String,
}

pub struct AppLogger {
    capacity: usize,
    entries: Mutex<VecDeque<LogEntry>>,
}

impl AppLogger {
    pub fn new(capacity: usize) -> Self {
        Self {
            capacity,
            entries: Mutex::new(VecDeque::new()),
        }
    }

    pub fn push(&self, level: &str, source: &str, message: impl Into<String>) {
        let ts_ms = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_millis())
            .unwrap_or(0);
        let entry = LogEntry {
            ts_ms,
            level: level.to_string(),
            source: source.to_string(),
            message: message.into(),
        };

        if let Ok(mut guard) = self.entries.lock() {
            guard.push_back(entry);
            while guard.len() > self.capacity {
                guard.pop_front();
            }
        }
    }

    pub fn list(&self, limit: usize) -> Vec<LogEntry> {
        let safe_limit = limit.max(1).min(1000);
        if let Ok(guard) = self.entries.lock() {
            let skip = guard.len().saturating_sub(safe_limit);
            return guard.iter().skip(skip).cloned().collect();
        }
        Vec::new()
    }

    pub fn clear(&self) {
        if let Ok(mut guard) = self.entries.lock() {
            guard.clear();
        }
    }
}
