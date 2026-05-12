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
} from "./components";
import type { AppConfig, LogEntry, Profile, RuntimeStatus } from "./types";

type TabKey = "profile" | "runtime" | "logs";

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
  model_mappings: [{ claude_id: "sonnet-4-6", upstream_id: "" }],
});

const TABS: { key: TabKey; label: string; icon: JSX.Element }[] = [
  {
    key: "profile",
    label: "配置",
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
    label: "运行",
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M10 8l6 4-6 4V8z" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    key: "logs",
    label: "日志",
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
  const [toasts, setToasts] = useState<Toast[]>([]);

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

  const load = useCallback(async () => {
    const [cfg, stat, logItems] = await Promise.all([
      invoke<AppConfig>("get_config"),
      invoke<RuntimeStatus>("get_runtime_status"),
      invoke<LogEntry[]>("get_logs", { limit: 200 }),
    ]);
    setConfig(cfg);
    setStatus(stat);
    setLogs(logItems);
    setProxyPort(cfg.proxy_port);
    setAutoStart(cfg.auto_start);
    setSelectedId((current) => current ?? cfg.active_profile_id ?? cfg.profiles[0]?.id ?? null);
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
    void load().catch((error) => notify("error", `加载配置失败: ${String(error)}`));
  }, [load, notify]);

  useEffect(() => {
    const unlisten = listen("proxy-state-changed", () => {
      void load();
    });
    return () => {
      void unlisten.then((fn) => fn());
    };
  }, [load]);

  useEffect(() => {
    if (selected) setEditing(selected);
  }, [selected]);

  async function saveProfile() {
    try {
      const saved = await invoke<Profile>("upsert_profile", { profile: editing });
      setSelectedId(saved.id);
      await load();
      notify("success", "配置已保存");
    } catch (error) {
      notify("error", `保存失败: ${String(error)}`);
    }
  }

  async function activateProfile() {
    if (!editing.id) return;
    try {
      await invoke("set_active_profile", { profileId: editing.id });
      await load();
      notify("success", "已切换当前生效配置");
    } catch (error) {
      notify("error", `生效失败: ${String(error)}`);
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
      notify("success", "配置已删除");
    } catch (error) {
      notify("error", `删除失败: ${String(error)}`);
    }
  }

  async function startProxy() {
    try {
      await invoke("start_proxy");
      await load();
      notify("success", "代理已启动");
    } catch (error) {
      notify("error", `启动失败: ${String(error)}`);
    }
  }

  async function stopProxy() {
    try {
      await invoke("stop_proxy");
      await load();
      notify("success", "代理已停止");
    } catch (error) {
      notify("error", `停止失败: ${String(error)}`);
    }
  }

  async function saveRuntimeSettings() {
    try {
      await invoke("update_runtime_settings", { proxyPort, autoStart });
      await load();
      notify("success", "运行设置已更新");
    } catch (error) {
      notify("error", `保存运行设置失败: ${String(error)}`);
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

  return (
    <div className="app-shell h-full w-full flex flex-col">
      {/* Custom title bar */}
      <div className="titlebar">
        <div className="titlebar-controls" aria-label="window controls">
          <button
            type="button"
            className="titlebar-control close"
            aria-label="关闭窗口"
            onClick={closeWindow}
          />
          <button
            type="button"
            className="titlebar-control minimize"
            aria-label="最小化窗口"
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
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                className={`nav-tab ${tab === t.key ? "active" : ""}`}
                onClick={() => setTab(t.key)}
              >
                <span className="nav-icon">{t.icon}</span>
                <span>{t.label}</span>
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
                />
                <ConfigForm editing={editing} onUpdate={setEditing} section="basic" />
                <ConfigForm editing={editing} onUpdate={setEditing} section="models" />
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
              />
            )}

            {tab === "logs" && (
              <DebugLogs
                logs={logs}
                onRefresh={() => void refreshLogs()}
                onClear={() => void clearLogs()}
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
