import type { ActionConfig } from '../types/config'
import { MermaidService } from './mermaid'

/**
 * 动作执行器服务
 */
export class ActionExecutor {
  private static instance: ActionExecutor

  private constructor() {}

  public static getInstance(): ActionExecutor {
    if (!ActionExecutor.instance) {
      ActionExecutor.instance = new ActionExecutor()
    }
    return ActionExecutor.instance
  }

  /**
   * 执行指定动作
   */
  public async executeAction(actionConfig: ActionConfig): Promise<void> {
    const { action: actionType, preSelector } = actionConfig

    switch (actionType) {
      case 'mermaid-render':
        if (preSelector) {
          this.executeMermaidPreRender(preSelector)
        }
        await new Promise(resolve => setTimeout(resolve, 1000))
        await this.executeMermaidRender(actionConfig)
        break
      case 'html-to-markdown':
        // do nothing
        break
      default:
        console.error(`未知动作类型: ${actionType}`)
    }
  }

  /**
   * 执行Mermaid渲染动作
   */
  private async executeMermaidRender(actionConfig: ActionConfig): Promise<void> {
    try {
      await MermaidService.getInstance().renderMermaid(actionConfig)
    } catch (error) {
      console.error('执行Mermaid渲染动作失败', error)
    }
  }

  /**
   * 执行Mermaid预渲染动作
   */
  private async executeMermaidPreRender(preSelector: string): Promise<void> {
    try {
      await MermaidService.getInstance().preRenderMermaid(preSelector)
    } catch (error) {
      console.error('执行Mermaid预渲染动作失败', error)
    }
  }
}
