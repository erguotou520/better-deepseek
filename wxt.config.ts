import { fileURLToPath } from 'node:url';
import { defineConfig } from 'wxt';
import toUtf8 from "./scripts/vite-plugin-to-utf8";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  alias: {
    '@': fileURLToPath(new URL('./', import.meta.url))
  },
  publicDir: './public',
  manifest: {
    name: 'Better DeepSeek',
    description: '增强浏览体验，支持Mermaid渲染和HTML到Markdown转换',
    version: '1.0.0',
    permissions: ['storage', 'activeTab', 'clipboardWrite', 'contextMenus', 'tabs'],
    host_permissions: ['<all_urls>'],
    // content_scripts: [
    //   {
    //     matches: ['<all_urls>'],
    //     js: ['entrypoints/content.ts'],
    //     run_at: 'document_idle'
    //   }
    // ]
  },
	vite(env){
		return {
			plugins: [toUtf8()],
			// optimizeDeps: {
			// 	include: ['mermaid']
			// },
			// build: {
			// 	rollupOptions: {
			// 		output: {
			// 			manualChunks: {
			// 				mermaid: ['mermaid']
			// 			}
			// 		}
			// 	}
			// }
		}
	}
});
