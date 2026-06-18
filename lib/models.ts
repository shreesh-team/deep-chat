export type Provider = 'anthropic' | 'openai' | 'google' | 'unknown'

export interface ModelInfo {
  model: string
  label: string
  provider: Provider
}

export const MODEL_LIST: ModelInfo[] = [
  { model: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', provider: 'google' },
]

export const PROVIDERS: { id: Provider; label: string }[] = [
  { id: 'google', label: 'Google' },
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
