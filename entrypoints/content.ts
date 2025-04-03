// @ts-check
// @charset UTF-8

import { ActionExecutor } from '../services/actionExecutor'
import { HtmlToMarkdownService } from '../services/htmlToMarkdown'
import type { RuleConfig } from '../types/config'

// 监听来自后台脚本的消息
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // console.log("内容脚本收到消息:", message);

  if (message.action === 'copySelectedAsMarkdown') {
    // 获取选中内容的HTML
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      showToast('请先选择要复制的内容')
      return
    }

    const range = selection.getRangeAt(0)
    const fragment = range.cloneContents()
    const tempDiv = document.createElement('div')
    tempDiv.appendChild(fragment)

    try {
      // 转换为Markdown
      const markdown = HtmlToMarkdownService.getInstance().htmlToMarkdown(
        tempDiv.innerHTML,
        message.unnecessarySelectors
      )

      // 复制到剪贴板
      navigator.clipboard
        .writeText(markdown)
        .then(() => {
          showToast('已复制为Markdown')
        })
        .catch(error => {
          showToast(`复制失败: ${error.message}`)
        })

      return true // 异步响应
    } catch (error) {
      showToast(`复制失败: ${error instanceof Error ? error.message : '未知错误'}`)
      return false
    }
  }

  if (message.action === 'showToast') {
    showToast(message.message)
    return false
  }

  return false
})

/**
 * 显示提示信息
 */
function showToast(message: string): void {
  const toast = document.createElement('div')
  toast.style.cssText = `
		position: fixed;
		bottom: 20px;
		left: 50%;
		transform: translateX(-50%);
		background: rgba(0, 0, 0, 0.8);
		color: white;
		padding: 8px 16px;
		border-radius: 4px;
		z-index: 10000;
		font-size: 14px;
	`
  toast.textContent = message
  document.body.appendChild(toast)

  setTimeout(() => {
    document.body.removeChild(toast)
  }, 3000)
}

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  main: async () => {
    // console.log("内容脚本已加载，URL:", window.location.href);

    // 通知后台脚本激活内容脚本并获取匹配规则
    const response = await browser.runtime.sendMessage({
      action: 'checkRules',
      url: window.location.href
    })

    // console.log("收到后台响应:", response);

    if (!response || !response.rules || response.rules.length === 0) {
      // console.log("当前URL没有匹配的规则");
      return
    }

    // console.log("找到匹配的规则:", response.rules);
    // console.log("找到匹配的动作:", response.actions);

    // 执行匹配规则的动作
    let actionsExecuted = 0
    for (const rule of response.rules as RuleConfig[]) {
      // console.log("处理规则:", rule.urlPattern);
      if (!rule.actions || rule.actions.length === 0) {
        // console.log("此规则没有动作定义，跳过");
        continue
      }

      for (const action of rule.actions) {
        // console.log("执行动作:", action.action, "选择器:", action.selector);
        try {
          await ActionExecutor.getInstance().executeAction(action)
          // console.log("成功执行动作:", action.action);
          actionsExecuted++
        } catch (error) {
          console.error('执行动作失败', action, error)
        }
      }
    }

    if (actionsExecuted === 0) {
      // console.log("没有执行任何动作");
      return
    }

    // 监听DOM变化，在页面动态加载内容后执行动作
    setupMutationObserver(response.rules)

    // 监听来自后台脚本的消息
    browser.runtime.onMessage.addListener(message => {
      // console.log("内容脚本收到消息:", message);
      if (message.action === 'pageUpdated' || message.action === 'configUpdated') {
        // 执行自定义脚本和自定义样式
        executeCustomScriptsAndStyles(message.rules)
        // 重新执行匹配规则的动作
        executeMatchingActions(message.rules)
      }
    })
  }
})

/**
 * 设置DOM变化观察器，监听内容变化后重新执行动作
 */
function setupMutationObserver(rules: RuleConfig[]): void {
  let debounceTimer: number | null = null
  let lastExecutionTime = 0
  const DEBOUNCE_DELAY = 3000 // 3秒延迟

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        // 检查上次执行时间
        const now = Date.now()
        if (now - lastExecutionTime < DEBOUNCE_DELAY) {
          // 3秒内有触发，重置定时器
          if (debounceTimer !== null) {
            clearTimeout(debounceTimer)
          }

          // 设置新的定时器
          debounceTimer = window.setTimeout(() => {
            executeMatchingActions(rules)
            execCustomScripts(rules)
            lastExecutionTime = Date.now()
            debounceTimer = null
          }, DEBOUNCE_DELAY)
        } else {
          // 距离上次执行已超过3秒，直接执行
          executeMatchingActions(rules)
          execCustomScripts(rules)
          lastExecutionTime = now
        }
        break
      }
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true
  })
}

/**
 * 执行匹配规则的动作
 */
async function executeMatchingActions(rules: RuleConfig[]): Promise<void> {
  for (const rule of rules) {
    if (!rule.actions || rule.actions.length === 0) {
      continue
    }

    for (const action of rule.actions) {
      try {
        await ActionExecutor.getInstance().executeAction(action)
      } catch (error) {
        console.error('执行动作失败', action, error)
      }
    }
  }
}

/**
 * 执行自定义脚本和自定义样式
 */
function executeCustomScriptsAndStyles(rules: RuleConfig[]): void {
  for (const rule of rules) {
    if (rule.customStyle) {
      const style = document.createElement('style')
      style.id = 'bd-custom-style'
      style.textContent = rule.customStyle
      document.head.appendChild(style)
    }
    for (const script of rule.customScripts || []) {
      parseCustomScript(script)
    }
  }
}

function execCustomScripts(rules: RuleConfig[]): void {
  for (const rule of rules) {
    for (const script of rule.customScripts || []) {
      parseCustomScript(script)
    }
  }
}

/**
 * 解析自定义脚本，目前支持
 * [scope]selector t(selector) as $var; add-css:selector:language-$var
 */
function parseCustomScript(script: string): void {
  const regex = /\[scope\](.+) t\((.+)\) as \$([\w\d]+); add-css:(.+):(language-\$[\w\d-_]+)/
  const match = script.match(regex)
  if (match) {
    const vars = {} as Record<string, string>
    const [_, parentSelector, textSelector, varName, cssSelector, targetCssVar] = match
    for (const parent of document.querySelectorAll(parentSelector)) {
      const text = parent.querySelector(textSelector)?.textContent?.trim()
      if (text) {
        vars[varName] = text
        const targetCss = targetCssVar.replace(/\$[\w\d]+/g, match => {
          return vars[match.replace(/\$/g, '')]
        })
        parent.querySelector(cssSelector)?.classList.add(targetCss)
      }
    }
  }
}
