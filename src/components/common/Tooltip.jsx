import { useState } from 'react'

export default function Tooltip({ children, content, className = '' }) {
  const [visible, setVisible] = useState(false)

  return (
    <span
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <span className="border-b border-dotted border-blue-400 cursor-help text-blue-400">
        {children}
      </span>
      {visible && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-xs text-gray-300 leading-relaxed">{content}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-700" />
        </div>
      )}
    </span>
  )
}
