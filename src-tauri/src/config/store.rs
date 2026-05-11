use std::fs;
use std::path::PathBuf;

use dirs::config_dir;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ModelMapping {
    pub claude_id: String,
    pub upstream_id: String,
    pub display_name: Option<String>,
    pub supports_1m: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Profile {
    pub id: String,
    pub name: String,
    pub provider_base_url: String,
    pub api_key: String,
    pub gateway_token: String,
    pub model_mappings: Vec<ModelMapping>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub active_profile_id: Option<String>,
    pub proxy_port: u16,
    pub auto_start: bool,
    pub profiles: Vec<Profile>,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            active_profile_id: None,
            proxy_port: 15800,
            auto_start: true,
            profiles: vec![],
        }
    }
}

#[derive(Clone)]
pub struct ConfigStore {
    path: PathBuf,
}

impl ConfigStore {
    pub fn new() -> Self {
        let base = config_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("claude-desktop-proxy");
        Self {
            path: base.join("config.json"),
        }
    }

    pub fn load(&self) -> Result<AppConfig, String> {
        if !self.path.exists() {
            return Ok(AppConfig::default());
        }
        let content = fs::read_to_string(&self.path).map_err(|e| e.to_string())?;
        let config: AppConfig = serde_json::from_str(&content).map_err(|e| e.to_string())?;
        Ok(config)
    }

    pub fn save(&self, config: &AppConfig) -> Result<(), String> {
        if let Some(parent) = self.path.parent() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        let body = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;
        fs::write(&self.path, body).map_err(|e| e.to_string())
    }

    pub fn upsert_profile(&self, mut profile: Profile) -> Result<Profile, String> {
        let mut config = self.load()?;
        if profile.id.trim().is_empty() {
            profile.id = Uuid::new_v4().to_string();
        }
        if profile.gateway_token.trim().is_empty() {
            profile.gateway_token = format!("cdp-{}", Uuid::new_v4().simple());
        }

        profile.model_mappings.retain(|mapping| {
            !mapping.claude_id.trim().is_empty() && !mapping.upstream_id.trim().is_empty()
        });

        if profile.model_mappings.is_empty() {
            profile.model_mappings.push(ModelMapping {
                claude_id: "claude-sonnet-4-6".to_string(),
                upstream_id: String::new(),
                display_name: None,
                supports_1m: Some(false),
            });
        }

        match config.profiles.iter().position(|item| item.id == profile.id) {
            Some(index) => config.profiles[index] = profile.clone(),
            None => config.profiles.push(profile.clone()),
        }

        self.save(&config)?;
        Ok(profile)
    }

    pub fn update_runtime_settings(&self, proxy_port: u16, auto_start: bool) -> Result<(), String> {
        if proxy_port == 0 {
            return Err("proxy port must be between 1 and 65535".to_string());
        }

        let mut config = self.load()?;
        config.proxy_port = proxy_port;
        config.auto_start = auto_start;
        self.save(&config)
    }

    pub fn delete_profile(&self, profile_id: &str) -> Result<(), String> {
        let mut config = self.load()?;
        config.profiles.retain(|item| item.id != profile_id);
        if config.active_profile_id.as_deref() == Some(profile_id) {
            config.active_profile_id = None;
        }
        self.save(&config)
    }

    pub fn set_active_profile(&self, profile_id: &str) -> Result<(), String> {
        let mut config = self.load()?;
        if !config.profiles.iter().any(|item| item.id == profile_id) {
            return Err("profile not found".to_string());
        }
        config.active_profile_id = Some(profile_id.to_string());
        self.save(&config)
    }

    pub fn active_profile(&self) -> Result<Option<Profile>, String> {
        let config = self.load()?;
        Ok(config
            .active_profile_id
            .as_deref()
            .and_then(|id| config.profiles.into_iter().find(|item| item.id == id)))
    }
}
