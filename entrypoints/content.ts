// @ts-check
// @charset UTF-8

import { ActionExecutor } from "../services/actionExecutor";
import { HtmlToMarkdownService } from "../services/htmlToMarkdown";
import type { ActionConfig, RuleConfig } from "../types/config";

// 监听来自后台脚本的消息
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
	console.log("内容脚本收到消息:", message);
	
	if (message.action === 'copySelectedAsMarkdown') {
		// 获取选中内容的HTML
		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) {
			sendResponse({ success: false, error: '请先选择要复制的内容' });
			return false;
		}
		
		const range = selection.getRangeAt(0);
		const fragment = range.cloneContents();
		const tempDiv = document.createElement('div');
		tempDiv.appendChild(fragment);
		
		try {
			// 转换为Markdown
			const markdown = HtmlToMarkdownService.getInstance().htmlToMarkdown(tempDiv.innerHTML);
			
			// 复制到剪贴板
			navigator.clipboard.writeText(markdown).then(() => {
				sendResponse({ success: true });
			}).catch(error => {
				sendResponse({ success: false, error: error.message });
			});
			
			return true; // 异步响应
		} catch (error) {
			sendResponse({ success: false, error: error instanceof Error ? error.message : '未知错误' });
			return false;
		}
	}
	
	if (message.action === 'showToast') {
		showToast(message.message);
		return false;
	}
	
	return false;
});

/**
 * 显示提示信息
 */
function showToast(message: string): void {
	const toast = document.createElement('div');
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
	`;
	toast.textContent = message;
	document.body.appendChild(toast);
	
	setTimeout(() => {
		document.body.removeChild(toast);
	}, 3000);
}

export default defineContentScript({
	matches: ["<all_urls>"],
	runAt: "document_idle",
	main: async () => {
		console.log("内容脚本已加载，URL:", window.location.href);
		
		// 通知后台脚本激活内容脚本并获取匹配规则
		const response = await browser.runtime.sendMessage({
			action: "checkRules",
			url: window.location.href,
		});

		console.log("收到后台响应:", response);

		if (!response || !response.rules || response.rules.length === 0) {
			console.log("当前URL没有匹配的规则");
			return;
		}

		console.log("找到匹配的规则:", response.rules);
		console.log("找到匹配的动作:", response.actions);

		// 执行匹配规则的动作
		let actionsExecuted = 0;
		for (const rule of response.rules as RuleConfig[]) {
			console.log("处理规则:", rule.urlPattern);
			if (!rule.actions || rule.actions.length === 0) {
				console.log("此规则没有动作定义，跳过");
				continue;
			}
			
			for (const action of rule.actions) {
				console.log("执行动作:", action.action, "选择器:", action.selector);
				try {
					await ActionExecutor.getInstance().executeAction(action);
					console.log("成功执行动作:", action.action);
					actionsExecuted++;
				} catch (error) {
					console.error("执行动作失败", action, error);
				}
			}
		}

		if (actionsExecuted === 0) {
			console.log("没有执行任何动作");
			return;
		}

		// 监听DOM变化，在页面动态加载内容后执行动作
		setupMutationObserver(response.rules);

		// 监听来自后台脚本的消息
		browser.runtime.onMessage.addListener((message) => {
			console.log("内容脚本收到消息:", message);
			if (message.action === 'pageUpdated' || message.action === 'configUpdated') {
				// 重新执行匹配规则的动作
				void executeMatchingActions(message.rules);
			}
		});
	}
});

/**
 * 应用规则列表
 */
async function applyRules(rules: RuleConfig[]): Promise<void> {
	if (!rules || rules.length === 0) {
		console.log("没有规则可应用");
		return;
	}

	let actionsExecuted = 0;
	for (const rule of rules) {
		console.log("应用规则:", rule.urlPattern);
		
		if (!rule.actions || rule.actions.length === 0) {
			console.log("此规则没有动作定义，跳过");
			continue;
		}
		
		for (const action of rule.actions) {
			console.log("应用动作:", action.action, "选择器:", action.selector);
			try {
				await ActionExecutor.getInstance().executeAction(action);
				console.log("成功应用动作:", action.action);
				actionsExecuted++;
			} catch (error) {
				console.error("应用规则失败", action, error);
			}
		}
	}

	if (actionsExecuted === 0) {
		console.log("没有执行任何动作");
	}
}

/**
 * 设置DOM变化观察器，监听内容变化后重新执行动作
 */
function setupMutationObserver(rules: RuleConfig[]): void {
	const observer = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (mutation.addedNodes.length > 0) {
				// 有新节点添加，重新执行匹配规则的动作
				void executeMatchingActions(rules);
				break;
			}
		}
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true
	});
}

/**
 * 执行匹配规则的动作
 */
async function executeMatchingActions(rules: RuleConfig[]): Promise<void> {
	for (const rule of rules) {
		if (!rule.actions || rule.actions.length === 0) {
			continue;
		}
		
		for (const action of rule.actions) {
			try {
				await ActionExecutor.getInstance().executeAction(action);
			} catch (error) {
				console.error("执行动作失败", action, error);
			}
		}
	}
}
