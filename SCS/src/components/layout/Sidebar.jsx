import { useState } from 'react'
import {
  BadgeCheck,
  BarChart3,
  Bell,
  BookOpenText,
  Building2,
  ChevronDown,
  Circle,
  ClipboardCheck,
  FileSearch,
  GraduationCap,
  History,
  LayoutDashboard,
  ListChecks,
  Rows3,
  Send,
  Settings,
  ShieldCheck,
  Table2,
  UserRound,
  Users,
  Workflow,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { navigationGroups, resolveNavigationPath } from '@/constants/navigation'
import { ROLE_LABELS } from '@/constants/roles'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import mabiniLogo from '@/assets/mabinilogo.jpg'

const iconMap = {
  BadgeCheck,
  BarChart3,
  Bell,
  BookOpenText,
  Building2,
  ClipboardCheck,
  FileSearch,
  GraduationCap,
  History,
  LayoutDashboard,
  ListChecks,
  Rows3,
  Send,
  Settings,
  ShieldCheck,
  Table2,
  UserRound,
  Users,
  Workflow,
}

function NavIcon({ name }) {
  const Icon = iconMap[name] || Circle
  return <Icon className="h-5 w-5 shrink-0" />
}

export function Sidebar({ collapsed, mobileOpen, onCloseMobile }) {
  const { profile } = useAuth()
  const [openGroups, setOpenGroups] = useState(() => ({}))
  const groups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(profile.role)),
    }))
    .filter((group) => group.items.length)

  function isGroupOpen(label) {
    return openGroups[label] ?? true
  }

  function toggleGroup(label) {
    setOpenGroups((current) => ({
      ...current,
      [label]: !isGroupOpen(label),
    }))
  }

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden',
          mobileOpen ? 'block' : 'hidden',
        )}
        onClick={onCloseMobile}
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[var(--sidebar-width)] flex-col border-r border-white/10 bg-[linear-gradient(180deg,#06152f_0%,#091d42_52%,#041126_100%)] text-white shadow-2xl transition-[width,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
          collapsed && 'lg:w-[var(--sidebar-collapsed-width)]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex min-h-24 items-center gap-3 overflow-hidden border-b border-white/10 px-4">
          <img
            alt="Mabini Colleges logo"
            className="h-12 w-12 shrink-0 rounded-2xl border border-white/20 bg-white object-cover p-1 shadow-lg shadow-blue-950/30"
            src={mabiniLogo}
          />
          <div
            className={cn(
              'min-w-0 overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-300 ease-out lg:max-w-52',
              collapsed && 'lg:max-w-0 lg:-translate-x-2 lg:opacity-0',
            )}
          >
            <p className="truncate text-sm font-bold uppercase tracking-wide text-blue-100">
              Mabini Colleges
            </p>
            <p className="truncate text-[13px] font-semibold text-white/90">
              Student Clearance System
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5">
          {groups.map((group) => (
            <div className="mb-6" key={group.label}>
              <button
                className={cn(
                  'mb-2 flex min-h-8 w-full items-center justify-between rounded-xl px-3 text-left text-[11px] font-bold uppercase tracking-wide text-blue-200/65 transition hover:bg-white/10 hover:text-blue-100',
                  collapsed && 'lg:pointer-events-none lg:justify-center lg:px-0',
                )}
                onClick={() => toggleGroup(group.label)}
                type="button"
              >
                <span
                  className={cn(
                    'truncate transition-[max-width,opacity] duration-300 lg:max-w-44',
                    collapsed && 'lg:max-w-0 lg:opacity-0',
                  )}
                >
                  {group.label}
                </span>
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 shrink-0 transition-transform duration-300',
                    !isGroupOpen(group.label) && '-rotate-90',
                    collapsed && 'lg:hidden',
                  )}
                />
              </button>
              <div
                className={cn(
                  'grid transition-[grid-template-rows,opacity] duration-300 ease-out',
                  isGroupOpen(group.label) || collapsed
                    ? 'grid-rows-[1fr] opacity-100'
                    : 'grid-rows-[0fr] opacity-0',
                )}
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="grid gap-1">
                    {group.items.map((item) => {
                      const path = resolveNavigationPath(item, profile.role)
                      return (
                        <NavLink
                          className={({ isActive }) =>
                            cn(
                              'group/nav flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-semibold transition-[background,color,box-shadow,transform,padding] duration-200 ease-out hover:translate-x-0.5',
                              isActive
                                ? 'bg-white text-blue-950 shadow-lg shadow-blue-950/20'
                                : 'text-blue-100/80 hover:bg-white/10 hover:text-white',
                              collapsed && 'lg:justify-center lg:px-0 lg:hover:translate-x-0',
                            )
                          }
                          key={`${item.title}-${path}`}
                          onClick={onCloseMobile}
                          title={collapsed ? item.title : undefined}
                          to={path}
                        >
                          <NavIcon name={item.icon} />
                          <span
                            className={cn(
                              'min-w-0 truncate transition-[max-width,opacity,transform] duration-300 ease-out lg:max-w-48',
                              collapsed &&
                                'lg:max-w-0 lg:-translate-x-1 lg:opacity-0',
                            )}
                          >
                            {item.title}
                          </span>
                        </NavLink>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 p-4">
          <div
            className={cn(
              'flex items-center gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/10 p-3 shadow-lg shadow-blue-950/20 backdrop-blur transition-[padding] duration-300',
              collapsed && 'lg:justify-center lg:p-2',
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-black text-blue-950">
              {profile.full_name
                .split(' ')
                .slice(0, 2)
                .map((part) => part[0])
                .join('')}
            </div>
            <div
              className={cn(
                'min-w-0 overflow-hidden transition-[max-width,opacity,transform] duration-300 ease-out lg:max-w-48',
                collapsed && 'lg:max-w-0 lg:-translate-x-2 lg:opacity-0',
              )}
            >
              <p className="truncate text-sm font-bold text-white">
                {profile.full_name}
              </p>
              <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-blue-100/70">
                <span className="truncate font-semibold">{ROLE_LABELS[profile.role]}</span>
                {profile.student_no && (
                  <>
                    <span className="text-blue-100/35">•</span>
                    <span className="truncate">No. {profile.student_no}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
