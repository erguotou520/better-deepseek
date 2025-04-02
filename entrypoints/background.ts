import { configService } from '../services/config'

export default defineBackground(() => {
  // console.log('后台脚本已加载', { id: browser.runtime.id });

  // 初始化扩展
  init()

  // 创建右键菜单
  browser.contextMenus.create({
    id: 'copyAsMarkdown',
    title: '复制为 Markdown',
    contexts: ['selection']
  })

  // 处理右键菜单点击
  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'copyAsMarkdown' && tab?.id) {
      const url = info.pageUrl
      // const matchingRules = configService.getMatchingRules(url)
      const matchingActions = configService.getMatchingActions(url)
      // 发送消息到内容脚本处理复制操作
      browser.tabs.sendMessage(tab.id, {
        action: 'copySelectedAsMarkdown',
        unnecessarySelectors: matchingActions.find(action => action.action === 'html-to-markdown')?.unnecessarySelector
      })
    }
  })

  // 处理来自内容脚本的消息
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'checkRules') {
      const url = message.url
      const matchingRules = configService.getMatchingRules(url)
      const matchingActions = configService.getMatchingActions(url)
      const actionsCount = matchingActions.length

      // 更新徽章显示匹配动作数量
      updateBadge(actionsCount)

      sendResponse({ rules: matchingRules, actions: matchingActions, actionsCount })
      return true // 异步响应
    }

    if (message.action === 'syncConfig') {
      void syncConfig().then(success => {
        sendResponse({ success, error: configService.getConfig().error })
      })
      return true // 异步响应
    }

    if (message.action === 'getConfigState') {
      sendResponse({ state: configService.getConfig() })
      return false // 同步响应
    }

    if (message.action === 'showToast') {
      if (sender.tab?.id) {
        void browser.tabs.sendMessage(sender.tab.id, {
          action: 'showToast',
          message: message.message
        })
      }
      return false // 同步响应
    }

    return false
  })

  // 监听标签更新，刷新内容脚本和徽章
  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
      const matchingRules = configService.getMatchingRules(tab.url)
      const matchingActions = configService.getMatchingActions(tab.url)
      const actionsCount = matchingActions.length

      // 更新当前标签的徽章
      updateBadge(actionsCount, tabId)

      if (matchingRules.length > 0) {
        // 如果有匹配的规则，重新注入内容脚本
        void browser.tabs
          .sendMessage(tabId, {
            action: 'pageUpdated',
            rules: matchingRules,
            actions: matchingActions,
            actionsCount
          })
          .catch(() => {
            // 如果发送消息失败，通常是因为内容脚本尚未加载，这是正常的
          })
      }
    }
  })

  // 监听标签激活，更新徽章
  browser.tabs.onActivated.addListener(async activeInfo => {
    try {
      const tab = await browser.tabs.get(activeInfo.tabId)
      if (tab.url) {
        const actionsCount = configService.countActions(tab.url)
        updateBadge(actionsCount, activeInfo.tabId)
      }
    } catch (error) {
      console.error('获取活动标签信息失败', error)
    }
  })

  // 添加安装和更新监听
  browser.runtime.onInstalled.addListener(details => {
    if (details.reason === 'install') {
      // 首次安装
      void syncConfig()
    } else if (details.reason === 'update') {
      // 扩展更新
      void syncConfig()
    }
  })
})

/**
 * 初始化扩展
 */
async function init(): Promise<void> {
  try {
    // 尝试从缓存加载配置
    const config = configService.getConfig()

    // 检查是否需要更新配置
    if (configService.shouldUpdate()) {
      await syncConfig()
    }

    // 初始化时更新当前标签的徽章
    const tabs = await browser.tabs.query({ active: true, currentWindow: true })
    if (tabs.length > 0 && tabs[0].url) {
      const actionsCount = configService.countActions(tabs[0].url)
      updateBadge(actionsCount, tabs[0].id)
    }

    // console.log('扩展初始化完成', config);
  } catch (error) {
    console.error('扩展初始化失败', error)
  }
}

/**
 * 同步配置
 */
async function syncConfig(): Promise<boolean> {
  try {
    const success = await configService.fetchConfig()

    if (success) {
      // 刷新所有打开的标签
      const tabs = await browser.tabs.query({})
      for (const tab of tabs) {
        if (tab.id && tab.url) {
          const matchingRules = configService.getMatchingRules(tab.url)
          const matchingActions = configService.getMatchingActions(tab.url)
          const actionsCount = matchingActions.length

          // 更新徽章
          updateBadge(actionsCount, tab.id)

          if (matchingRules.length > 0) {
            void browser.tabs
              .sendMessage(tab.id, {
                action: 'configUpdated',
                rules: matchingRules,
                actions: matchingActions,
                actionsCount
              })
              .catch(() => {
                // 忽略错误，可能内容脚本尚未加载
              })
          }
        }
      }
    }

    return success
  } catch (error) {
    console.error('同步配置失败', error)
    return false
  }
}

/**
 * 更新徽章显示匹配动作数量
 * @param count 匹配动作数量
 * @param tabId 可选的标签ID，如果提供则只更新该标签的徽章
 */
function updateBadge(count: number, tabId?: number): void {
  // 如果没有匹配动作，不显示徽章
  const text = count > 0 ? count.toString() : ''

  // 设置徽章文本
  if (tabId !== undefined) {
    void browser.action.setBadgeText({ text, tabId })
  } else {
    void browser.action.setBadgeText({ text })
  }

  // 设置徽章背景色
  if (count > 0) {
    const color = count > 5 ? '#FF5722' : '#4CAF50' // 超过5个动作用橙色，否则用绿色
    if (tabId !== undefined) {
      void browser.action.setBadgeBackgroundColor({ color, tabId })
    } else {
      void browser.action.setBadgeBackgroundColor({ color })
    }
  }
}
