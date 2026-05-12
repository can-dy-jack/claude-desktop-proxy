import type { LogEntry } from "../types";
import type { Locale, Translate } from "../i18n";
import { Section } from "./ui";

interface DebugLogsProps {
  logs: LogEntry[];
  onRefresh: () => void;
  onClear: () => void;
  locale: Locale;
  t: Translate;
}

const LEVEL_COLOR: Record<string, string> = {
  error: "text-red-400",
  warn: "text-amber-400",
  info: "text-sky-400",
  debug: "text-emerald-400",
};

export default function DebugLogs({
  logs,
  onRefresh,
  onClear,
  locale,
  t,
}: DebugLogsProps) {
  return (
    <Section
      title={t("logs.title")}
      actions={
        <div className="flex items-center gap-2">
          <button className="mac-btn" type="button" onClick={onRefresh}>
            {t("logs.refresh")}
          </button>
          <button className="mac-btn" type="button" onClick={onClear}>
            {t("logs.clear")}
          </button>
        </div>
      }
    >
      <div className="rounded-lg bg-[#1c1c1e] text-neutral-200 font-mono text-[12px] leading-relaxed p-3 max-h-[340px] overflow-auto thin-scroll">
        {logs.length === 0 ? (
          <div className="text-neutral-500 text-center py-6">{t("logs.empty")}</div>
        ) : (
          logs.map((entry, index) => (
            <div key={`${entry.ts_ms}-${index}`} className="whitespace-pre-wrap">
              <span className="text-neutral-500">
                {new Date(entry.ts_ms).toLocaleTimeString(locale)}
              </span>{" "}
              <span
                className={`font-semibold ${
                  LEVEL_COLOR[entry.level] ?? "text-neutral-400"
                }`}
              >
                {entry.level.toUpperCase()}
              </span>{" "}
              <span className="text-neutral-500">[{entry.source}]</span>{" "}
              <span>{entry.message}</span>
            </div>
          ))
        )}
      </div>
    </Section>
  );
}
