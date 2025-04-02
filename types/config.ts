export interface ActionConfig {
  selector: string;
  action: 'mermaid-render' | 'html-to-markdown';
  preSelector?: string;
  background?: string;
  name?: string;
  description?: string;
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