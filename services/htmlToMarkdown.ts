/**
 * HTML到Markdown转换服务
 */
import html2md from 'html-to-md'

export class HtmlToMarkdownService {
  private static instance: HtmlToMarkdownService

  private constructor() {}

  public static getInstance(): HtmlToMarkdownService {
    if (!HtmlToMarkdownService.instance) {
      HtmlToMarkdownService.instance = new HtmlToMarkdownService()
    }
    return HtmlToMarkdownService.instance
  }

  /**
   * 将HTML转换为Markdown
   */
  public htmlToMarkdown(_html: string, unnecessarySelector?: string[]): string {
    let html = _html
    // 做一些标签补充
    // 如果开头是<thead> 结尾是</tbody> 则补充<table>标签
    if (html.startsWith('<thead>') && html.endsWith('</tbody>')) {
      html = `<table>${html}</table>`
    }
    const dom = document.createElement('div')
    dom.innerHTML = html
    for (const mermaid of dom.querySelectorAll('.deepseek-mermaid-render')) {
      const originText = (mermaid as HTMLElement).dataset.originText
      if (originText) {
        mermaid.innerHTML = originText
      }
    }
    for (const selector of unnecessarySelector ?? []) {
      for (const element of dom.querySelectorAll(selector)) {
        element.remove()
      }
    }
    html = dom.innerHTML

    try {
      return html2md(html)
    } catch (error) {
      console.error('HTML转Markdown失败', error)
      throw new Error('HTML转Markdown失败')
    }
  }
}
