/**
 * HTML到Markdown转换服务
 */
import html2md from 'html-to-md';

export class HtmlToMarkdownService {
  private static instance: HtmlToMarkdownService;
  private menuAdded = false;

  private constructor() {}

  public static getInstance(): HtmlToMarkdownService {
    if (!HtmlToMarkdownService.instance) {
      HtmlToMarkdownService.instance = new HtmlToMarkdownService();
    }
    return HtmlToMarkdownService.instance;
  }

  /**
   * 将HTML转换为Markdown
   */
  public htmlToMarkdown(_html: string): string {
    let html = _html;
    // 做一些标签补充
    // 如果开头是<thead> 结尾是</tbody> 则补充<table>标签
    if (html.startsWith('<thead>') && html.endsWith('</tbody>')) {
      html = `<table>${html}</table>`;
    }

    try {
      return html2md(html);
    } catch (error) {
      console.error('HTML转Markdown失败', error);
      throw new Error('HTML转Markdown失败');
    }
  }

  /**
   * 添加右键菜单并监听复制事件
   */
  public async setupHtmlToMarkdownMenu(selector: string): Promise<void> {
    // 添加样式
    this.addMenuStyles();
    
    const elements = document.querySelectorAll(selector);
    if (elements.length === 0) {
      console.log(`没有找到匹配选择器的元素: ${selector}`);
      return;
    }

    console.log(`找到${elements.length}个匹配的HTML元素，添加右键菜单`);

    // 为所有匹配的元素添加右键菜单事件
    for (const element of elements) {
      // 检查是否已经添加过事件监听
      if (element.getAttribute('data-markdown-menu-added') === 'true') {
        console.log('此元素已添加过右键菜单，跳过');
        continue;
      }
      
      element.setAttribute('data-markdown-menu-added', 'true');
      
      // 添加右键菜单事件监听
      element.addEventListener('contextmenu', this.handleContextMenu.bind(this));
      
      console.log('已为元素添加右键菜单');
    }
  }
  
  /**
   * 处理右键菜单事件
   */
  private handleContextMenu(event: Event): void {
    // 转换为 MouseEvent 类型
    const mouseEvent = event as MouseEvent;
    
    // 阻止默认右键菜单
    mouseEvent.preventDefault();
    
    // 异步处理右键菜单
    void this.showCustomMenu(mouseEvent);
  }
  
  /**
   * 显示自定义右键菜单
   */
  private async showCustomMenu(event: MouseEvent): Promise<void> {
    // 移除之前可能存在的菜单
    this.removeExistingMenu();
    
    // 创建自定义菜单
    const menu = document.createElement('div');
    menu.className = 'deepseek-context-menu';
    menu.innerHTML = '<div class="deepseek-menu-item">复制为 Markdown</div>';
    
    // 设置菜单样式
    Object.assign(menu.style, {
      position: 'absolute',
      left: `${event.pageX}px`,
      top: `${event.pageY}px`,
      zIndex: '10000'
    });
    
    // 添加菜单项点击事件
    const menuItem = menu.querySelector('.deepseek-menu-item') as HTMLElement;
    if (menuItem) {
      menuItem.addEventListener('click', () => void this.copyAsMarkdown());
    }
    
    // 添加到页面
    document.body.appendChild(menu);
    
    // 点击页面其他地方关闭菜单
    setTimeout(() => {
      document.addEventListener('click', this.handleDocumentClick.bind(this), { once: true });
    }, 0);
  }
  
  /**
   * 处理文档点击事件，关闭菜单
   */
  private handleDocumentClick(): void {
    this.removeExistingMenu();
  }
  
  /**
   * 移除已存在的菜单
   */
  private removeExistingMenu(): void {
    const existingMenu = document.querySelector('.deepseek-context-menu');
    if (existingMenu) {
      document.body.removeChild(existingMenu);
    }
  }
  
  /**
   * 复制为Markdown
   */
  private async copyAsMarkdown(): Promise<void> {
    try {
      // 获取选中内容的HTML
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        this.showToast('请先选择要复制的内容');
        return;
      }
      
      const range = selection.getRangeAt(0);
      const fragment = range.cloneContents();
      const tempDiv = document.createElement('div');
      tempDiv.appendChild(fragment);
      
      console.log('选中的HTML内容:', tempDiv.innerHTML);
      
      // 转换为Markdown
      const markdown = this.htmlToMarkdown(tempDiv.innerHTML);
      console.log('转换后的Markdown:', markdown);
      
      // 复制到剪贴板
      await navigator.clipboard.writeText(markdown);
      
      // 显示成功提示
      this.showToast('已复制为Markdown');
    } catch (error) {
      console.error('复制为Markdown失败', error);
      this.showToast(`复制失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  
  /**
   * 添加样式
   */
  private addMenuStyles(): void {
    // 检查是否已经添加了样式
    if (document.getElementById('deepseek-markdown-styles')) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = 'deepseek-markdown-styles';
    style.textContent = `
      .deepseek-context-menu {
        background: #fff;
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 5px 0;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      }
      
      .deepseek-menu-item {
        padding: 8px 15px;
        cursor: pointer;
        font-size: 13px;
        color: #333;
      }
      
      .deepseek-menu-item:hover {
        background: #f0f0f0;
      }
      
      .deepseek-toast {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.7);
        color: #fff;
        padding: 10px 20px;
        border-radius: 4px;
        z-index: 10001;
        font-size: 13px;
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * 显示Toast提示
   */
  private showToast(message: string): void {
    // 删除已有的toast
    const existingToast = document.querySelector('.deepseek-toast');
    if (existingToast) {
      document.body.removeChild(existingToast);
    }
    
    const toast = document.createElement('div');
    toast.className = 'deepseek-toast';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // 3秒后自动移除
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 3000);
  }
} 