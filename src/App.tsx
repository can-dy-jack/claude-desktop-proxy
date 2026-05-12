import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { MouseEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ConfigForm,
  DebugLogs,
  ProfileSelector,
  RuntimeSettings,
  SettingsPanel,
} from "./components";
import {
  createTranslator,
  detectSystemLocale,
  normalizeLocale,
  type Locale,
} from "./i18n";
import type { AppConfig, LogEntry, Profile, RuntimeStatus } from "./types";

type TabKey = "profile" | "runtime" | "settings" | "logs";

interface Toast {
  id: number;
  type: "info" | "success" | "error";
  text: string;
}

const emptyProfile = (): Profile => ({
  id: "",
  name: "",
  provider_base_url: "",
  api_key: "",
  gateway_token: "",
  model_mappings: [
    { claude_id: "claude-sonnet-4-6", upstream_id: "claude-sonnet-4-6" },
    { claude_id: "claude-opus-4-1", upstream_id: "claude-opus-4-1" },
    { claude_id: "claude-haiku-3-5", upstream_id: "claude-haiku-3-5" },
  ],
});

const TAB_META: { key: TabKey; icon: JSX.Element }[] = [
  {
    key: "profile",
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="7" cy="12" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="17" cy="12" r="1.5" fill="currentColor" stroke="none" />
        <path d="M7 7V5M12 7V5M17 7V5M7 19v-2M12 19v-2M17 19v-2" />
      </svg>
    ),
  },
  {
    key: "runtime",
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M10 8l6 4-6 4V8z" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    key: "settings",
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .15 1.7 1.7 0 0 0-.99 1.55V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8 19.4a1.7 1.7 0 0 0-1-.15 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.15-1 1.7 1.7 0 0 0-1.55-.99H2.9a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8a1.7 1.7 0 0 0 .15-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 8 4.6a1.7 1.7 0 0 0 1-.15h0a1.7 1.7 0 0 0 .99-1.55V2.9a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1 .15 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 8a1.7 1.7 0 0 0 .15 1v0a1.7 1.7 0 0 0 1.55.99h.09a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15z" />
      </svg>
    ),
  },
  {
    key: "logs",
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <path d="M14 3v6h6" />
        <path d="M8 13h8M8 17h5" />
      </svg>
    ),
  },
];

export default function App() {
  const appWindow = getCurrentWindow();
  const [tab, setTab] = useState<TabKey>("profile");
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [status, setStatus] = useState<RuntimeStatus | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Profile>(emptyProfile());
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [proxyPort, setProxyPort] = useState<number>(15800);
  const [autoStart, setAutoStart] = useState<boolean>(true);
  const [language, setLanguage] = useState<Locale>("en-US");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const t = useMemo(() => createTranslator(language), [language]);

  const profiles = config?.profiles ?? [];
  const selected = useMemo(
    () => profiles.find((item) => item.id === selectedId),
    [profiles, selectedId]
  );

  const notify = useCallback((type: Toast["type"], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((cur) => [...cur, { id, type, text }]);
    setTimeout(() => {
      setToasts((cur) => cur.filter((t) => t.id !== id));
    }, 2400);
  }, []);

  const load = useCallback(async (forceSyncWithActive = false) => {
    const [cfg, stat, logItems] = await Promise.all([
      invoke<AppConfig>("get_config"),
      invoke<RuntimeStatus>("get_runtime_status"),
      invoke<LogEntry[]>("get_logs", { limit: 200 }),
    ]);

    const isFirstRunLanguage = !cfg.language || !cfg.language.trim();
    const currentLanguage = isFirstRunLanguage
      ? detectSystemLocale()
      : normalizeLocale(cfg.language);

    if (isFirstRunLanguage) {
      await invoke("update_language", { language: currentLanguage });
    }

    setConfig(cfg);
    setStatus(stat);
    setLogs(logItems);
    setLanguage(currentLanguage);
    setProxyPort(cfg.proxy_port);
    setAutoStart(cfg.auto_start);
    setSelectedId((current) => {
      if (forceSyncWithActive) {
        return cfg.active_profile_id ?? cfg.profiles[0]?.id ?? null;
      }
      return current ?? cfg.active_profile_id ?? cfg.profiles[0]?.id ?? null;
    });
  }, []);

  async function refreshLogs() {
    const items = await invoke<LogEntry[]>("get_logs", { limit: 200 });
    setLogs(items);
  }

  async function clearLogs() {
    await invoke("clear_logs");
    await refreshLogs();
  }

  useEffect(() => {
    void load().catch((error) =>
      notify("error", `Failed to load config: ${String(error)}`)
    );
  }, [load, notify]);

  useEffect(() => {
    const unlisten = listen("proxy-state-changed", () => {
      void load(true);
    });
    return () => {
      void unlisten.then((fn) => fn());
    };
  }, [load]);

  useEffect(() => {
    const isWindows = navigator.userAgent.toLowerCase().includes("windows");
    document.documentElement.classList.toggle("platform-windows", isWindows);
    return () => {
      document.documentElement.classList.remove("platform-windows");
    };
  }, []);

  useEffect(() => {
    if (selected) setEditing(selected);
  }, [selected]);

  async function saveProfile() {
    try {
      const saved = await invoke<Profile>("upsert_profile", { profile: editing });
      setSelectedId(saved.id);
      await load();
      notify("success", t("toast.profileSaved"));
    } catch (error) {
      notify("error", t("toast.profileSaveFailed", { error: String(error) }));
    }
  }

  async function activateProfile() {
    if (!editing.id) return;
    try {
      await invoke("set_active_profile", { profileId: editing.id });
      await load(true);
      notify("success", t("toast.profileActivated"));
    } catch (error) {
      notify("error", t("toast.profileActivateFailed", { error: String(error) }));
      await refreshLogs();
    }
  }

  async function deleteProfile() {
    if (!editing.id) return;
    try {
      await invoke("delete_profile", { profileId: editing.id });
      setEditing(emptyProfile());
      setSelectedId(null);
      await load();
      notify("success", t("toast.profileDeleted"));
    } catch (error) {
      notify("error", t("toast.profileDeleteFailed", { error: String(error) }));
    }
  }

  async function startProxy() {
    try {
      await invoke("start_proxy");
      await load();
      notify("success", t("toast.proxyStarted"));
    } catch (error) {
      notify("error", t("toast.proxyStartFailed", { error: String(error) }));
    }
  }

  async function stopProxy() {
    try {
      await invoke("stop_proxy");
      await load();
      notify("success", t("toast.proxyStopped"));
    } catch (error) {
      notify("error", t("toast.proxyStopFailed", { error: String(error) }));
    }
  }

  async function saveRuntimeSettings() {
    try {
      await invoke("update_runtime_settings", { proxyPort, autoStart });
      await load();
      notify("success", t("toast.runtimeSaved"));
    } catch (error) {
      notify("error", t("toast.runtimeSaveFailed", { error: String(error) }));
    }
  }

  function closeWindow() {
    void appWindow.close();
  }

  function minimizeWindow() {
    void appWindow.minimize();
  }

  function startWindowDrag(event: MouseEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    void appWindow.startDragging();
  }

  async function saveSettings() {
    try {
      await invoke("update_language", { language });
      await load();
      notify("success", t("toast.settingsSaved"));
    } catch (error) {
      notify("error", t("toast.settingsSaveFailed", { error: String(error) }));
    }
  }

  return (
    <div className="app-shell h-full w-full flex flex-col">
      {/* Custom title bar */}
      <div className="titlebar">
        <div className="titlebar-controls" aria-label="window controls">
          <button
            type="button"
            className="titlebar-control close"
            aria-label={t("window.close")}
            onClick={closeWindow}
          />
          <button
            type="button"
            className="titlebar-control minimize"
            aria-label={t("window.minimize")}
            onClick={minimizeWindow}
          />
        </div>

        <div data-tauri-drag-region className="titlebar-drag" onMouseDown={startWindowDrag}>
          <span className="titlebar-title">Claude Desktop Proxy</span>
        </div>

        <div className="titlebar-spacer" aria-hidden="true" />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-auto thin-scroll px-4 pb-3">
        <div className="mx-auto w-full max-w-[860px]">
          {/* Icon nav bar */}
          <nav className="px-4 py-2 flex items-center justify-center gap-1 mb-3">
            {TAB_META.map((tabItem) => (
              <button
                key={tabItem.key}
                type="button"
                className={`nav-tab ${tab === tabItem.key ? "active" : ""}`}
                onClick={() => setTab(tabItem.key)}
              >
                <span className="nav-icon">{tabItem.icon}</span>
                <span>{t(`tab.${tabItem.key}`)}</span>
              </button>
            ))}
          </nav>

          {/* Content */}
          <main>
            {tab === "profile" && (
              <>
                <ProfileSelector
                  profiles={profiles}
                  selectedId={selectedId}
                  activeProfileId={config?.active_profile_id}
                  onSelectProfile={setSelectedId}
                  onNewProfile={() => {
                    setSelectedId(null);
                    setEditing(emptyProfile());
                  }}
                  onSave={() => void saveProfile()}
                  onActivate={() => void activateProfile()}
                  onDelete={() => void deleteProfile()}
                  canMutate={!!editing.id}
                  t={t}
                />
                <ConfigForm editing={editing} onUpdate={setEditing} section="basic" t={t} />
                <ConfigForm editing={editing} onUpdate={setEditing} section="models" t={t} />
              </>
            )}

            {tab === "runtime" && (
              <RuntimeSettings
                status={status}
                proxyPort={proxyPort}
                autoStart={autoStart}
                onPortChange={setProxyPort}
                onAutoStartChange={setAutoStart}
                onStartProxy={() => void startProxy()}
                onStopProxy={() => void stopProxy()}
                onSaveSettings={() => void saveRuntimeSettings()}
                t={t}
              />
            )}

            {tab === "settings" && (
              <SettingsPanel
                language={language}
                onLanguageChange={setLanguage}
                onSaveSettings={() => void saveSettings()}
                t={t}
              />
            )}

            {tab === "logs" && (
              <DebugLogs
                logs={logs}
                onRefresh={() => void refreshLogs()}
                onClear={() => void clearLogs()}
                locale={language}
                t={t}
              />
            )}
          </main>
        </div>
      </div>

      {/* Toast stack */}
      {toasts.length > 0 && (
        <div className="toast-stack">
          {toasts.map((t) => (
            <div key={t.id} className={`toast-item ${t.type}`}>
              {t.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
