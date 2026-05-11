use serde::Serialize;
use tauri::AppHandle;
use tauri::State;

use crate::config::claude_desktop;
use crate::config::store::{AppConfig, Profile};
use crate::AppState;

#[derive(Serialize)]
pub struct RuntimeStatus {
    running: bool,
    active_profile_id: Option<String>,
    proxy_port: u16,
}

#[tauri::command]
pub fn get_config(state: State<'_, AppState>) -> Result<AppConfig, String> {
    state.store.load()
}

#[tauri::command]
pub fn upsert_profile(
    state: State<'_, AppState>,
    app: AppHandle,
    profile: Profile,
) -> Result<Profile, String> {
    let saved = state.store.upsert_profile(profile)?;
    let _ = crate::refresh_tray_menu(&app);
    Ok(saved)
}

#[tauri::command]
pub fn delete_profile(
    state: State<'_, AppState>,
    app: AppHandle,
    profile_id: String,
) -> Result<(), String> {
    state.store.delete_profile(&profile_id)?;
    let _ = crate::refresh_tray_menu(&app);
    Ok(())
}

#[tauri::command]
pub async fn set_active_profile(
    state: State<'_, AppState>,
    app: AppHandle,
    profile_id: String,
) -> Result<(), String> {
    state.store.set_active_profile(&profile_id)?;
    let config = state.store.load()?;
    let (running, _) = state.proxy.status().await;
    if running {
        state.proxy.stop().await;
        state.proxy.start(config.proxy_port.max(1)).await?;
    }
    let _ = crate::refresh_tray_menu(&app);
    Ok(())
}

#[tauri::command]
pub async fn update_runtime_settings(
    state: State<'_, AppState>,
    app: AppHandle,
    proxy_port: u16,
    auto_start: bool,
) -> Result<(), String> {
    state
        .store
        .update_runtime_settings(proxy_port, auto_start)?;
    let (running, _) = state.proxy.status().await;
    if running {
        state.proxy.stop().await;
        state.proxy.start(proxy_port).await?;
    }
    let _ = crate::refresh_tray_menu(&app);
    Ok(())
}

#[tauri::command]
pub async fn start_proxy(state: State<'_, AppState>, app: AppHandle) -> Result<(), String> {
    let config = state.store.load()?;
    state.proxy.start(config.proxy_port).await?;
    let _ = crate::refresh_tray_menu(&app);
    Ok(())
}

#[tauri::command]
pub async fn stop_proxy(state: State<'_, AppState>, app: AppHandle) -> Result<(), String> {
    state.proxy.stop().await;
    let _ = crate::refresh_tray_menu(&app);
    Ok(())
}

#[tauri::command]
pub async fn get_runtime_status(state: State<'_, AppState>) -> Result<RuntimeStatus, String> {
    let config = state.store.load()?;
    let (running, port) = state.proxy.status().await;
    Ok(RuntimeStatus {
        running,
        active_profile_id: config.active_profile_id,
        proxy_port: port,
    })
}

#[tauri::command]
pub fn apply_to_claude_desktop(state: State<'_, AppState>) -> Result<(), String> {
    let config = state.store.load()?;
    let active_id = config
        .active_profile_id
        .ok_or_else(|| "no active profile".to_string())?;
    let profile = config
        .profiles
        .iter()
        .find(|item| item.id == active_id)
        .ok_or_else(|| "active profile not found".to_string())?;
    claude_desktop::apply_profile(profile, config.proxy_port)
}
