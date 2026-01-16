import { NavLink } from 'react-router-dom'
import { Home, Dumbbell, FolderOpen, History, LogOut, User, Users } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { cn } from '../../lib/utils'

const navItems = [
  { path: '/', label: 'Inicio', icon: Home },
  { path: '/routines', label: 'Rutinas', icon: Dumbbell },
  { path: '/library', label: 'Biblioteca', icon: FolderOpen },
  { path: '/history', label: 'Historial', icon: History },
  { path: '/profile', label: 'Perfil', icon: User },
  { path: '/friends', label: 'Amigos', icon: Users },
]

export function Sidebar() {
  const { signOut } = useAuth()

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-[var(--bg-secondary)] border-r border-[var(--border)] fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-[var(--border)]">
        <h1 className="text-xl font-bold text-[var(--primary)] flex items-center gap-2">
          <Dumbbell className="w-6 h-6" />
          MisRutinas
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-[var(--primary)] text-white'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-[var(--border)]">
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--danger)] transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  )
}
