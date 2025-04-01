export interface ActionConfig {
  selector: string;
  action: 'mermaid-render' | 'html-to-markdown';
  name?: string;  // 动作名称
  description?: string;  // 动作描述
}

export interface RuleConfig {
  urlPattern: string;
  actions: ActionConfig[];
}

export type ConfigData = RuleConfig[];

export interface ConfigState {
  data: ConfigData;
  lastUpdated: number;
  error?: string;
} 