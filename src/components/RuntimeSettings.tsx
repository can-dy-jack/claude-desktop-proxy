import type { RuntimeStatus } from "../types";
import type { Translate } from "../i18n";
import { PrefRow, Section, Slider, Switch } from "./ui";

interface RuntimeSettingsProps {
  status: RuntimeStatus | null;
  proxyPort: number;
  autoStart: boolean;
  onPortChange: (value: number) => void;
  onAutoStartChange: (checked: boolean) => void;
  onStartProxy: () => void;
  onStopProxy: () => void;
  onSaveSettings: () => void;
  t: Translate;
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
  t,
}: RuntimeSettingsProps) {
  const running = !!status?.running;
  const statusHint = running
    ? t("runtime.statusHintRunning")
    : t("runtime.statusHintStopped");

  return (
    <>
      <Section title={t("runtime.proxyStatus")}>
        <PrefRow label={t("runtime.status")}>
          <div className="flex items-center gap-3">
            <span
              className={`status-pill ${
                running
                  ? "bg-emerald-500/15 text-emerald-700"
                  : "bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/30"
              }`}
            >
              <span
                className={`status-dot ${
                  running ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              {running ? t("runtime.running") : t("runtime.stopped")}
            </span>
            <span
              className={`text-[12px] ${
                running ? "text-emerald-700/80" : "text-red-600"
              }`}
            >
              {statusHint}
            </span>
            <span className="text-[12px] text-neutral-500 tabular-nums">
              {t("runtime.port", { port: status?.proxy_port ?? "-" })}
            </span>
          </div>
        </PrefRow>
        <PrefRow label={t("runtime.actions")}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="mac-btn mac-btn-primary"
              onClick={onStartProxy}
              disabled={running}
            >
              {t("runtime.start")}
            </button>
            <button
              type="button"
              className="mac-btn"
              onClick={onStopProxy}
              disabled={!running}
            >
              {t("runtime.stop")}
            </button>
          </div>
        </PrefRow>
      </Section>

      <Section title={t("runtime.params")}>
        <PrefRow label={t("runtime.proxyPort")} hint={t("runtime.proxyPortHint")}>
          <Slider
            value={proxyPort}
            min={1024}
            max={65535}
            onChange={onPortChange}
            unit=""
            width={260}
          />
        </PrefRow>
        <PrefRow label={t("runtime.startBehavior")}>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <Switch checked={autoStart} onChange={onAutoStartChange} />
            <span className="text-[13px]">{t("runtime.autoStart")}</span>
          </label>
        </PrefRow>
        <PrefRow label="">
          <button
            type="button"
            className="mac-btn mac-btn-primary"
            onClick={onSaveSettings}
          >
            {t("runtime.save")}
          </button>
        </PrefRow>
      </Section>

      <Section title={t("runtime.claudeHint")}>
        <PrefRow label={t("runtime.gatewayBaseUrl")}>
          <code className="font-mono text-[12.5px] text-neutral-700 bg-black/[0.04] px-2 py-0.5 rounded">
            http://127.0.0.1:{proxyPort}
          </code>
        </PrefRow>
        <PrefRow label={t("runtime.gatewayApiKey")}>
          <span className="text-[12.5px] text-neutral-600">
            {t("runtime.gatewayApiKeyHelp")} <span className="font-mono">Gateway Token</span>
          </span>
        </PrefRow>
      </Section>
    </>
  );
}
