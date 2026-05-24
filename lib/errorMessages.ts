const ERROR_MESSAGES: Record<string, string> = {
  CONVERSATION_NOT_FOUND: 'Conversation not found.',
  CONVERSATION_CANCELLED: 'This conversation has been cancelled.',
  MISSING_FIELD: 'Please fill in all required fields.',
  INTERNAL_ERROR: 'Something went wrong. Please try again.',
  NETWORK_ERROR: 'Could not reach server. Check your connection.',
}

export function getFriendlyError(code: string, fallback?: string): string {
  return ERROR_MESSAGES[code] ?? fallback ?? 'An unexpected error occurred.'
}
