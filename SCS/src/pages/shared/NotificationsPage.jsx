import { CheckCheck } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { useClearance } from '@/hooks/useClearance'
import { formatDate } from '@/lib/utils'

export function NotificationsPage() {
  const { profile } = useAuth()
  const {
    getUnreadNotificationCount,
    getUserNotifications,
    markAllNotificationsRead,
    markNotificationRead,
  } = useClearance()
  const userNotifications = getUserNotifications(profile.id)
  const unreadCount = getUnreadNotificationCount(profile.id)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Notification center"
        title="Notifications"
        description="Important clearance actions, status updates, and report notices appear here."
      />

      {userNotifications.length ? (
        <Card>
          <CardContent className="p-0">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  {userNotifications.length} notification(s)
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {unreadCount} unread update(s) for your account
                </p>
              </div>
              <Button
                disabled={unreadCount === 0}
                onClick={() => markAllNotificationsRead(profile.id)}
                size="sm"
                type="button"
                variant="outline"
              >
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </Button>
            </div>
            <div className="divide-y divide-slate-100">
            {userNotifications.map((notification) => (
              <div
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between"
                key={notification.id}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-950">
                      {notification.title}
                    </p>
                    <StatusBadge status={notification.is_read ? 'Read' : 'Unread'} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {notification.message}
                  </p>
                  <p className="mt-2 text-xs font-medium text-slate-500">
                    {formatDate(notification.created_at)}
                  </p>
                </div>
                {!notification.is_read && (
                  <Button
                    onClick={() => markNotificationRead(notification.id)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <CheckCheck className="h-4 w-4" />
                    Mark read
                  </Button>
                )}
              </div>
            ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          description="You currently have no clearance notifications."
          title="No notifications"
        />
      )}
    </div>
  )
}
