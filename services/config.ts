import type { ActionConfig, ConfigData, ConfigState } from "../types/config";

// 动作类型的默认名称和描述
export const ACTION_METADATA = {
  'mermaid-render': {
    name: 'Mermaid渲染',
    description: '将文本内容渲染为Mermaid图表'
  },
  'html-to-markdown': {
    name: 'HTML转Markdown',
    description: '右键点击选中的内容，可以复制为Markdown格式'
  }
};

// 配置URL，生产环境应替换为实际URL
const CONFIG_URL =
  process.env.NODE_ENV === "production"
    ? "https://example.com/config.json"
    : "/config.json";
const CONFIG_CACHE_KEY = "deepseek_extension_config";
const CONFIG_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24小时

/**
 * 配置管理服务
 */
class ConfigService {
  private state: ConfigState = {
    data: [],
    lastUpdated: 0,
  };

  constructor() {
    this.loadFromCache();
  }

  /**
   * 从缓存加载配置
   */
  private async loadFromCache(): Promise<void> {
    try {
      const cached = await browser.storage.local.get(CONFIG_CACHE_KEY);
      if (cached[CONFIG_CACHE_KEY]) {
        this.state = JSON.parse(cached[CONFIG_CACHE_KEY]);
        console.log("从缓存加载配置成功", this.state);
      }
    } catch (error) {
      console.error("从缓存加载配置失败", error);
    }
  }

  /**
   * 保存配置到缓存
   */
  private async saveToCache(): Promise<void> {
    try {
      await browser.storage.local.set({
        [CONFIG_CACHE_KEY]: JSON.stringify(this.state),
      });
      console.log("配置已保存到缓存");
    } catch (error) {
      console.error("保存配置到缓存失败", error);
    }
  }

  /**
   * 为动作添加系统定义的元数据
   * 忽略配置文件中的name和description
   */
  private addMetadataToAction(action: ActionConfig): ActionConfig {
    const enrichedAction = { ...action };
    
    // 始终使用系统定义的元数据，忽略配置文件中的name和description
    if (ACTION_METADATA[action.action]) {
      enrichedAction.name = ACTION_METADATA[action.action].name;
      enrichedAction.description = ACTION_METADATA[action.action].description;
    } else {
      // 如果系统中没有定义，使用动作类型作为名称
      enrichedAction.name = action.action;
    }
    
    return enrichedAction;
  }

  /**
   * 从远程获取配置
   */
  async fetchConfig(): Promise<boolean> {
    try {
      this.state.error = undefined;
      const response = await fetch(CONFIG_URL);
      console.log("拉取配置响应状态:", response.status);

      const data = (await response.json()) as ConfigData;
      console.log("获取到原始配置数据:", data);

      // 验证配置数据
      if (!Array.isArray(data)) {
        throw new Error("配置数据格式错误");
      }

      // 完全不使用配置文件中的name和description，始终使用系统定义
      data.forEach(rule => {
        if (Array.isArray(rule.actions)) {
          rule.actions = rule.actions.map(action => this.addMetadataToAction(action));
        }
      });
      
      console.log("处理后的配置数据:", data);

      this.state = {
        data,
        lastUpdated: Date.now(),
      };

      await this.saveToCache();
      return true;
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : "未知错误";
      console.error("拉取配置失败", error);
      return false;
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): ConfigState {
    return this.state;
  }

  /**
   * 检查是否需要更新配置
   */
  shouldUpdate(): boolean {
    return Date.now() - this.state.lastUpdated > CONFIG_CACHE_EXPIRY;
  }

  /**
   * 获取匹配当前URL的规则
   */
  getMatchingRules(url: string): ConfigData {
    if (!this.state.data || !Array.isArray(this.state.data)) {
      console.log("没有可用的配置数据");
      return [];
    }

    // console.log("检查URL匹配:", url);
    // console.log("当前规则:", this.state.data);
    
    const matchingRules = this.state.data.filter((rule) => {
      try {
        // console.log("尝试匹配规则:", rule.urlPattern, "与URL:", url);
        const pattern = new RegExp(rule.urlPattern);
        const matches = pattern.test(url);
        // console.log("匹配结果:", matches);
        return matches;
      } catch (error) {
        console.error("URL匹配规则错误", rule.urlPattern, error);
        return false;
      }
    });
    
    // console.log("匹配的规则:", matchingRules);
    return matchingRules;
  }

  /**
   * 获取所有匹配当前URL的动作
   */
  getMatchingActions(url: string): ActionConfig[] {
    const matchingRules = this.getMatchingRules(url);
    // console.log("matchingRules in getMatchingActions:", matchingRules);
    
    let allActions: ActionConfig[] = [];
    
    for (const rule of matchingRules) {
      if (Array.isArray(rule.actions)) {
        // 始终使用系统定义的元数据，忽略配置文件中的name和description
        const actionsWithMetadata = rule.actions.map(action => this.addMetadataToAction(action));
        allActions = allActions.concat(actionsWithMetadata);
      }
    }
    
    // console.log("匹配的动作:", allActions);
    return allActions;
  }
  
  /**
   * 计算动作数量
   */
  countActions(url: string): number {
    const actions = this.getMatchingActions(url);
    console.log("动作数量:", actions.length, "for URL:", url);
    return actions.length;
  }
}

export const configService = new ConfigService();
