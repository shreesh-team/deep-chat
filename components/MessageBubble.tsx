import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Message } from '@/types'

interface Props {
  message: Message
}

export default function MessageBubble({ message }: Props) {
  const { role, content, isOptimistic } = message

  if (role === 'system') {
    return (
      <div className="mx-auto text-center text-xs text-gray-400 italic px-2 py-1">
        {content}
      </div>
    )
  }

  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div
          className={`max-w-[70%] bg-gray-900 text-white rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
            isOptimistic ? 'opacity-60' : ''
          }`}
        >
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className={`max-w-[70%] bg-gray-100 text-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed ${isOptimistic ? 'opacity-60' : ''}`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
            h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h1>,
            h2: ({ children }) => <h2 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h2>,
            h3: ({ children }) => <h3 className="text-sm font-bold mb-1 mt-2 first:mt-0">{children}</h3>,
            ul: ({ children }) => <ul className="list-disc list-outside pl-4 mb-3 last:mb-0 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal list-outside pl-4 mb-3 last:mb-0 space-y-1">{children}</ol>,
            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
            blockquote: ({ children }) => (
              <blockquote className="border-l-2 border-gray-300 pl-3 my-2 text-gray-500 italic">{children}</blockquote>
            ),
            code: ({ children, className }) => {
              const isBlock = className?.startsWith('language-')
              return isBlock ? (
                <code className="block bg-gray-800 text-gray-100 rounded-lg px-4 py-3 my-2 text-xs font-mono overflow-x-auto whitespace-pre">
                  {children}
                </code>
              ) : (
                <code className="bg-gray-200 text-gray-800 rounded px-1 py-0.5 text-xs font-mono">{children}</code>
              )
            },
            pre: ({ children }) => <pre className="my-2">{children}</pre>,
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
                {children}
              </a>
            ),
            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
            hr: () => <hr className="border-gray-300 my-3" />,
            table: ({ children }) => (
              <div className="overflow-x-auto my-3">
                <table className="min-w-full text-xs border-collapse">{children}</table>
              </div>
            ),
            th: ({ children }) => <th className="border border-gray-300 bg-gray-200 px-3 py-1.5 text-left font-semibold">{children}</th>,
            td: ({ children }) => <td className="border border-gray-300 px-3 py-1.5">{children}</td>,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  )
}
