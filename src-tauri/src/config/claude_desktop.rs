use std::fs;
use std::path::PathBuf;

use dirs::home_dir;
use serde_json::{json, Value};

use super::store::Profile;

const PROFILE_ID: &str = "00000000-0000-4000-8000-000000157210";
const PROFILE_NAME: &str = "Claude Desktop Proxy";

fn app_support_base() -> Result<PathBuf, String> {
    let home = home_dir().ok_or_else(|| "cannot resolve home dir".to_string())?;
    Ok(home.join("Library").join("Application Support"))
}

fn read_json_or_default(path: &PathBuf) -> Value {
    fs::read_to_string(path)
        .ok()
        .and_then(|content| serde_json::from_str(&content).ok())
        .unwrap_or_else(|| json!({}))
}

fn write_json(path: &PathBuf, value: &Value) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let body = serde_json::to_string_pretty(value).map_err(|e| e.to_string())?;
    fs::write(path, body).map_err(|e| e.to_string())
}

fn normalize_claude_model_id(input: &str) -> Option<String> {
    let raw = input.trim();
    if raw.is_empty() {
        return None;
    }
    let without_vendor = raw.strip_prefix("anthropic/").unwrap_or(raw);
    if let Some(stripped) = without_vendor.strip_prefix("claude-") {
        return Some(format!("claude-{stripped}"));
    }
    Some(format!("claude-{without_vendor}"))
}

pub fn apply_profile(profile: &Profile, proxy_port: u16) -> Result<(), String> {
    let app_support = app_support_base()?;
    let normal_path = app_support
        .join("Claude")
        .join("claude_desktop_config.json");
    let threep_path = app_support
        .join("Claude-3p")
        .join("claude_desktop_config.json");

    let library = app_support.join("Claude-3p").join("config-library");
    let profile_path = library.join(format!("{PROFILE_ID}.json"));
    let meta_path = library.join("_meta.json");

    eprintln!("[apply] app_support_base={}", app_support.display());
    eprintln!(
        "[apply] normal_path={} exists={}",
        normal_path.display(),
        normal_path.exists()
    );
    eprintln!(
        "[apply] threep_path={} exists={}",
        threep_path.display(),
        threep_path.exists()
    );
    eprintln!(
        "[apply] profile_path={} exists={}",
        profile_path.display(),
        profile_path.exists()
    );
    eprintln!(
        "[apply] meta_path={} exists={}",
        meta_path.display(),
        meta_path.exists()
    );

    let mut normal = read_json_or_default(&normal_path);
    let mut threep = read_json_or_default(&threep_path);

    normal["deploymentMode"] = json!("3p");
    threep["deploymentMode"] = json!("3p");

        let safe_models: Vec<String> = profile
        .model_mappings
        .iter()
        .filter_map(|m| normalize_claude_model_id(&m.claude_id))
        .collect();

        let model_entries: Vec<Value> = safe_models
                .iter()
                .map(|name| json!({ "name": name }))
                .collect();

    let profile_json = json!({
            "disableDeploymentModeChooser": false,
      "inferenceGatewayApiKey": profile.gateway_token,
      "inferenceGatewayAuthScheme": "bearer",
      "inferenceGatewayBaseUrl": format!("http://127.0.0.1:{proxy_port}"),
      "inferenceProvider": "gateway",
            "inferenceModels": model_entries
    });

        // Some Claude Desktop builds read gateway settings directly from the
        // top-level config files instead of config-library profiles.
        normal["disableDeploymentModeChooser"] = profile_json["disableDeploymentModeChooser"].clone();
        normal["inferenceGatewayApiKey"] = profile_json["inferenceGatewayApiKey"].clone();
        normal["inferenceGatewayAuthScheme"] = profile_json["inferenceGatewayAuthScheme"].clone();
        normal["inferenceGatewayBaseUrl"] = profile_json["inferenceGatewayBaseUrl"].clone();
        normal["inferenceProvider"] = profile_json["inferenceProvider"].clone();
        normal["inferenceModels"] = profile_json["inferenceModels"].clone();

        threep["disableDeploymentModeChooser"] = profile_json["disableDeploymentModeChooser"].clone();
        threep["inferenceGatewayApiKey"] = profile_json["inferenceGatewayApiKey"].clone();
        threep["inferenceGatewayAuthScheme"] = profile_json["inferenceGatewayAuthScheme"].clone();
        threep["inferenceGatewayBaseUrl"] = profile_json["inferenceGatewayBaseUrl"].clone();
        threep["inferenceProvider"] = profile_json["inferenceProvider"].clone();
        threep["inferenceModels"] = profile_json["inferenceModels"].clone();

    let mut meta = read_json_or_default(&meta_path);
    let mut entries = meta
        .get("entries")
        .and_then(|v| v.as_array().cloned())
        .unwrap_or_default();
    entries.retain(|entry| entry.get("id").and_then(|v| v.as_str()) != Some(PROFILE_ID));
    entries.push(json!({"id": PROFILE_ID, "name": PROFILE_NAME}));

    // Keep multiple key aliases for compatibility with Claude Desktop versions.
    meta["appliedId"] = json!(PROFILE_ID);
    meta["activeId"] = json!(PROFILE_ID);
    meta["selectedId"] = json!(PROFILE_ID);
    meta["entries"] = Value::Array(entries);

    write_json(&normal_path, &normal)?;
    write_json(&threep_path, &threep)?;
    write_json(&profile_path, &profile_json)?;
    write_json(&meta_path, &meta)?;
    eprintln!(
        "[apply] write done: normal={}, threep={}, profile={}, meta={}",
        normal_path.display(),
        threep_path.display(),
        profile_path.display(),
        meta_path.display()
    );
    Ok(())
}
