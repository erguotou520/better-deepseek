import { useCallback, useEffect, useState } from 'react'
import './App.css'

// 动作接口定义
interface Action {
  selector: string
  action: string
  name?: string
  description?: string
}

function App() {
  const [configState, setConfigState] = useState<{
    lastUpdated: number
    error?: string
    syncingConfig: boolean
    matchingActions: Action[]
    currentUrl?: string
    debug?: string
  }>({
    lastUpdated: 0,
    error: undefined,
    syncingConfig: false,
    matchingActions: []
  })

  const loadActionData = useCallback(async () => {
    try {
      // 获取当前标签匹配的动作
      const tabs = await browser.tabs.query({ active: true, currentWindow: true })
      if (tabs.length > 0 && tabs[0].url) {
        const currentUrl = tabs[0].url
        // console.log("当前URL:", currentUrl);

        setConfigState(prev => ({
          ...prev,
          currentUrl
        }))

        const response = await browser.runtime.sendMessage({
          action: 'checkRules',
          url: currentUrl
        })

        // console.log("checkRules响应:", response);

        if (response?.actions) {
          setConfigState(prev => ({
            ...prev,
            matchingActions: response.actions,
            debug: `动作数量: ${response.actions.length}`
          }))
        } else {
          setConfigState(prev => ({
            ...prev,
            matchingActions: [],
            debug: '无匹配动作'
          }))
        }
      } else {
        setConfigState(prev => ({
          ...prev,
          debug: '无法获取当前标签URL'
        }))
      }
    } catch (error) {
      console.error('获取动作数据失败', error)
      setConfigState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '获取动作数据失败'
      }))
    }
  }, [])

  useEffect(() => {
    // 获取配置状态
    void browser.runtime.sendMessage({ action: 'getConfigState' }).then(response => {
      if (response?.state) {
        setConfigState(prev => ({
          ...prev,
          lastUpdated: response.state.lastUpdated,
          error: response.state.error
        }))
      }
    })

    // 加载动作数据
    void loadActionData()
  }, [loadActionData])

  const handleSyncConfig = async () => {
    setConfigState(prev => ({ ...prev, syncingConfig: true }))

    try {
      const response = await browser.runtime.sendMessage({ action: 'syncConfig' })
      setConfigState(prev => ({
        ...prev,
        syncingConfig: false,
        lastUpdated: Date.now(),
        error: response.error
      }))

      // 同步后重新获取当前标签匹配的动作
      await loadActionData()
    } catch (error) {
      setConfigState(prev => ({
        ...prev,
        syncingConfig: false,
        error: error instanceof Error ? error.message : '未知错误'
      }))
    }
  }

  const formatDate = (timestamp: number) => {
    if (!timestamp) return '未同步'
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="popup-container">
      <h1>Better DeepSeek</h1>

      <div className="status-section">
        <div className="status-item">
          <span className="status-label">上次同步：</span>
          <span className="status-value">{formatDate(configState.lastUpdated)}</span>
        </div>

        {configState.error && <div className="error-message">错误：{configState.error}</div>}
      </div>

      {configState.matchingActions.length > 0 ? (
        <div className="actions-section">
          <h2>当前页面适用动作</h2>
          <ul className="actions-list">
            {configState.matchingActions.map((action, index) => (
              <li key={`action-${index}-${action.selector}`} className="action-item">
                <div className="action-header">
                  <span className="action-name">{action.name || action.action}</span>
                </div>
                {action.description && <div className="action-description">{action.description}</div>}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="actions-section">
          <h2>当前页面适用动作</h2>
          <div className="no-actions">无可用动作</div>
        </div>
      )}

      <div className="action-section">
        <button className="sync-button" onClick={handleSyncConfig} disabled={configState.syncingConfig} type="button">
          {configState.syncingConfig ? '同步中...' : '同步配置'}
        </button>
      </div>
    </div>
  )
}

export default App
