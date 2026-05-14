import Link from 'next/link'

const items = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Analytics', href: '/analytics' },
  { label: 'Risk Insights', href: '/risks' },
  { label: 'Obligations', href: '/obligations' },
  { label: 'Ask AI', href: '/ask-ai' },
]

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-slate-800 bg-slate-950/70 backdrop-blur-xl">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold text-sky-400">
          Contract Lens
        </h1>

        <p className="text-xs text-slate-500 mt-1">
          Intelligence Suite
        </p>
      </div>

      <nav className="p-4 space-y-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-lg px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}