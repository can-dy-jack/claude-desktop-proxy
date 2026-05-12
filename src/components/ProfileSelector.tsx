import type { Profile } from "../types";
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
}: ProfileSelectorProps) {
  const options = profiles.map((p) => ({
    value: p.id,
    label: `${p.name || "未命名配置"}${p.id === activeProfileId ? "  · 生效中" : ""}`,
  }));

  return (
    <Section title="配置组">
      <PrefRow label="当前配置">
        <div className="flex items-center gap-2 flex-wrap">
          {profiles.length > 0 ? (
            <Select
              value={selectedId ?? ""}
              options={options}
              onChange={(v) => onSelectProfile(v)}
              placeholder="选择配置组"
              width={260}
            />
          ) : (
            <span className="text-[12.5px] text-neutral-500">暂无配置，请新建。</span>
          )}
          <button className="mac-btn" type="button" onClick={onNewProfile}>
            + 新建
          </button>
        </div>
      </PrefRow>
      <PrefRow label="操作">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            className="mac-btn mac-btn-primary"
            onClick={onSave}
          >
            保存
          </button>
          <button
            type="button"
            className="mac-btn"
            onClick={onActivate}
            disabled={!canMutate}
          >
            设为生效
          </button>
          <button
            type="button"
            className="mac-btn mac-btn-danger"
            onClick={onDelete}
            disabled={!canMutate}
          >
            删除
          </button>
        </div>
      </PrefRow>
    </Section>
  );
}
