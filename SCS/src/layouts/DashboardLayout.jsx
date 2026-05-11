import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { cn } from '@/lib/utils'

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-100 overflow-x-hidden">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div
        className={cn(
          'min-h-screen transition-[padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:pl-[var(--sidebar-width)]',
          collapsed && 'lg:pl-[var(--sidebar-collapsed-width)]',
        )}
      >
        <Topbar
          collapsed={collapsed}
          onOpenMobile={() => setMobileOpen(true)}
          onToggleSidebar={() => setCollapsed((value) => !value)}
        />
        <main className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
