import html2md from 'html-to-md';

const html = `
<h1>HTML到Markdown转换测试</h1>
<h2>标题和段落</h2>
<p>这是一个<strong>粗体文本</strong>和<em>斜体文本</em>的段落。</p>
<p>这是包含<code>行内代码</code>的文本。</p>

<h2>列表</h2>
<ul>
  <li>无序列表项1</li>
  <li>无序列表项2
    <ul>
      <li>嵌套列表项</li>
    </ul>
  </li>
</ul>

<ol>
  <li>有序列表项1</li>
  <li>有序列表项2</li>
</ol>

<h2>链接和图片</h2>
<p><a href="https://example.com">这是一个链接</a></p>
<p><img src="https://example.com/image.jpg" alt="示例图片"></p>

<h2>引用和代码块</h2>
<blockquote>
  <p>这是一段引用文本</p>
  <p>多行引用</p>
</blockquote>

<pre><code>// 这是一个代码块
function test() {
  console.log("Hello, World!");
}
</code></pre>

<h2>表格</h2>
<table>
  <thead>
    <tr>
      <th>表头1</th>
      <th>表头2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>单元格1</td>
      <td>单元格2</td>
    </tr>
    <tr>
      <td>单元格3</td>
      <td>单元格4</td>
    </tr>
  </tbody>
</table>
`;
const markdown = html2md(html, {}, false);
console.log(markdown);