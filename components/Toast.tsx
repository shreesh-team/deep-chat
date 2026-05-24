import type { Toast as ToastType } from '@/lib/useToast'

interface Props {
  toast: ToastType
  onDismiss: (id: string) => void
}

const styles: Record<ToastType['type'], string> = {
  error: 'bg-red-50 border-red-100 text-red-700',
  success: 'bg-green-50 border-green-100 text-green-700',
  info: 'bg-gray-50 border-gray-200 text-gray-700',
}

export default function Toast({ toast, onDismiss }: Props) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-sm text-sm font-medium min-w-[260px] max-w-[360px] ${styles[toast.type]}`}
    >
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="1" y1="1" x2="13" y2="13" />
          <line x1="13" y1="1" x2="1" y2="13" />
        </svg>
      </button>
    </div>
  )
}
