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
  function updateModel(index: number, value: string) {
    onUpdate({
      ...editing,
      model_mappings: editing.model_mappings.map((mapping, current) =>
        current === index ? { ...mapping, claude_id: value, upstream_id: "" } : mapping
      ),
    });
  }

  function removeModel(index: number) {
    onUpdate({
      ...editing,
      model_mappings:
        editing.model_mappings.length <= 1
          ? editing.model_mappings
          : editing.model_mappings.filter((_, current) => current !== index),
    });
  }

  function addModel() {
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
        title="模型列表"
        actions={
          <button className="mac-btn" onClick={addModel} type="button">
            + 新增
          </button>
        }
      >
        <div className="text-[11.5px] text-neutral-500 mb-2">
          这里只维护可用模型列表，代理会自动处理 claude- 前缀。
        </div>
        <PrefRow label="模型列表" align="start">
          <div className="space-y-2">
            {editing.model_mappings.map((mapping, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  className="mac-input max-w-[420px] font-mono"
                  value={mapping.claude_id || mapping.upstream_id}
                  onChange={(e) => updateModel(index, e.target.value)}
                  placeholder="例如：sonnet-4-6"
                />
                <button
                  type="button"
                  className="mac-btn mac-btn-danger px-2"
                  onClick={() => removeModel(index)}
                  aria-label="删除"
                >
                  ✕
                </button>
              </div>
            ))}
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
