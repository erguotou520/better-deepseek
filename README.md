# Better DeepSeek

基于WXT的浏览器扩展，提供网页增强功能。

## 功能特点

- 自动加载远程配置，无需手动设置
- 按照URL匹配规则在特定网站自动执行预定义动作
- 支持Mermaid图表渲染
- 支持HTML复制为Markdown
- 简洁的用户界面

## 安装

1. 下载最新版本的扩展
2. 在Chrome/Edge浏览器中打开扩展管理页面
3. 启用开发者模式
4. 拖拽扩展文件到扩展管理页面

## 开发

本项目使用[WXT](https://wxt.dev/)框架开发。

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 打包扩展
npm run zip
```

## 配置文件格式

配置文件是一个JSON数组，每项包含URL匹配规则和动作列表：

```json
[
  {
    "urlPattern": ".*github\\.com.*",
    "actions": [
      {
        "selector": "pre.language-mermaid",
        "action": "mermaid-render"
      },
      {
        "selector": ".markdown-body",
        "action": "html-to-markdown"
      }
    ]
  }
]
```

## 支持的动作

- `mermaid-render`: 将匹配的元素内容渲染为Mermaid图表
- `html-to-markdown`: 在匹配的元素上添加右键菜单，将选中的HTML转换为Markdown

## 许可

MIT
