import { Bell, ChevronDown, LogOut, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { notificationsPathByRole } from '@/constants/navigation'
import { ROLE_LABELS, resolveHomePath } from '@/constants/roles'
import { confirmAction, toast } from '@/lib/alerts'
import { formatDate, getInitials } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useClearance } from '@/hooks/useClearance'

export function Topbar({ collapsed, onToggleSidebar, onOpenMobile }) {
  const navigate = useNavigate()
  const { profile, profiles, logout, switchProfile } = useAuth()
  const { getUnreadNotificationCount, getUserNotifications, markNotificationRead } =
    useClearance()
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const notificationPath = notificationsPathByRole[profile.role] || '/'
  const recentNotifications = useMemo(
    () => getUserNotifications(profile.id).slice(0, 4),
    [getUserNotifications, profile.id],
  )

  const unreadCount = getUnreadNotificationCount(profile.id)

  async function handleLogout() {
    const result = await confirmAction({
      title: 'Sign out?',
      text: 'You will return to the secure login page.',
      confirmButtonText: 'Sign out',
      icon: 'warning',
    })

    if (result.isConfirmed) {
      try {
        await logout()
        toast('Signed out successfully')
      } catch (error) {
        toast(error.message || 'Signed out locally', 'success')
      } finally {
        navigate('/login')
      }
    }
  }

  function handleSwitchProfile(profileId) {
    const nextProfile = profiles.find((item) => item.id === profileId)
    switchProfile(profileId)
    setProfileOpen(false)
    setNotificationOpen(false)
    navigate(nextProfile ? resolveHomePath(nextProfile) : '/')
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            className="lg:hidden"
            onClick={onOpenMobile}
            size="icon"
            type="button"
            variant="ghost"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Button
            className="hidden lg:inline-flex"
            onClick={onToggleSidebar}
            size="icon"
            type="button"
            variant="ghost"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </Button>
          <div className="min-w-0">
            <Breadcrumbs />
            <p className="mt-1 truncate text-sm font-semibold text-slate-950">
              {ROLE_LABELS[profile.role]} Console
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              aria-label="Open notifications"
              className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950"
              onClick={() => {
                setNotificationOpen((value) => !value)
                setProfileOpen(false)
              }}
              type="button"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div className="absolute right-0 mt-2 w-[360px] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <p className="font-bold text-slate-950">Notifications</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {unreadCount} unread update(s) for this account
                    </p>
                  </div>
                  <Button asChild size="sm" variant="ghost">
                    <Link onClick={() => setNotificationOpen(false)} to={notificationPath}>
                      View all
                    </Link>
                  </Button>
                </div>

                <div className="mt-3 space-y-2">
                  {recentNotifications.length ? (
                    recentNotifications.map((notification) => (
                      <div
                        className="rounded-2xl border border-slate-100 px-3 py-3 transition hover:border-blue-200 hover:bg-slate-50/80"
                        key={notification.id}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-semibold text-slate-950">
                                {notification.title}
                              </p>
                              {!notification.is_read && (
                                <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                              )}
                            </div>
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">
                              {notification.message}
                            </p>
                            <p className="mt-2 text-[11px] font-medium text-slate-500">
                              {formatDate(notification.created_at)}
                            </p>
                          </div>
                          {!notification.is_read && (
                            <Button
                              className="shrink-0"
                              onClick={() => markNotificationRead(notification.id)}
                              size="sm"
                              type="button"
                              variant="outline"
                            >
                              Read
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-5 text-sm text-slate-600">
                      No notifications yet for this account.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              className="flex min-h-10 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-2 py-1 shadow-sm hover:bg-slate-50"
              onClick={() => {
                setProfileOpen((value) => !value)
                setNotificationOpen(false)
              }}
              type="button"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-950 text-xs font-bold text-white">
                {getInitials(profile.full_name)}
              </div>
              <div className="hidden text-left md:block">
                <p className="text-sm font-bold text-slate-950">
                  {profile.full_name}
                </p>
                <p className="text-xs text-slate-500">{ROLE_LABELS[profile.role]}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-500" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                <div className="border-b border-slate-100 pb-3">
                  <p className="font-bold text-slate-950">{profile.full_name}</p>
                  <p className="text-sm text-slate-500">{profile.email}</p>
                </div>
                <div className="py-3">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Demo account switcher
                  </p>
                  <Select
                    onChange={(event) => handleSwitchProfile(event.target.value)}
                    value={profile.id}
                  >
                    {profiles.map((item) => (
                      <option key={item.id} value={item.id}>
                        {ROLE_LABELS[item.role]} - {item.full_name}
                      </option>
                    ))}
                  </Select>
                </div>
                <Button
                  className="w-full justify-start"
                  onClick={handleLogout}
                  type="button"
                  variant="ghost"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
