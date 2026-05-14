import Sidebar from './Sidebar'
import Navbar from './Navbar'

interface Props {
  children: React.ReactNode
}

export default function AppLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-[#0d1322] text-slate-100">
      <Sidebar />

      <div className="ml-64 min-h-screen">
        <Navbar />

        <main className="pt-20 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}