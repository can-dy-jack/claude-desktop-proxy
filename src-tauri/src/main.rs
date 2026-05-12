mod commands;
mod config;
mod logs;
mod proxy;

use std::sync::Arc;

use config::store::{AppConfig, ConfigStore};
use logs::AppLogger;
use proxy::server::ProxyServer;
use tauri::menu::{IsMenuItem, Menu, MenuItem, PredefinedMenuItem, Submenu};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager, Runtime, Wry};

const TRAY_ID: &str = "main-tray";
const MENU_OPEN_SETTINGS: &str = "open-settings";
const MENU_TOGGLE_PROXY: &str = "toggle-proxy";
const MENU_QUIT: &str = "quit";
const PROFILE_MENU_PREFIX: &str = "profile::";

pub struct AppState {
    pub store: Arc<ConfigStore>,
    pub proxy: Arc<ProxyServer>,
    pub logger: Arc<AppLogger>,
}

fn show_main_window<R: Runtime>(app: &AppHandle<R>) {
    let _ = app.set_activation_policy(tauri::ActivationPolicy::Regular);
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

fn hide_main_window<R: Runtime>(app: &AppHandle<R>) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.hide();
    }
    let _ = app.set_activation_policy(tauri::ActivationPolicy::Accessory);
}

fn build_tray_menu(app: &AppHandle<Wry>, config: &AppConfig, running: bool) -> Result<Menu<Wry>, tauri::Error> {
    let mut profile_items = Vec::new();
    if config.profiles.is_empty() {
        profile_items.push(MenuItem::with_id(
            app,
            "profile::none",
            "暂无配置组",
            false,
            None::<&str>,
        )?);
    } else {
        for profile in &config.profiles {
            let is_active = config.active_profile_id.as_deref() == Some(profile.id.as_str());
            let title = if is_active {
                format!("✓ {}", profile.name)
            } else {
                profile.name.clone()
            };
            profile_items.push(MenuItem::with_id(
                app,
                format!("{PROFILE_MENU_PREFIX}{}", profile.id),
                title,
                true,
                None::<&str>,
            )?);
        }
    }
    let profile_refs: Vec<&dyn IsMenuItem<Wry>> = profile_items
        .iter()
        .map(|item| item as &dyn IsMenuItem<Wry>)
        .collect();
    let profile_submenu = Submenu::with_id_and_items(app, "profiles", "切换配置组", true, &profile_refs)?;

    let toggle_proxy_label = if running { "停止代理" } else { "启动代理" };
    let toggle_proxy = MenuItem::with_id(app, MENU_TOGGLE_PROXY, toggle_proxy_label, true, None::<&str>)?;
    let open_settings = MenuItem::with_id(app, MENU_OPEN_SETTINGS, "打开设置", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, MENU_QUIT, "退出", true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;

    Menu::with_items(
        app,
        &[&profile_submenu, &separator, &toggle_proxy, &open_settings, &quit],
    )
}

pub(crate) fn refresh_tray_menu(app: &AppHandle<Wry>) -> Result<(), String> {
    let state = app.state::<AppState>();
    let config = state.store.load()?;
    let app_handle = app.clone();
    let proxy = state.proxy.clone();

    tauri::async_runtime::spawn(async move {
        let (running, _) = proxy.status().await;
        if let Ok(menu) = build_tray_menu(&app_handle, &config, running) {
            if let Some(tray) = app_handle.tray_by_id(TRAY_ID) {
                let _ = tray.set_menu(Some(menu));
            }
        }
    });

    Ok(())
}

fn handle_tray_menu_event(app: &AppHandle<Wry>, menu_id: &str) {
    if menu_id == MENU_OPEN_SETTINGS {
        show_main_window(app);
        return;
    }

    if menu_id == MENU_QUIT {
        app.exit(0);
        return;
    }

    let state = app.state::<AppState>();
    let store = state.store.clone();
    let proxy = state.proxy.clone();
    let logger = state.logger.clone();
    let app_handle = app.clone();

    if menu_id == MENU_TOGGLE_PROXY {
        tauri::async_runtime::spawn(async move {
            let (running, _) = proxy.status().await;
            if running {
                proxy.stop().await;
                logger.push("info", "proxy", "stopped proxy from tray menu");
            } else if let Ok(config) = store.load() {
                let _ = proxy.start(config.proxy_port).await;
                logger.push(
                    "info",
                    "proxy",
                    format!("started proxy from tray menu on port {}", config.proxy_port),
                );
            }
            let _ = refresh_tray_menu(&app_handle);
            let _ = app_handle.emit("proxy-state-changed", ());
        });
        return;
    }

    if let Some(profile_id) = menu_id.strip_prefix(PROFILE_MENU_PREFIX) {
        let profile_id = profile_id.to_string();
        tauri::async_runtime::spawn(async move {
            let _ = store.set_active_profile(&profile_id);
            if let Ok(config) = store.load() {
                logger.push("info", "profile", "switched active profile from tray");

                let (running, _) = proxy.status().await;
                if running {
                    proxy.stop().await;
                    let _ = proxy.start(config.proxy_port).await;
                }
            }
            let _ = refresh_tray_menu(&app_handle);
            let _ = app_handle.emit("proxy-state-changed", ());
        });
    }
}

fn main() {
    let store = Arc::new(ConfigStore::new());
    let logger = Arc::new(AppLogger::new(100));
    let proxy = Arc::new(ProxyServer::new(store.clone(), logger.clone()));

    let state = AppState {
        store,
        proxy,
        logger,
    };

    tauri::Builder::default()
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            commands::get_config,
            commands::upsert_profile,
            commands::delete_profile,
            commands::set_active_profile,
            commands::update_runtime_settings,
            commands::update_language,
            commands::get_runtime_status,
            commands::get_logs,
            commands::clear_logs,
            commands::start_proxy,
            commands::stop_proxy
        ])
        .setup(|app| {
            let app_handle = app.handle().clone();

            let config = {
                let state = app.state::<AppState>();
                state.store.load().unwrap_or_default()
            };
            let running = false;
            let menu = build_tray_menu(&app_handle, &config, running)?;
            let mut tray_builder = TrayIconBuilder::with_id(TRAY_ID)
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| {
                    handle_tray_menu_event(app, event.id().as_ref());
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        show_main_window(tray.app_handle());
                    }
                });

            if let Some(icon) = app.default_window_icon() {
                tray_builder = tray_builder.icon(icon.clone());
            }

            let _ = tray_builder.build(app)?;

            let main_window = app.get_webview_window("main").expect("main window");
            if let Some(icon) = app.default_window_icon() {
                let _ = main_window.set_icon(icon.clone());
            }
            let app_for_window = app_handle.clone();
            main_window.on_window_event(move |event| {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    hide_main_window(app_for_window.app_handle());
                }
            });
            hide_main_window(app_handle.app_handle());

            if config.auto_start && config.active_profile_id.is_some() {
                let app_handle = app_handle.clone();
                let state = app.state::<AppState>();
                let proxy = state.proxy.clone();
                let port = config.proxy_port;
                tauri::async_runtime::spawn(async move {
                    let _ = proxy.start(port).await;
                    let _ = refresh_tray_menu(&app_handle);
                });
            } else {
                let _ = refresh_tray_menu(&app_handle);
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
