import type { Locale, Translate } from "../i18n";
import { PrefRow, Section, Select, ShortcutInput } from "./ui";

interface SettingsPanelProps {
  language: Locale;
  onLanguageChange: (locale: Locale) => void;
  onSaveSettings: () => void;
  t: Translate;
}

export default function SettingsPanel({
  language,
  onLanguageChange,
  onSaveSettings,
  t,
}: SettingsPanelProps) {
  const languageOptions: { value: Locale; label: string }[] = [
    { value: "zh-CN", label: t("settings.languageOptionZh") },
    { value: "en-US", label: t("settings.languageOptionEn") },
  ];

  return (
    <>
      <Section title={t("settings.title")}>
        <PrefRow label={t("settings.language")}>
          <Select
            value={language}
            options={languageOptions}
            onChange={onLanguageChange}
            width={220}
          />
        </PrefRow>
        <PrefRow
          label={t("settings.shortcut")}
          hint={t("settings.shortcutHint")}
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
            {t("settings.save")}
          </button>
        </PrefRow>
      </Section>
    </>
  );
}
