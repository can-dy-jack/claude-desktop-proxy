import type { RuntimeStatus } from "../types";
import type { Locale, Translate } from "../i18n";
import { PrefRow, Section, Select, ShortcutInput, Slider, Switch } from "./ui";

interface RuntimeSettingsProps {
  status: RuntimeStatus | null;
  proxyPort: number;
  autoStart: boolean;
  onPortChange: (value: number) => void;
  onAutoStartChange: (checked: boolean) => void;
  onStartProxy: () => void;
  onStopProxy: () => void;
  onSaveSettings: () => void;
  language: Locale;
  onLanguageChange: (locale: Locale) => void;
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
  language,
  onLanguageChange,
  t,
}: RuntimeSettingsProps) {
  const running = !!status?.running;
  const languageOptions: { value: Locale; label: string }[] = [
    { value: "zh-CN", label: t("runtime.languageOptionZh") },
    { value: "en-US", label: t("runtime.languageOptionEn") },
  ];

  return (
    <>
      <Section title={t("runtime.proxyStatus")}>
        <PrefRow label={t("runtime.status")}>
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
              {running ? t("runtime.running") : t("runtime.stopped")}
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
        <PrefRow label={t("runtime.language")}>
          <Select
            value={language}
            options={languageOptions}
            onChange={onLanguageChange}
            width={200}
          />
        </PrefRow>
        <PrefRow
          label={t("runtime.shortcut")}
          hint={t("runtime.shortcutHint")}
        >
          <ShortcutInput
            modifiers={["⌥ Option", "⇧ Shift"]}
            keyName="K"
            placeholder={t("common.notSet")}
          />
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
