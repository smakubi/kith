'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  CircleDot,
  LogOut,
  Heart,
  Settings,
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', href: '/',        icon: LayoutDashboard },
  { label: 'People',    href: '/people',   icon: Users },
  { label: 'Circles',  href: '/circles',  icon: CircleDot },
]

interface SidebarProps {
  userName?: string | null
  userEmail?: string | null
}

export function Sidebar({ userName, userEmail }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-60 shrink-0 hidden md:flex flex-col bg-slate-900 min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-rose-500 flex items-center justify-center">
          <Heart className="w-4 h-4 text-white fill-white" strokeWidth={1.8} />
        </div>
        <span className="text-white font-bold text-lg tracking-tight">Kith</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active =
            href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-rose-500 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800',
              )}
            >
              <Icon className="w-[15px] h-[15px]" strokeWidth={1.8} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-slate-800 p-3 space-y-1">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <Settings className="w-[15px] h-[15px]" strokeWidth={1.8} />
          Settings
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <LogOut className="w-[15px] h-[15px]" strokeWidth={1.8} />
          Sign out
        </button>
        {/* User info */}
        <div className="px-3 py-2 mt-2">
          <p className="text-sm font-medium text-white truncate">{userName ?? 'You'}</p>
          <p className="text-xs text-slate-500 truncate">{userEmail}</p>
        </div>
      </div>
    </aside>
  )
}
