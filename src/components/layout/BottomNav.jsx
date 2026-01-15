import { NavLink } from 'react-router-dom'
import { Home, Dumbbell, FolderOpen, Timer } from 'lucide-react'
import { cn } from '../../lib/utils'

const navItems = [
  { path: '/', label: 'Inicio', icon: Home },
  { path: '/routines', label: 'Rutinas', icon: Dumbbell },
  { path: '/library', label: 'Biblioteca', icon: FolderOpen },
  { path: '/timer', label: 'Cronómetro', icon: Timer },
]

export function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass safe-bottom">
      <ul className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all duration-200',
                  isActive
                    ? 'text-[var(--primary)]'
                    : 'text-[var(--text-muted)]'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn('w-5 h-5', isActive && 'scale-110')} />
                  <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
