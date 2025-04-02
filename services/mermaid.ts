/**
 * Mermaid渲染服务
 */
import mermaid from 'mermaid';
import { MermaidPreview } from './mermaidPreview';

export class MermaidService {
  private static instance: MermaidService;
  private mermaidInitialized = false;

  private constructor() {}

  public static getInstance(): MermaidService {
    if (!MermaidService.instance) {
      MermaidService.instance = new MermaidService();
    }
    return MermaidService.instance;
  }

  /**
   * 初始化Mermaid
   */
  private async initMermaid(): Promise<void> {
    if (this.mermaidInitialized) {
      console.log('Mermaid已经初始化，跳过');
      return;
    }

    try {
      console.log('开始初始化Mermaid...');
      await mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        logLevel: 'error' // 设置为error级别以减少日志
      });
      this.mermaidInitialized = true;
      console.log('Mermaid初始化成功');
    } catch (error) {
      console.error('Mermaid初始化失败:', error);
      throw error;
    }
  }

  /**
   * 添加Mermaid样式
   */
  private addMermaidStyles(): void {
    if (document.getElementById('deepseek-mermaid-styles')) {
      console.log('Mermaid样式已存在，跳过');
      return;
    }

    console.log('添加Mermaid样式...');
    const style = document.createElement('style');
    style.id = 'deepseek-mermaid-styles';
    style.textContent = `
      .deepseek-mermaid-render {
        margin: 1em 0;
        text-align: center;
      }
      
      .deepseek-mermaid-error {
        color: #ff4444;
        padding: 1em;
        border: 1px solid #ff4444;
        border-radius: 4px;
        margin: 1em 0;
      }
      
      .deepseek-mermaid-error pre {
        margin: 0.5em 0;
        white-space: pre-wrap;
        word-break: break-all;
      }

      .deepseek-mermaid-svg {
        cursor: pointer;
        transition: opacity 0.2s;
      }

      .deepseek-mermaid-svg:hover {
        opacity: 0.8;
      }
    `;
    document.head.appendChild(style);
    console.log('Mermaid样式添加成功');
  }

  /**
   * 渲染Mermaid图表
   * @param selector CSS选择器
   */
  public async renderMermaid(selector: string): Promise<void> {
    console.log('开始渲染Mermaid图表，选择器:', selector);
    
    // 初始化Mermaid
    await this.initMermaid();
    
    // 添加样式
    this.addMermaidStyles();

    // 查找匹配选择器的元素
    const elements = document.querySelectorAll(selector);
    if (elements.length === 0) {
      console.log(`没有找到匹配选择器的元素: ${selector}`);
      return;
    }

    console.log(`找到${elements.length}个匹配的Mermaid元素`);

    // 渲染所有匹配的元素
    for (let index = 0; index < elements.length; index++) {
      const element = elements[index];
      
      // 检查是否已经渲染过
      if (element.classList.contains('mermaid-rendered')) {
        console.log('此元素已经渲染过，跳过');
        continue;
      }
      
      try {
        const mermaidText = element.textContent?.trim();
        if (!mermaidText) {
          console.log('未找到Mermaid内容');
          continue;
        }
        
        console.log(`处理Mermaid内容: ${mermaidText.substring(0, 50)}...`);

        // 创建一个新的渲染容器
        const renderId = `mermaid-render-${Date.now()}-${index}`;
        const renderContainer = document.createElement('div');
        renderContainer.id = renderId;
        renderContainer.classList.add('deepseek-mermaid-render');

        // 替换原始元素
        element.innerHTML = renderContainer.innerHTML;

        // 渲染图表
        try {
          console.log('开始渲染图表...');
          // 使用mermaid包渲染
          const { svg } = await mermaid.render(renderId, mermaidText);
          
          // 设置渲染后的SVG
          element.innerHTML = svg;
          console.log('Mermaid渲染成功');
          
          // 标记为已渲染
          element.classList.add('mermaid-rendered');
          
          // 给SVG添加样式和交互功能
          const svgElement = element.querySelector('svg');
          if (svgElement) {
            svgElement.style.maxWidth = '100%';
            svgElement.style.height = 'auto';
            svgElement.classList.add('deepseek-mermaid-svg');
            console.log('SVG样式设置成功');

            // 添加点击预览功能
            svgElement.addEventListener('click', () => {
              MermaidPreview.getInstance().show(svgElement);
            });
          } else {
            console.warn('未找到SVG元素');
          }
        } catch (renderError) {
          console.error('Mermaid渲染失败:', renderError);
          console.error('渲染失败的Mermaid内容:', mermaidText);
          renderContainer.innerHTML = `<div class="mermaid-error">渲染失败: ${renderError instanceof Error ? renderError.message : '未知错误'}</div>`;
        }
      } catch (error) {
        console.error('Mermaid处理失败:', error);
        console.error('处理失败的元素:', element);
        
        // 显示错误信息
        const errorContainer = document.createElement('div');
        errorContainer.classList.add('deepseek-mermaid-error');
        errorContainer.innerHTML = `
          <p>Mermaid图表渲染失败</p>
          <pre>${(error as Error).message || '未知错误'}</pre>
        `;
        
        element.innerHTML = '';
        element.appendChild(errorContainer);
      }
    }
  }
}

// 添加Mermaid类型到全局Window对象
declare global {
  interface Window {
    mermaid: {
      initialize: (config: { startOnLoad: boolean, theme: string }) => void;
      render: (id: string, text: string) => Promise<{ svg: string }>;
    }
  }
} 