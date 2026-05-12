import type { Profile } from "../types";
import type { Translate } from "../i18n";
import { PrefRow, Section, Select } from "./ui";

interface ProfileSelectorProps {
  profiles: Profile[];
  selectedId: string | null;
  activeProfileId?: string;
  onSelectProfile: (id: string) => void;
  onNewProfile: () => void;
  onActivate: () => void;
  onDelete: () => void;
  onSave: () => void;
  canMutate: boolean;
  t: Translate;
}

export default function ProfileSelector({
  profiles,
  selectedId,
  activeProfileId,
  onSelectProfile,
  onNewProfile,
  onActivate,
  onDelete,
  onSave,
  canMutate,
  t,
}: ProfileSelectorProps) {
  const selectedProfile = profiles.find((p) => p.id === selectedId) ?? null;
  const selectedIsActive =
    !!selectedProfile && selectedProfile.id === activeProfileId;

  const options = profiles.map((p) => ({
    value: p.id,
    label: p.name || t("profile.unnamed"),
  }));

  return (
    <Section title={t("profile.section")}>
      <PrefRow label={t("profile.current")}>
        <div className="flex items-center gap-2 flex-wrap">
          {profiles.length > 0 ? (
            <Select
              value={selectedId ?? ""}
              options={options}
              onChange={(v) => onSelectProfile(v)}
              placeholder={t("profile.select")}
              width={260}
            />
          ) : (
            <span className="text-[12.5px] text-neutral-500">{t("profile.empty")}</span>
          )}
          {selectedIsActive && (
            <span className="active-tag" aria-label={t("profile.activeAria")}>
              {t("profile.active")}
            </span>
          )}
          <button className="mac-btn" type="button" onClick={onNewProfile}>
            {t("profile.new")}
          </button>
        </div>
      </PrefRow>
      <PrefRow label={t("profile.actions")}>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            className="mac-btn mac-btn-primary"
            onClick={onSave}
          >
            {t("profile.save")}
          </button>
          <button
            type="button"
            className="mac-btn"
            onClick={onActivate}
            disabled={!canMutate}
          >
            {t("profile.activate")}
          </button>
          <button
            type="button"
            className="mac-btn mac-btn-danger"
            onClick={onDelete}
            disabled={!canMutate}
          >
            {t("profile.delete")}
          </button>
        </div>
      </PrefRow>
    </Section>
  );
}
