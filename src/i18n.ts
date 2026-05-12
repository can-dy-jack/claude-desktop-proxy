export type Locale = "zh-CN" | "en-US";

export type Translate = (
  key: string,
  vars?: Record<string, string | number>
) => string;

const messages: Record<Locale, Record<string, string>> = {
  "zh-CN": {
    "tab.profile": "配置",
    "tab.runtime": "运行",
    "tab.logs": "日志",
    "window.close": "关闭窗口",
    "window.minimize": "最小化窗口",

    "toast.loadConfigFailed": "加载配置失败: {error}",
    "toast.profileSaved": "配置已保存",
    "toast.profileSaveFailed": "保存失败: {error}",
    "toast.profileActivated": "已切换当前生效配置",
    "toast.profileActivateFailed": "生效失败: {error}",
    "toast.profileDeleted": "配置已删除",
    "toast.profileDeleteFailed": "删除失败: {error}",
    "toast.proxyStarted": "代理已启动",
    "toast.proxyStartFailed": "启动失败: {error}",
    "toast.proxyStopped": "代理已停止",
    "toast.proxyStopFailed": "停止失败: {error}",
    "toast.runtimeSaved": "运行设置已更新",
    "toast.runtimeSaveFailed": "保存运行设置失败: {error}",

    "profile.section": "配置组",
    "profile.current": "当前配置",
    "profile.select": "选择配置组",
    "profile.empty": "暂无配置，请新建。",
    "profile.activeAria": "当前配置已生效",
    "profile.active": "生效中",
    "profile.new": "+ 新建",
    "profile.actions": "操作",
    "profile.save": "保存",
    "profile.activate": "设为生效",
    "profile.delete": "删除",
    "profile.unnamed": "未命名配置",

    "config.basic": "基本信息",
    "config.name": "配置名称",
    "config.namePlaceholder": "例如：OpenAI Production",
    "config.providerBaseUrl": "Provider Base URL",
    "config.apiKey": "API Key",
    "config.gatewayToken": "Gateway Token",
    "config.gatewayTokenHint": "留空将在保存时自动生成。",

    "config.models": "模型映射",
    "config.modelsAdd": "+ 新增",
    "config.modelsHelp": "为每个 Claude 模型设置上游模型 ID。代理转发时将按映射替换 model 字段。",
    "config.modelsLabel": "Claude -> Upstream",
    "config.upstreamPlaceholder": "上游模型 ID",
    "config.modelDeleteAria": "删除",

    "runtime.proxyStatus": "代理状态",
    "runtime.status": "状态",
    "runtime.running": "运行中",
    "runtime.stopped": "已停止",
    "runtime.port": "端口 {port}",
    "runtime.actions": "操作",
    "runtime.start": "启动",
    "runtime.stop": "停止",

    "runtime.params": "运行参数",
    "runtime.proxyPort": "代理端口",
    "runtime.proxyPortHint": "范围 1024 - 65535，建议保留默认值。",
    "runtime.startBehavior": "启动行为",
    "runtime.autoStart": "应用启动时自动启动代理",
    "runtime.shortcut": "全局快捷键",
    "runtime.shortcutHint": "预留：用于唤起本设置窗口（暂未实现绑定）。",
    "runtime.save": "保存运行设置",

    "runtime.language": "界面语言",
    "runtime.languageOptionZh": "中文",
    "runtime.languageOptionEn": "English",

    "runtime.claudeHint": "Claude Desktop 配置提示",
    "runtime.gatewayBaseUrl": "Gateway Base URL",
    "runtime.gatewayApiKey": "Gateway API Key",
    "runtime.gatewayApiKeyHelp": "使用当前生效配置的 Gateway Token",

    "logs.title": "调试日志",
    "logs.refresh": "刷新",
    "logs.clear": "清空",
    "logs.empty": "暂无日志",

    "common.notSet": "未设置"
  },
  "en-US": {
    "tab.profile": "Profile",
    "tab.runtime": "Runtime",
    "tab.logs": "Logs",
    "window.close": "Close window",
    "window.minimize": "Minimize window",

    "toast.loadConfigFailed": "Failed to load config: {error}",
    "toast.profileSaved": "Profile saved",
    "toast.profileSaveFailed": "Failed to save profile: {error}",
    "toast.profileActivated": "Active profile switched",
    "toast.profileActivateFailed": "Failed to activate profile: {error}",
    "toast.profileDeleted": "Profile deleted",
    "toast.profileDeleteFailed": "Failed to delete profile: {error}",
    "toast.proxyStarted": "Proxy started",
    "toast.proxyStartFailed": "Failed to start proxy: {error}",
    "toast.proxyStopped": "Proxy stopped",
    "toast.proxyStopFailed": "Failed to stop proxy: {error}",
    "toast.runtimeSaved": "Runtime settings updated",
    "toast.runtimeSaveFailed": "Failed to save runtime settings: {error}",

    "profile.section": "Profiles",
    "profile.current": "Current profile",
    "profile.select": "Select a profile",
    "profile.empty": "No profiles yet. Create one.",
    "profile.activeAria": "Current profile is active",
    "profile.active": "Active",
    "profile.new": "+ New",
    "profile.actions": "Actions",
    "profile.save": "Save",
    "profile.activate": "Set active",
    "profile.delete": "Delete",
    "profile.unnamed": "Unnamed profile",

    "config.basic": "Basic",
    "config.name": "Profile name",
    "config.namePlaceholder": "e.g. OpenAI Production",
    "config.providerBaseUrl": "Provider Base URL",
    "config.apiKey": "API Key",
    "config.gatewayToken": "Gateway Token",
    "config.gatewayTokenHint": "Leave empty to auto-generate on save.",

    "config.models": "Model Mapping",
    "config.modelsAdd": "+ Add",
    "config.modelsHelp": "Map each Claude model ID to an upstream model ID. Requests will replace the model field using this mapping.",
    "config.modelsLabel": "Claude -> Upstream",
    "config.upstreamPlaceholder": "Upstream model ID",
    "config.modelDeleteAria": "Delete",

    "runtime.proxyStatus": "Proxy Status",
    "runtime.status": "Status",
    "runtime.running": "Running",
    "runtime.stopped": "Stopped",
    "runtime.port": "Port {port}",
    "runtime.actions": "Actions",
    "runtime.start": "Start",
    "runtime.stop": "Stop",

    "runtime.params": "Runtime Settings",
    "runtime.proxyPort": "Proxy Port",
    "runtime.proxyPortHint": "Range 1024 - 65535, keep default unless needed.",
    "runtime.startBehavior": "Startup",
    "runtime.autoStart": "Start proxy automatically when app launches",
    "runtime.shortcut": "Global Shortcut",
    "runtime.shortcutHint": "Reserved for opening this window (binding not implemented yet).",
    "runtime.save": "Save Runtime Settings",

    "runtime.language": "Language",
    "runtime.languageOptionZh": "Chinese",
    "runtime.languageOptionEn": "English",

    "runtime.claudeHint": "Claude Desktop Setup",
    "runtime.gatewayBaseUrl": "Gateway Base URL",
    "runtime.gatewayApiKey": "Gateway API Key",
    "runtime.gatewayApiKeyHelp": "Use the Gateway Token of the active profile",

    "logs.title": "Debug Logs",
    "logs.refresh": "Refresh",
    "logs.clear": "Clear",
    "logs.empty": "No logs",

    "common.notSet": "Not set"
  }
};

export function normalizeLocale(input: string | undefined | null): Locale {
  const normalized = (input ?? "").toLowerCase();
  if (normalized.startsWith("zh")) {
    return "zh-CN";
  }
  return "en-US";
}

export function detectSystemLocale(): Locale {
  if (typeof navigator === "undefined") {
    return "en-US";
  }
  const language = navigator.languages?.[0] ?? navigator.language;
  return normalizeLocale(language);
}

export function createTranslator(locale: Locale): Translate {
  return (key, vars) => {
    const template = messages[locale][key] ?? messages["en-US"][key] ?? key;
    if (!vars) {
      return template;
    }
    return Object.entries(vars).reduce((text, [name, value]) => {
      return text.split(`{${name}}`).join(String(value));
    }, template);
  };
}
