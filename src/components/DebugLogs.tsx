import type { LogEntry } from "../types";
import { Section } from "./ui";

interface DebugLogsProps {
  logs: LogEntry[];
  onRefresh: () => void;
  onClear: () => void;
}

const LEVEL_COLOR: Record<string, string> = {
  error: "text-red-400",
  warn: "text-amber-400",
  info: "text-sky-400",
  debug: "text-emerald-400",
};

export default function DebugLogs({ logs, onRefresh, onClear }: DebugLogsProps) {
  return (
    <Section
      title="调试日志"
      actions={
        <div className="flex items-center gap-2">
          <button className="mac-btn" type="button" onClick={onRefresh}>
            刷新
          </button>
          <button className="mac-btn" type="button" onClick={onClear}>
            清空
          </button>
        </div>
      }
    >
      <div className="rounded-lg bg-[#1c1c1e] text-neutral-200 font-mono text-[12px] leading-relaxed p-3 max-h-[340px] overflow-auto thin-scroll">
        {logs.length === 0 ? (
          <div className="text-neutral-500 text-center py-6">暂无日志</div>
        ) : (
          logs.map((entry, index) => (
            <div key={`${entry.ts_ms}-${index}`} className="whitespace-pre-wrap">
              <span className="text-neutral-500">
                {new Date(entry.ts_ms).toLocaleTimeString()}
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
