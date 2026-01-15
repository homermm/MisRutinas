import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

export function Layout({ children }) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Desktop Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <main className="md:ml-64 pb-20 md:pb-0 min-h-screen">
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <BottomNav />
    </div>
  )
}
