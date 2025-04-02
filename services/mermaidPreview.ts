/**
 * Mermaid图表预览服务
 */
export class MermaidPreview {
  private static instance: MermaidPreview;
  private previewContainer: HTMLDivElement | null = null;
  private previewSvg: SVGElement | null = null;
  private scale = 1;
  private translateX = 0;
  private translateY = 0;
  private isDragging = false;
  private startX = 0;
  private startY = 0;
  private lastTranslateX = 0;
  private lastTranslateY = 0;

  private constructor() {
    this.createPreviewContainer();
  }

  public static getInstance(): MermaidPreview {
    if (!MermaidPreview.instance) {
      MermaidPreview.instance = new MermaidPreview();
    }
    return MermaidPreview.instance;
  }

  /**
   * 创建预览容器
   */
  private createPreviewContainer(): void {
    if (this.previewContainer) {
      return;
    }

    this.previewContainer = document.createElement('div');
    this.previewContainer.style.cssText = `
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: #fff;
      z-index: 9999;
      cursor: move;
      overflow: hidden;
    `;

    document.body.appendChild(this.previewContainer);

    // 添加事件监听
    this.previewContainer.addEventListener('wheel', this.handleWheel.bind(this));
    this.previewContainer.addEventListener('mousedown', this.handleMouseDown.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
  }

  /**
   * 显示预览
   */
  public show(svg: SVGElement): void {
    if (!this.previewContainer) {
      return;
    }

    // 清空容器
    this.previewContainer.innerHTML = '';

    // 添加关闭按钮
    const closeButton = document.createElement('button');
    closeButton.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    closeButton.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 40px;
      height: 40px;
      border: none;
      background: #333;
      color: white;
      border-radius: 50%;
      cursor: pointer;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      padding: 0;
    `;
    closeButton.onmouseover = () => {
      closeButton.style.backgroundColor = '#555';
      closeButton.style.transform = 'scale(1.1)';
    };
    closeButton.onmouseout = () => {
      closeButton.style.backgroundColor = '#333';
      closeButton.style.transform = 'scale(1)';
    };
    closeButton.onclick = () => this.hide();

    // 克隆SVG
    this.previewSvg = svg.cloneNode(true) as SVGElement;
    this.previewSvg.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(1);
      max-width: 90%;
      max-height: 90%;
      width: auto;
      height: auto;
      cursor: move;
    `;

    // 重置状态
    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;
    this.lastTranslateX = 0;
    this.lastTranslateY = 0;

    // 显示预览
    this.previewContainer.appendChild(closeButton);
    this.previewContainer.appendChild(this.previewSvg);
    this.previewContainer.style.display = 'block';
  }

  /**
   * 隐藏预览
   */
  public hide(): void {
    if (this.previewContainer) {
      this.previewContainer.style.display = 'none';
      this.previewSvg = null;
    }
  }

  /**
   * 处理鼠标滚轮事件
   */
  private handleWheel(e: WheelEvent): void {
    e.preventDefault();
    if (!this.previewSvg) return;

    // 计算缩放比例
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5, this.scale * delta));

    // 计算鼠标相对于SVG的位置
    const rect = this.previewSvg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // 计算新的平移值
    const scaleDiff = newScale - this.scale;
    this.translateX -= (mouseX - rect.width / 2) * scaleDiff / this.scale;
    this.translateY -= (mouseY - rect.height / 2) * scaleDiff / this.scale;

    // 更新状态
    this.scale = newScale;
    this.updateTransform();
  }

  /**
   * 处理鼠标按下事件
   */
  private handleMouseDown(e: MouseEvent): void {
    if (e.target !== this.previewSvg) return;
    
    this.isDragging = true;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.lastTranslateX = this.translateX;
    this.lastTranslateY = this.translateY;
  }

  /**
   * 处理鼠标移动事件
   */
  private handleMouseMove(e: MouseEvent): void {
    if (!this.isDragging || !this.previewSvg) return;

    const deltaX = e.clientX - this.startX;
    const deltaY = e.clientY - this.startY;

    this.translateX = this.lastTranslateX + deltaX;
    this.translateY = this.lastTranslateY + deltaY;

    this.updateTransform();
  }

  /**
   * 处理鼠标松开事件
   */
  private handleMouseUp(): void {
    this.isDragging = false;
  }

  /**
   * 更新变换
   */
  private updateTransform(): void {
    if (!this.previewSvg) return;

    this.previewSvg.style.transform = `
      translate(calc(-50% + ${this.translateX}px), calc(-50% + ${this.translateY}px))
      scale(${this.scale})
    `;
  }
} 