import type { Profile } from "../types";
import type { Translate } from "../i18n";
import { PrefRow, Section } from "./ui";

interface ConfigFormProps {
  editing: Profile;
  onUpdate: (profile: Profile) => void;
  section?: "basic" | "models";
  t: Translate;
}

export default function ConfigForm({
  editing,
  onUpdate,
  section = "basic",
  t,
}: ConfigFormProps) {
  function updateClaudeModel(index: number, value: string) {
    onUpdate({
      ...editing,
      model_mappings: editing.model_mappings.map((mapping, current) =>
        current === index ? { ...mapping, claude_id: value } : mapping
      ),
    });
  }

  function updateUpstreamModel(index: number, value: string) {
    onUpdate({
      ...editing,
      model_mappings: editing.model_mappings.map((mapping, current) =>
        current === index ? { ...mapping, upstream_id: value } : mapping
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
        title={t("config.models")}
        actions={
          <button className="mac-btn" onClick={addModel} type="button">
            {t("config.modelsAdd")}
          </button>
        }
      >
        <div className="text-[11.5px] text-neutral-500 mb-2">
          {t("config.modelsHelp")}
        </div>
        <PrefRow label={t("config.modelsLabel")} align="start">
          <div className="space-y-2">
            {editing.model_mappings.map((mapping, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  className="mac-input max-w-[260px] font-mono"
                  value={mapping.claude_id}
                  onChange={(e) => updateClaudeModel(index, e.target.value)}
                  placeholder="claude-sonnet-4-6"
                />
                <span className="text-neutral-400">→</span>
                <input
                  className="mac-input max-w-[260px] font-mono"
                  value={mapping.upstream_id}
                  onChange={(e) => updateUpstreamModel(index, e.target.value)}
                  placeholder={t("config.upstreamPlaceholder")}
                />
                <button
                  type="button"
                  className="mac-btn mac-btn-danger px-2"
                  onClick={() => removeModel(index)}
                  aria-label={t("config.modelDeleteAria")}
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
    <Section title={t("config.basic")}>
      <PrefRow label={t("config.name")}>
        <input
          className="mac-input max-w-[360px]"
          value={editing.name}
          onChange={(e) => onUpdate({ ...editing, name: e.target.value })}
          placeholder={t("config.namePlaceholder")}
        />
      </PrefRow>
      <PrefRow label={t("config.providerBaseUrl")}>
        <input
          className="mac-input max-w-[420px] font-mono"
          value={editing.provider_base_url}
          onChange={(e) =>
            onUpdate({ ...editing, provider_base_url: e.target.value })
          }
          placeholder="https://api.example.com"
        />
      </PrefRow>
      <PrefRow label={t("config.apiKey")}>
        <input
          type="password"
          className="mac-input max-w-[420px] font-mono"
          value={editing.api_key}
          onChange={(e) => onUpdate({ ...editing, api_key: e.target.value })}
          placeholder="sk-..."
        />
      </PrefRow>
      <PrefRow label={t("config.gatewayToken")} hint={t("config.gatewayTokenHint")}>
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
