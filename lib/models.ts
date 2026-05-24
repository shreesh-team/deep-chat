export type Provider = 'anthropic' | 'openai' | 'google' | 'unknown'

export interface ModelInfo {
  model: string
  label: string
  provider: Provider
}

export const MODEL_LIST: ModelInfo[] = [
  { model: 'claude-opus-4-7',   label: 'Claude Opus 4.7',    provider: 'anthropic' },
  { model: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6',  provider: 'anthropic' },
  { model: 'claude-haiku-4-5',  label: 'Claude Haiku 4.5',   provider: 'anthropic' },
  { model: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5',  provider: 'anthropic' },
  { model: 'gpt-4o',            label: 'GPT-4o',             provider: 'openai'    },
  { model: 'gpt-4o-mini',       label: 'GPT-4o Mini',        provider: 'openai'    },
  { model: 'gpt-4-turbo',       label: 'GPT-4 Turbo',        provider: 'openai'    },
  { model: 'gpt-3.5-turbo',     label: 'GPT-3.5 Turbo',      provider: 'openai'    },
  { model: 'gemini-2.0-flash',  label: 'Gemini 2.0 Flash',   provider: 'google'    },
  { model: 'gemini-1.5-pro',    label: 'Gemini 1.5 Pro',     provider: 'google'    },
  { model: 'gemini-1.5-flash',  label: 'Gemini 1.5 Flash',   provider: 'google'    },
]

export const PROVIDERS: { id: Provider; label: string }[] = [
  { id: 'anthropic', label: 'Anthropic' },
  { id: 'openai',    label: 'OpenAI'    },
  { id: 'google',    label: 'Google'    },
]

export const API_KEY_PREFIX = 'apiKey_'

export function getApiKey(provider: Provider): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(`${API_KEY_PREFIX}${provider}`)
}

export function setApiKey(provider: Provider, key: string): void {
  localStorage.setItem(`${API_KEY_PREFIX}${provider}`, key)
}

export function removeApiKey(provider: Provider): void {
  localStorage.removeItem(`${API_KEY_PREFIX}${provider}`)
}

export function getProviderForModel(model: string): Provider {
  return MODEL_LIST.find(m => m.model === model)?.provider ?? 'unknown'
}

export function getAvailableModels(): ModelInfo[] {
  return MODEL_LIST.filter(m => m.provider === 'unknown' || !!getApiKey(m.provider))
}
