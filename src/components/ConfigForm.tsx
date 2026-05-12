import type { Profile } from "../types";
import { PrefRow, Section } from "./ui";

interface ConfigFormProps {
  editing: Profile;
  onUpdate: (profile: Profile) => void;
  section?: "basic" | "models";
}

export default function ConfigForm({
  editing,
  onUpdate,
  section = "basic",
}: ConfigFormProps) {
  function updateMapping(
    index: number,
    field: "claude_id" | "upstream_id",
    value: string
  ) {
    onUpdate({
      ...editing,
      model_mappings: editing.model_mappings.map((mapping, current) =>
        current === index ? { ...mapping, [field]: value } : mapping
      ),
    });
  }

  function removeMapping(index: number) {
    onUpdate({
      ...editing,
      model_mappings:
        editing.model_mappings.length <= 1
          ? editing.model_mappings
          : editing.model_mappings.filter((_, current) => current !== index),
    });
  }

  function addMapping() {
    onUpdate({
      ...editing,
      model_mappings: [
        ...editing.model_mappings,
        { claude_id: "", upstream_id: "" },
      ],
    });
  }

  if (section === "models") {
    return (
      <Section
        title="模型映射"
        actions={
          <button className="mac-btn" onClick={addMapping} type="button">
            + 新增
          </button>
        }
      >
        <PrefRow label="模型列表" align="start">
          <div className="space-y-2">
            {editing.model_mappings.map((mapping, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  className="mac-input flex-1 font-mono"
                  value={mapping.claude_id}
                  onChange={(e) => updateMapping(index, "claude_id", e.target.value)}
                  placeholder="例如：sonnet-4-6"
                />
                <span className="text-neutral-400 text-xs">→</span>
                <input
                  className="mac-input flex-1 font-mono"
                  value={mapping.upstream_id}
                  onChange={(e) =>
                    updateMapping(index, "upstream_id", e.target.value)
                  }
                  placeholder="上游模型 ID"
                />
                <button
                  type="button"
                  className="mac-btn mac-btn-danger px-2"
                  onClick={() => removeMapping(index)}
                  aria-label="删除"
                >
                  ✕
                </button>
              </div>
            ))}
            <div className="text-[11.5px] text-neutral-500 pt-1">
              Claude Desktop 调用时模型带{" "}
              <code className="font-mono">claude-</code> 前缀；代理会去除前缀后转发至上游。
            </div>
          </div>
        </PrefRow>
      </Section>
    );
  }

  return (
    <Section title="基本信息">
      <PrefRow label="配置名称">
        <input
          className="mac-input max-w-[360px]"
          value={editing.name}
          onChange={(e) => onUpdate({ ...editing, name: e.target.value })}
          placeholder="例如：OpenAI Production"
        />
      </PrefRow>
      <PrefRow label="Provider Base URL">
        <input
          className="mac-input max-w-[420px] font-mono"
          value={editing.provider_base_url}
          onChange={(e) =>
            onUpdate({ ...editing, provider_base_url: e.target.value })
          }
          placeholder="https://api.example.com"
        />
      </PrefRow>
      <PrefRow label="API Key">
        <input
          type="password"
          className="mac-input max-w-[420px] font-mono"
          value={editing.api_key}
          onChange={(e) => onUpdate({ ...editing, api_key: e.target.value })}
          placeholder="sk-..."
        />
      </PrefRow>
      <PrefRow label="Gateway Token" hint="留空将在保存时自动生成。">
        <input
          className="mac-input max-w-[420px] font-mono"
          value={editing.gateway_token}
          onChange={(e) =>
            onUpdate({ ...editing, gateway_token: e.target.value })
          }
          placeholder="cdp-..."
        />
      </PrefRow>
    </Section>
  );
}
