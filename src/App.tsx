import { invoke } from "@tauri-apps/api/core";
import { useEffect, useMemo, useState } from "react";
import {
  App as AntdApp,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Layout,
  List,
  Space,
  Switch,
  Tag
} from "antd";
import {
  DeleteOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ClearOutlined,
  ReloadOutlined,
  SaveOutlined
} from "@ant-design/icons";
import type { AppConfig, LogEntry, Profile, RuntimeStatus } from "./types";

const emptyProfile = (): Profile => ({
  id: "",
  name: "",
  provider_base_url: "",
  api_key: "",
  gateway_token: "",
  model_mappings: [{ claude_id: "sonnet-4-6", upstream_id: "" }]
});

export default function App() {
  const { message } = AntdApp.useApp();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [status, setStatus] = useState<RuntimeStatus | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Profile>(emptyProfile());
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [proxyPort, setProxyPort] = useState<number>(15800);
  const [autoStart, setAutoStart] = useState<boolean>(true);
  const profiles = config?.profiles ?? [];

  const selected = useMemo(
    () => profiles.find((item) => item.id === selectedId),
    [profiles, selectedId]
  );

  async function load() {
    const [cfg, stat, logItems] = await Promise.all([
      invoke<AppConfig>("get_config"),
      invoke<RuntimeStatus>("get_runtime_status"),
      invoke<LogEntry[]>("get_logs", { limit: 200 })
    ]);
    setConfig(cfg);
    setStatus(stat);
    setLogs(logItems);
    setProxyPort(cfg.proxy_port);
    setAutoStart(cfg.auto_start);
    const firstId = cfg.active_profile_id ?? cfg.profiles[0]?.id ?? null;
    setSelectedId(firstId);
  }

  async function refreshLogs() {
    const items = await invoke<LogEntry[]>("get_logs", { limit: 200 });
    setLogs(items);
  }

  async function clearLogs() {
    await invoke("clear_logs");
    await refreshLogs();
  }

  useEffect(() => {
    void load().catch((error) => {
      message.error(`加载配置失败: ${String(error)}`);
    });
  }, []);

  useEffect(() => {
    if (selected) {
      setEditing(selected);
    }
  }, [selected]);

  async function saveProfile() {
    try {
      const saved = await invoke<Profile>("upsert_profile", { profile: editing });
      setSelectedId(saved.id);
      await load();
      message.success("配置已保存");
    } catch (error) {
      message.error(`保存失败: ${String(error)}`);
    }
  }

  async function activateProfile() {
    if (!editing.id) return;
    try {
      await invoke("set_active_profile", { profileId: editing.id });
      await load();
      message.success("已切换当前配置（请在 Claude Desktop 手动配置网关）");
    } catch (error) {
      message.error(`生效失败: ${String(error)}`);
      await refreshLogs();
    }
  }

  async function startProxy() {
    try {
      await invoke("start_proxy");
      await load();
      message.success("代理已启动");
    } catch (error) {
      message.error(`启动失败: ${String(error)}`);
    }
  }

  async function deleteProfile() {
    if (!editing.id) return;
    try {
      await invoke("delete_profile", { profileId: editing.id });
      setEditing(emptyProfile());
      setSelectedId(null);
      await load();
      message.success("配置已删除");
    } catch (error) {
      message.error(`删除失败: ${String(error)}`);
    }
  }

  async function saveRuntimeSettings() {
    try {
      await invoke("update_runtime_settings", {
        proxyPort,
        autoStart
      });
      await load();
      message.success("运行设置已更新");
    } catch (error) {
      message.error(`保存运行设置失败: ${String(error)}`);
    }
  }

  function updateMapping(
    index: number,
    field: "claude_id",
    value: string
  ) {
    setEditing((prev) => ({
      ...prev,
      model_mappings: prev.model_mappings.map((mapping, current) =>
        current === index ? { ...mapping, [field]: value } : mapping
      )
    }));
  }

  function removeMapping(index: number) {
    setEditing((prev) => ({
      ...prev,
      model_mappings:
        prev.model_mappings.length <= 1
          ? prev.model_mappings
          : prev.model_mappings.filter((_, current) => current !== index)
    }));
  }

  function addMapping() {
    setEditing((prev) => ({
      ...prev,
      model_mappings: [
        ...prev.model_mappings,
        { claude_id: "haiku-3-5", upstream_id: "" }
      ]
    }));
  }

  async function stopProxy() {
    try {
      await invoke("stop_proxy");
      await load();
      message.success("代理已停止");
    } catch (error) {
      message.error(`停止失败: ${String(error)}`);
    }
  }

  return (
    <Layout className="app-shell">
      <Layout.Sider className="app-sider" width={230} theme="light">
        <div className="sider-header">
          <div className="sider-title">配置组</div>
        </div>

        <Space style={{ width: "100%", marginBottom: 8 }}>
          <Button
            size="medium"
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedId(null);
              setEditing(emptyProfile());
            }}
          >
            新建
          </Button>
          <Button size="medium" icon={<ReloadOutlined />} onClick={() => void load()}>
            刷新
          </Button>
        </Space>

        <List
          className="profile-list"
          dataSource={profiles}
          locale={{ emptyText: "暂无配置组" }}
          renderItem={(item) => {
            const active = item.id === selectedId;
            return (
              <List.Item
                className={active ? "profile-item active" : "profile-item"}
                onClick={() => setSelectedId(item.id)}
              >
                <Space direction="vertical" size={0}>
                  <strong>{item.name || "未命名配置"}</strong>
                  {config?.active_profile_id === item.id ? <Tag color="green">当前生效</Tag> : null}
                </Space>
              </List.Item>
            );
          }}
        />
      </Layout.Sider>

      <Layout.Content className="app-content">
        <Card size="medium" title="配置" style={{ marginBottom: 10 }}>
          <Form layout="vertical" size="medium">
            <Form.Item label="配置名称">
              <Input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="例如：OpenAI Production"
              />
            </Form.Item>
            <Form.Item label="Provider Base URL">
              <Input
                value={editing.provider_base_url}
                onChange={(e) =>
                  setEditing({ ...editing, provider_base_url: e.target.value })
                }
                placeholder="https://api.example.com"
              />
            </Form.Item>
            <Form.Item label="API Key">
              <Input.Password
                value={editing.api_key}
                onChange={(e) => setEditing({ ...editing, api_key: e.target.value })}
                placeholder="sk-..."
              />
            </Form.Item>
            <Form.Item label="Gateway Token" style={{ marginBottom: 10 }}>
              <Input
                value={editing.gateway_token}
                onChange={(e) =>
                  setEditing({ ...editing, gateway_token: e.target.value })
                }
                placeholder="留空会自动生成"
              />
            </Form.Item>

            <Form.Item label="模型列表（无需 claude- 前缀）" style={{ marginBottom: 10 }}>
              <Space direction="vertical" style={{ width: "100%" }} size={8}>
                {editing.model_mappings.map((mapping, index) => (
                  <Space key={`${index}-${mapping.claude_id}`} style={{ display: "flex" }}>
                    <Input
                      value={mapping.claude_id}
                      onChange={(e) => updateMapping(index, "claude_id", e.target.value)}
                      placeholder="例如：sonnet-4-6（或 claude-sonnet-4-6）"
                    />
                    <Button size="medium" danger icon={<DeleteOutlined />} onClick={() => removeMapping(index)}>
                      删除
                    </Button>
                  </Space>
                ))}
                <Button size="medium" icon={<PlusOutlined />} onClick={addMapping}>
                  新增映射
                </Button>
              </Space>
            </Form.Item>
          </Form>

          <Space wrap size={8}>
            <Button size="medium" type="primary" icon={<SaveOutlined />} onClick={() => void saveProfile()}>
              保存配置
            </Button>
            <Button size="medium" onClick={() => void activateProfile()}>设为生效</Button>
            <Button size="medium" danger onClick={() => void deleteProfile()}>
              删除配置
            </Button>
          </Space>
        </Card>

        <Card size="medium" title="运行" style={{ marginBottom: 8 }}>
          <div style={{ marginBottom: 8, fontSize: 12, color: "#64748b" }}>
            Claude Desktop 请手动配置：Gateway Base URL = http://127.0.0.1:{proxyPort}，模型列表填写 claude-*。
          </div>
          <Space align="center" wrap size={8}>
            <span>状态:</span>
            <Tag color={status?.running ? "success" : "default"}>
              {status?.running ? "运行中" : "已停止"}
            </Tag>
            <span>端口: {status?.proxy_port ?? "-"}</span>
            <Button
              size="medium"
              icon={<PlayCircleOutlined />}
              onClick={() => void startProxy()}
              disabled={status?.running}
            >
              启动代理
            </Button>
            <Button
              size="medium"
              icon={<PauseCircleOutlined />}
              onClick={() => void stopProxy()}
              disabled={!status?.running}
            >
              停止代理
            </Button>
          </Space>

          <Space direction="vertical" size={10} style={{ width: "100%", marginTop: 10 }}>
            <Space>
              <span>代理端口</span>
              <InputNumber
                size="medium"
                min={1}
                max={65535}
                value={proxyPort}
                onChange={(value) => setProxyPort(value ?? 15800)}
              />
            </Space>
            <Space>
              <Switch size="medium" checked={autoStart} onChange={setAutoStart} />
              <span>启动时自动启动代理</span>
            </Space>
            <Button size="medium" onClick={() => void saveRuntimeSettings()}>保存运行设置</Button>
          </Space>
        </Card>

        <Card
          size="medium"
          title="调试日志"
          extra={
            <Space size={8}>
              <Button size="small" icon={<ReloadOutlined />} onClick={() => void refreshLogs()}>
                刷新
              </Button>
              <Button size="small" icon={<ClearOutlined />} onClick={() => void clearLogs()}>
                清空
              </Button>
            </Space>
          }
        >
          <div className="log-panel">
            {logs.length === 0 ? (
              <div className="log-empty">暂无日志，先启动代理并发起一次请求。</div>
            ) : (
              logs.map((entry, index) => (
                <div className="log-line" key={`${entry.ts_ms}-${index}`}>
                  <span className="log-time">{new Date(entry.ts_ms).toLocaleTimeString()}</span>
                  <Tag
                    color={entry.level === "error" ? "error" : entry.level === "warn" ? "warning" : "default"}
                  >
                    {entry.level.toUpperCase()}
                  </Tag>
                  <span className="log-source">[{entry.source}]</span>
                  <span>{entry.message}</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </Layout.Content>
    </Layout>
  );
}
