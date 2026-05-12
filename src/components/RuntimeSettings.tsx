import type { RuntimeStatus } from "../types";
import { PrefRow, Section, ShortcutInput, Slider, Switch } from "./ui";

interface RuntimeSettingsProps {
  status: RuntimeStatus | null;
  proxyPort: number;
  autoStart: boolean;
  onPortChange: (value: number) => void;
  onAutoStartChange: (checked: boolean) => void;
  onStartProxy: () => void;
  onStopProxy: () => void;
  onSaveSettings: () => void;
}

export default function RuntimeSettings({
  status,
  proxyPort,
  autoStart,
  onPortChange,
  onAutoStartChange,
  onStartProxy,
  onStopProxy,
  onSaveSettings,
}: RuntimeSettingsProps) {
  const running = !!status?.running;
  return (
    <>
      <Section title="代理状态">
        <PrefRow label="状态">
          <div className="flex items-center gap-3">
            <span
              className={`status-pill ${
                running
                  ? "bg-emerald-500/15 text-emerald-700"
                  : "bg-neutral-500/15 text-neutral-600"
              }`}
            >
              <span
                className={`status-dot ${
                  running ? "bg-emerald-500" : "bg-neutral-400"
                }`}
              />
              {running ? "运行中" : "已停止"}
            </span>
            <span className="text-[12px] text-neutral-500 tabular-nums">
              端口 {status?.proxy_port ?? "-"}
            </span>
          </div>
        </PrefRow>
        <PrefRow label="操作">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="mac-btn mac-btn-primary"
              onClick={onStartProxy}
              disabled={running}
            >
              启动
            </button>
            <button
              type="button"
              className="mac-btn"
              onClick={onStopProxy}
              disabled={!running}
            >
              停止
            </button>
          </div>
        </PrefRow>
      </Section>

      <Section title="运行参数">
        <PrefRow label="代理端口" hint="范围 1024 – 65535，建议保留默认值。">
          <Slider
            value={proxyPort}
            min={1024}
            max={65535}
            onChange={onPortChange}
            unit=""
            width={260}
          />
        </PrefRow>
        <PrefRow label="启动行为">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <Switch checked={autoStart} onChange={onAutoStartChange} />
            <span className="text-[13px]">应用启动时自动启动代理</span>
          </label>
        </PrefRow>
        <PrefRow
          label="全局快捷键"
          hint="预留：用于唤起本设置窗口（暂未实现绑定）。"
        >
          <ShortcutInput modifiers={["⌥ Option", "⇧ Shift"]} keyName="K" />
        </PrefRow>
        <PrefRow label="">
          <button
            type="button"
            className="mac-btn mac-btn-primary"
            onClick={onSaveSettings}
          >
            保存运行设置
          </button>
        </PrefRow>
      </Section>

      <Section title="Claude Desktop 配置提示">
        <PrefRow label="Gateway Base URL">
          <code className="font-mono text-[12.5px] text-neutral-700 bg-black/[0.04] px-2 py-0.5 rounded">
            http://127.0.0.1:{proxyPort}
          </code>
        </PrefRow>
        <PrefRow label="Gateway API Key">
          <span className="text-[12.5px] text-neutral-600">
            使用当前生效配置的 <span className="font-mono">Gateway Token</span>
          </span>
        </PrefRow>
      </Section>
    </>
  );
}
