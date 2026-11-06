export default function Badge({ children, variant = 'default', size = 'sm' }) {
  const variants = {
    default: 'bg-gray-700 text-gray-300',
    success: 'bg-green-500/15 text-green-400 border border-green-500/30',
    danger: 'bg-red-500/15 text-red-400 border border-red-500/30',
    warning: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
    info: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    call: 'bg-green-500/15 text-green-400 border border-green-500/30',
    put: 'bg-red-500/15 text-red-400 border border-red-500/30',
  }

  const sizes = {
    xs: 'text-xs px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  }

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  )
}
