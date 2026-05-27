import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Zap, Globe, Thermometer, Wifi, CheckCircle, XCircle, Loader2, ShieldAlert, ChevronDown, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { ApiKeyInput } from '@/components/settings/ApiKeyInput';
import { ProviderPicker } from '@/components/settings/ProviderPicker';
import { ModelPicker } from '@/components/settings/ModelPicker';
import { cn } from '@/utils/cn';

type TestStatus = 'idle' | 'testing' | 'success' | 'failed';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { settings, setApiBaseUrl, setApiKey, setTemperature, setCustomPrompt } = useSettingsStore();
  const isCustom = settings.provider === 'custom';
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testResult, setTestResult] = useState<{ message: string; latency?: number } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const testConnection = useCallback(async () => {
    if (!settings.apiBaseUrl || !settings.apiKey) return;
    setTestStatus('testing');
    setTestResult(null);

    const startTime = performance.now();
    try {
      const response = await fetch(`${settings.apiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify({
          model: settings.model,
          temperature: 0,
          messages: [{ role: 'user', content: '你好' }],
          max_tokens: 20,
        }),
      });

      const latency = Math.round(performance.now() - startTime);

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        let errMsg = `HTTP ${response.status}`;
        try {
          const errJson = JSON.parse(errText);
          errMsg = errJson.error?.message || errJson.message || errMsg;
        } catch {
          if (errText) errMsg = errText.slice(0, 200);
        }
        setTestStatus('failed');
        setTestResult({ message: errMsg, latency });
        return;
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || '';
      setTestStatus('success');
      setTestResult({ message: reply.slice(0, 100), latency });
    } catch (err: any) {
      const latency = Math.round(performance.now() - startTime);
      setTestStatus('failed');
      setTestResult({ message: err.message || '网络请求失败', latency });
    }
  }, [settings.apiBaseUrl, settings.apiKey, settings.model]);

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Settings size={22} className="text-[#A78BFA]" />
        <h1 className="text-xl font-bold text-[#E8E6F0]">设置</h1>
      </div>

      <GlassPanel className="mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={16} className="text-[#FBBF24]" />
          <h2 className="text-sm font-bold text-[#E8E6F0]">AI 配置</h2>
        </div>

        <div className="space-y-4">
          <ProviderPicker />

          {isCustom && (
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-[#9D99B5] mb-1.5">
                <Globe size={12} />
                API 地址
              </label>
              <input
                value={settings.apiBaseUrl}
                onChange={(e) => setApiBaseUrl(e.target.value)}
                placeholder="https://api.example.com/v1"
                className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-[#E8E6F0] placeholder-[#6B6680] focus:outline-none focus:border-[#A78BFA]/40"
              />
              <p className="text-[10px] text-[#6B6680] mt-1">支持任意 OpenAI 兼容 API 地址</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#9D99B5] mb-1.5">API Key</label>
            <ApiKeyInput value={settings.apiKey} onChange={setApiKey} />
            <p className="text-[10px] text-[#6B6680] mt-1">密钥仅存储在本地浏览器中</p>
          </div>

          <ModelPicker />

          {/* Test Connection */}
          <div className="pt-1">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              disabled={testStatus === 'testing' || !settings.apiBaseUrl || !settings.apiKey}
              onClick={testConnection}
              className={cn(
                'w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors',
                testStatus === 'testing'
                  ? 'bg-[#FBBF24]/10 text-[#FBBF24]'
                  : testStatus === 'success'
                    ? 'bg-[#5EEAD4]/10 text-[#5EEAD4]'
                    : testStatus === 'failed'
                      ? 'bg-[#FB7185]/10 text-[#FB7185]'
                      : 'bg-white/[0.06] text-[#9D99B5] hover:bg-white/[0.1] hover:text-[#E8E6F0] disabled:opacity-40 disabled:cursor-not-allowed'
              )}
            >
              {testStatus === 'testing' ? (
                <Loader2 size={16} className="animate-spin" />
              ) : testStatus === 'success' ? (
                <CheckCircle size={16} />
              ) : testStatus === 'failed' ? (
                <XCircle size={16} />
              ) : (
                <Wifi size={16} />
              )}
              {testStatus === 'testing' ? '正在测试...' : '测试连接'}
            </motion.button>

            <AnimatePresence>
              {testResult && testStatus !== 'testing' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div
                    className={cn(
                      'mt-2 px-3 py-2 rounded-lg text-xs',
                      testStatus === 'success'
                        ? 'bg-[#5EEAD4]/8 border border-[#5EEAD4]/20 text-[#5EEAD4]'
                        : 'bg-[#FB7185]/8 border border-[#FB7185]/20 text-[#FB7185]'
                    )}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold">{testStatus === 'success' ? '连接成功' : '连接失败'}</span>
                      {testResult.latency !== undefined && (
                        <span className="opacity-70">{testResult.latency}ms</span>
                      )}
                    </div>
                    <p className="opacity-80 break-all">{testResult.message}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-[#9D99B5] mb-1.5">
              <Thermometer size={12} />
              Temperature: {settings.temperature}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-[#A78BFA]"
            />
            <div className="flex justify-between text-[10px] text-[#6B6680] mt-0.5">
              <span>精确 (0)</span>
              <span>创意 (1)</span>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="pt-2 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between py-1 text-xs font-medium text-[#9D99B5] hover:text-[#E8E6F0] transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <SlidersHorizontal size={12} />
                高级设置
              </span>
              {showAdvanced ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 space-y-3"
              >
                <div>
                  <label className="block text-xs font-medium text-[#9D99B5] mb-1.5">
                    自定义 AI 提示词
                  </label>
                  <textarea
                    value={settings.customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder={`这里可以给 AI 主持人"加戏"，比如：

让 AI 更友好一点
让 AI 扮演侦探角色
让 AI 在每次回答后给个小提示
修改ai的回答问题的权重`}
                    rows={5}
                    className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-[#E8E6F0] placeholder-[#6B6680] focus:outline-none focus:border-[#A78BFA]/40 resize-none"
                  />
                  <p className="text-[10px] text-[#6B6680] mt-1">
                    高级玩家可自定义 AI 主持人的行为和提示词风格。留空则使用默认设置。
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </GlassPanel>

      <GlassPanel>
        <h2 className="text-sm font-bold text-[#E8E6F0] mb-3">关于</h2>
        <div className="space-y-2 text-xs text-[#9D99B5]">
          <p>AI主持人海龟汤，由 AI 主持的情境推理谜题游戏（Situation Puzzle / Lateral Thinking Puzzle）。</p>
          <p>玩家向 AI 主持人提问"是/否"问题来还原故事真相。</p>
          <p className="text-[#6B6680] mt-3">Version 1.0.0</p>
        </div>
      </GlassPanel>

      <div className="mt-6 pt-4 border-t border-white/[0.06] text-center">
        <button
          onClick={() => window.open('http://localhost:3001/admin', '_blank')}
          className="inline-flex items-center gap-1.5 text-xs text-[#6B6680] hover:text-[#A78BFA] transition-colors"
        >
          <ShieldAlert size={12} />
          管理员入口
        </button>
      </div>
    </div>
  );
}
