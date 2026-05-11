export type ModelMapping = {
  claude_id: string;
  upstream_id: string;
  display_name?: string;
  supports_1m?: boolean;
};

export type Profile = {
  id: string;
  name: string;
  provider_base_url: string;
  api_key: string;
  gateway_token: string;
  model_mappings: ModelMapping[];
};

export type AppConfig = {
  active_profile_id?: string;
  proxy_port: number;
  auto_start: boolean;
  profiles: Profile[];
};

export type RuntimeStatus = {
  running: boolean;
  active_profile_id?: string;
  proxy_port: number;
};

export type LogEntry = {
  ts_ms: number;
  level: string;
  source: string;
  message: string;
};
