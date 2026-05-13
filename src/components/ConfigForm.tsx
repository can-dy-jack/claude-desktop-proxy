import type { Profile } from "../types";
import type { Translate } from "../i18n";
import { useState } from "react";
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
  const [showApiKey, setShowApiKey] = useState(false);

  function renderClearButton(onClear: () => void, disabled: boolean) {
    return (
      <button
        type="button"
        className="text-neutral-500 hover:text-neutral-700 disabled:opacity-35 disabled:cursor-default"
        onClick={onClear}
        disabled={disabled}
        aria-label={t("config.clearInput")}
        title={t("config.clearInput")}
      >
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M5 5l10 10M15 5L5 15" />
        </svg>
      </button>
    );
  }

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
        <div className="relative w-full max-w-[360px]">
          <input
            className="mac-input pr-7"
            value={editing.name}
            onChange={(e) => onUpdate({ ...editing, name: e.target.value })}
            placeholder={t("config.namePlaceholder")}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {renderClearButton(() => onUpdate({ ...editing, name: "" }), !editing.name)}
          </div>
        </div>
      </PrefRow>
      <PrefRow label={t("config.providerBaseUrl")}>
        <div className="relative w-full max-w-[420px]">
          <input
            className="mac-input pr-7 font-mono"
            value={editing.provider_base_url}
            onChange={(e) =>
              onUpdate({ ...editing, provider_base_url: e.target.value })
            }
            placeholder="https://api.example.com"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {renderClearButton(
              () => onUpdate({ ...editing, provider_base_url: "" }),
              !editing.provider_base_url
            )}
          </div>
        </div>
      </PrefRow>
      <PrefRow label={t("config.apiKey")}>
        <div className="relative w-full max-w-[420px]">
          <input
            type={showApiKey ? "text" : "password"}
            className="mac-input pr-14 font-mono"
            value={editing.api_key}
            onChange={(e) => onUpdate({ ...editing, api_key: e.target.value })}
            placeholder="sk-..."
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button
              type="button"
              className="text-neutral-500 hover:text-neutral-700"
              onClick={() => setShowApiKey((v) => !v)}
              aria-label={showApiKey ? t("config.hideSecret") : t("config.showSecret")}
              title={showApiKey ? t("config.hideSecret") : t("config.showSecret")}
            >
              {showApiKey ? (
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" />
                  <circle cx="12" cy="12" r="2.8" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" />
                  <circle cx="12" cy="12" r="2.8" />
                  <path d="M4 4l16 16" />
                </svg>
              )}
            </button>
            {renderClearButton(
              () => onUpdate({ ...editing, api_key: "" }),
              !editing.api_key
            )}
          </div>
        </div>
      </PrefRow>
      <PrefRow label={t("config.gatewayToken")} hint={t("config.gatewayTokenHint")}>
        <div className="relative w-full max-w-[420px]">
          <input
            className="mac-input pr-7 font-mono"
            value={editing.gateway_token}
            onChange={(e) =>
              onUpdate({ ...editing, gateway_token: e.target.value })
            }
            placeholder="cdp-..."
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {renderClearButton(
              () => onUpdate({ ...editing, gateway_token: "" }),
              !editing.gateway_token
            )}
          </div>
        </div>
      </PrefRow>
    </Section>
  );
}
