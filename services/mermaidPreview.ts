/**
 * Mermaid图表预览服务
 */
export class MermaidPreview {
  private static instance: MermaidPreview
  private previewContainer: HTMLDivElement | null = null
  private previewSvg: SVGElement | null = null
  private scale = 1
  private translateX = 0
  private translateY = 0
  private isDragging = false
  private startX = 0
  private startY = 0
  private lastTranslateX = 0
  private lastTranslateY = 0

  private constructor() {
    this.createPreviewContainer()
  }

  public static getInstance(): MermaidPreview {
    if (!MermaidPreview.instance) {
      MermaidPreview.instance = new MermaidPreview()
    }
    return MermaidPreview.instance
  }

  /**
   * 创建预览容器
   */
  private createPreviewContainer(): void {
    if (this.previewContainer) {
      return
    }

    this.previewContainer = document.createElement('div')
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
    `

    document.body.appendChild(this.previewContainer)

    // 添加事件监听
    this.previewContainer.addEventListener('wheel', this.handleWheel.bind(this))
    this.previewContainer.addEventListener('mousedown', this.handleMouseDown.bind(this))
    document.addEventListener('mousemove', this.handleMouseMove.bind(this))
    document.addEventListener('mouseup', this.handleMouseUp.bind(this))
  }

  /**
   * 显示预览
   */
  public show(svg: SVGElement, background?: string): void {
    if (!this.previewContainer) {
      return
    }
    this.previewContainer.style.backgroundColor = background ?? '#f4f4f4'

    // 清空容器
    this.previewContainer.innerHTML = ''

    // 添加关闭按钮
    const closeButton = document.createElement('button')
    closeButton.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `
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
    `
    closeButton.onmouseover = () => {
      closeButton.style.backgroundColor = '#555'
      closeButton.style.transform = 'scale(1.1)'
    }
    closeButton.onmouseout = () => {
      closeButton.style.backgroundColor = '#333'
      closeButton.style.transform = 'scale(1)'
    }
    closeButton.onclick = () => this.hide()

    // 创建底部按钮容器
    const bottomButtons = document.createElement('div')
    bottomButtons.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 12px;
      z-index: 10000;
    `

    // 创建复制按钮
    const copyButton = document.createElement('button')
    copyButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 4V16C8 17.1046 8.89543 18 10 18H18C19.1046 18 20 17.1046 20 16V7.24162C20 6.7034 19.7831 6.18861 19.4 5.8L16.2 2.6C15.8114 2.2169 15.2966 2 14.7584 2H10C8.89543 2 8 2.89543 8 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M16 18V20C16 21.1046 15.1046 22 14 22H6C4.89543 22 4 21.1046 4 20V8C4 6.89543 4.89543 6 6 6H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>复制图片</span>
    `
    copyButton.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: #333;
      color: white;
      border: none;
      border-radius: 20px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    `
    copyButton.onmouseover = () => {
      copyButton.style.backgroundColor = '#555'
      copyButton.style.transform = 'scale(1.05)'
    }
    copyButton.onmouseout = () => {
      copyButton.style.backgroundColor = '#333'
      copyButton.style.transform = 'scale(1)'
    }
    copyButton.onclick = () => this.copyImage()

    // 创建下载按钮
    const downloadButton = document.createElement('button')
    downloadButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>下载</span>
    `
    downloadButton.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: #333;
      color: white;
      border: none;
      border-radius: 20px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
      position: relative;
    `
    downloadButton.onmouseover = () => {
      downloadButton.style.backgroundColor = '#555'
      downloadButton.style.transform = 'scale(1.05)'
    }
    downloadButton.onmouseout = () => {
      downloadButton.style.backgroundColor = '#333'
      downloadButton.style.transform = 'scale(1)'
    }

    // 创建下载选项菜单
    const downloadMenu = document.createElement('div')
    downloadMenu.style.cssText = `
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%) translateY(-8px);
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      padding: 4px;
      display: none;
      z-index: 10001;
    `

    // 创建PNG下载选项
    const pngOption = document.createElement('button')
    pngOption.textContent = '下载为PNG'
    pngOption.style.cssText = `
      display: block;
      width: 100%;
      padding: 8px 16px;
      border: none;
      background: none;
      color: #333;
      text-align: left;
      cursor: pointer;
      font-size: 14px;
      border-radius: 4px;
      white-space: nowrap;
    `
    pngOption.onmouseover = () => {
      pngOption.style.backgroundColor = '#f5f5f5'
    }
    pngOption.onmouseout = () => {
      pngOption.style.backgroundColor = 'transparent'
    }
    pngOption.onclick = e => {
      e.stopPropagation()
      this.downloadImage('png')
      downloadMenu.style.display = 'none'
    }

    // 创建SVG下载选项
    const svgOption = document.createElement('button')
    svgOption.textContent = '下载为SVG'
    svgOption.style.cssText = `
      display: block;
      width: 100%;
      padding: 8px 16px;
      border: none;
      background: none;
      color: #333;
      text-align: left;
      cursor: pointer;
      font-size: 14px;
      border-radius: 4px;
      white-space: nowrap;
    `
    svgOption.onmouseover = () => {
      svgOption.style.backgroundColor = '#f5f5f5'
    }
    svgOption.onmouseout = () => {
      svgOption.style.backgroundColor = 'transparent'
    }
    svgOption.onclick = e => {
      e.stopPropagation()
      this.downloadImage('svg')
      downloadMenu.style.display = 'none'
    }

    downloadMenu.appendChild(pngOption)
    downloadMenu.appendChild(svgOption)
    downloadButton.appendChild(downloadMenu)

    // 显示/隐藏下载菜单
    downloadButton.onclick = () => {
      const isVisible = downloadMenu.style.display === 'block'
      downloadMenu.style.display = isVisible ? 'none' : 'block'
    }

    // 点击其他地方关闭菜单
    document.addEventListener('click', e => {
      if (!downloadButton.contains(e.target as Node)) {
        downloadMenu.style.display = 'none'
      }
    })

    // 克隆SVG
    this.previewSvg = svg.cloneNode(true) as SVGElement
    this.previewSvg.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(1);
      max-width: 90%;
      max-height: 90%;
      width: auto;
      height: auto;
      user-select: text;
    `

    // 重置状态
    this.scale = 1
    this.translateX = 0
    this.translateY = 0
    this.lastTranslateX = 0
    this.lastTranslateY = 0

    // 显示预览
    this.previewContainer.appendChild(closeButton)
    this.previewContainer.appendChild(this.previewSvg)
    bottomButtons.appendChild(copyButton)
    bottomButtons.appendChild(downloadButton)
    this.previewContainer.appendChild(bottomButtons)
    this.previewContainer.style.display = 'block'
  }

  /**
   * 隐藏预览
   */
  public hide(): void {
    if (this.previewContainer) {
      this.previewContainer.style.display = 'none'
      this.previewSvg = null
    }
  }

  /**
   * 处理鼠标滚轮事件
   */
  private handleWheel(e: WheelEvent): void {
    e.preventDefault()
    if (!this.previewSvg) return

    // 计算缩放比例
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.max(0.1, Math.min(5, this.scale * delta))

    // 计算鼠标相对于SVG的位置
    const rect = this.previewSvg.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // 计算新的平移值
    const scaleDiff = newScale - this.scale
    this.translateX -= ((mouseX - rect.width / 2) * scaleDiff) / this.scale
    this.translateY -= ((mouseY - rect.height / 2) * scaleDiff) / this.scale

    // 更新状态
    this.scale = newScale
    this.updateTransform()
  }

  /**
   * 处理鼠标按下事件
   */
  private handleMouseDown(e: MouseEvent): void {
    // 如果点击的是关闭按钮，不进行拖动
    if (e.target instanceof HTMLButtonElement) return

    // 检查点击的元素或其祖先元素是否包含span
    const target = e.target as Element
    const hasSpan = target.closest('span') !== null
    if (hasSpan) return

    this.isDragging = true
    this.startX = e.clientX
    this.startY = e.clientY
    this.lastTranslateX = this.translateX
    this.lastTranslateY = this.translateY
  }

  /**
   * 处理鼠标移动事件
   */
  private handleMouseMove(e: MouseEvent): void {
    if (!this.isDragging || !this.previewSvg) return

    const deltaX = e.clientX - this.startX
    const deltaY = e.clientY - this.startY

    this.translateX = this.lastTranslateX + deltaX
    this.translateY = this.lastTranslateY + deltaY

    this.updateTransform()
  }

  /**
   * 处理鼠标松开事件
   */
  private handleMouseUp(): void {
    this.isDragging = false
  }

  /**
   * 更新变换
   */
  private updateTransform(): void {
    if (!this.previewSvg) return

    this.previewSvg.style.transform = `
      translate(calc(-50% + ${this.translateX}px), calc(-50% + ${this.translateY}px))
      scale(${this.scale})
    `
  }

  /**
   * 将SVG转换为图片
   */
  private async svgToImage(): Promise<{ canvas: HTMLCanvasElement; svgData: string }> {
    if (!this.previewSvg) throw new Error('No SVG element')

    // 克隆SVG并移除样式
    const svgClone = this.previewSvg.cloneNode(true) as SVGElement
    svgClone.style.cssText = ''

    // 获取SVG的原始尺寸
    const viewBox = svgClone.getAttribute('viewBox')?.split(' ').map(Number)
    if (!viewBox) throw new Error('SVG has no viewBox')
    const [minX, minY, width, height] = viewBox

    // 创建canvas
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Failed to get canvas context')

    // 使用更高的分辨率
    const scale = 2
    canvas.width = width * scale
    canvas.height = height * scale

    // 将SVG转换为图片
    const svgData = new XMLSerializer().serializeToString(svgClone)
    const encodedSvgData = encodeURIComponent(svgData)
    const img = new Image()
    img.src = `data:image/svg+xml;charset=utf-8,${encodedSvgData}`

    await new Promise(resolve => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0)
        resolve(null)
      }
    })

    return { canvas, svgData }
  }

  /**
   * 复制图片到剪贴板
   */
  private async copyImage(): Promise<void> {
    try {
      const { canvas } = await this.svgToImage()

      // 转换为blob
      const blob = await new Promise<Blob>(resolve => {
        canvas.toBlob(
          blob => {
            if (blob) resolve(blob)
          },
          'image/png',
          1.0
        ) // 使用最高质量
      })

      // 复制到剪贴板
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob
        })
      ])

      // 显示成功提示
      this.showToast('图片已复制到剪贴板')
    } catch (error) {
      console.error('复制图片失败:', error)
      this.showToast('复制图片失败')
    }
  }

  /**
   * 下载图片
   */
  private async downloadImage(format: 'png' | 'svg'): Promise<void> {
    try {
      if (format === 'svg') {
        // 克隆SVG并移除样式
        const svgClone = this.previewSvg?.cloneNode(true) as SVGElement
        if (!svgClone) throw new Error('No SVG element')
        svgClone.style.cssText = ''

        const svgData = new XMLSerializer().serializeToString(svgClone)
        const blob = new Blob([svgData], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'mermaid-diagram.svg'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } else {
        const { canvas } = await this.svgToImage()
        const link = document.createElement('a')
        link.href = canvas.toDataURL('image/png', 1.0) // 使用最高质量
        link.download = 'mermaid-diagram.png'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error('下载图片失败:', error)
      this.showToast('下载图片失败')
    }
  }

  /**
   * 显示提示信息
   */
  private showToast(message: string): void {
    const toast = document.createElement('div')
    toast.textContent = message
    toast.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      z-index: 10001;
      animation: fadeInOut 2s ease-in-out;
    `

    // 添加动画样式
    const style = document.createElement('style')
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, 20px); }
        20% { opacity: 1; transform: translate(-50%, 0); }
        80% { opacity: 1; transform: translate(-50%, 0); }
        100% { opacity: 0; transform: translate(-50%, -20px); }
      }
    `
    document.head.appendChild(style)

    document.body.appendChild(toast)
    setTimeout(() => {
      document.body.removeChild(toast)
      document.head.removeChild(style)
    }, 2000)
  }
}
