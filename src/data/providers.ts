import type { ProviderPreset } from '@/types';

export const providerPresets: ProviderPreset[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    apiBaseUrl: 'https://api.deepseek.com/v1',
    models: ['deepseek-v4-pro', 'deepseek-v4-flash'],
    defaultModel: 'deepseek-v4-flash',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    apiBaseUrl: 'https://api.openai.com/v1',
    models: ['gpt-5.5', 'gpt-5.5-pro', 'gpt-5.4', 'gpt-5.4-mini', 'gpt-5.4-nano', 'gpt-4.1', 'o4-mini'],
    defaultModel: 'gpt-5.4-mini',
  },
  {
    id: 'zhipu',
    name: '智谱 GLM',
    apiBaseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    models: ['glm-4.7-flash', 'glm-4.7', 'glm-4.6', 'glm-4.5'],
    defaultModel: 'glm-4.7-flash',
  },
  {
    id: 'moonshot',
    name: 'Moonshot',
    apiBaseUrl: 'https://api.moonshot.ai/v1',
    models: ['kimi-k2.6', 'kimi-k2.5', 'kimi-k2-0905-preview'],
    defaultModel: 'kimi-k2.6',
  },
  {
    id: 'qwen',
    name: '通义千问',
    apiBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: ['qwen3.6-max-preview', 'qwen3.6-plus', 'qwen3.6-flash', 'qwen3.5-plus'],
    defaultModel: 'qwen3.6-flash',
  },
  {
    id: 'custom',
    name: '自定义',
    apiBaseUrl: '',
    models: [],
    defaultModel: '',
  },
];

export function getProviderById(id: string): ProviderPreset | undefined {
  return providerPresets.find((p) => p.id === id);
}
