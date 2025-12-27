import { useMemo, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { NotificationItem } from "@/types";
import notificationService from "@/services/notificationService";
import { cn } from "@/lib/utils";

export function NotificationsBell() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    data: notifications = [],
    isFetching,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationService.getNotifications(),
    refetchInterval: 45_000,
    staleTime: 15_000,
  });

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const handleNotificationClick = useCallback(
    async (notification: NotificationItem) => {
      if (!notification.isRead) {
        await markReadMutation.mutateAsync(notification.id);
      }

      if (notification.actionUrl) {
        navigate(notification.actionUrl);
      }
    },
    [markReadMutation, navigate],
  );

  const headerSubtitle =
    unreadCount > 0
      ? `${unreadCount} unread`
      : notifications.length
      ? "All caught up"
      : "No notifications yet";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          {isFetching ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground shadow-sm">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-[380px] p-0" align="end" forceMount>
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-semibold leading-tight">Notifications</p>
            <p className="text-xs text-muted-foreground">{headerSubtitle}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="gap-2 text-xs"
            disabled={unreadCount === 0 || markAllMutation.isPending}
            onClick={() => markAllMutation.mutate()}
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </Button>
        </div>

        <DropdownMenuSeparator />

        <ScrollArea className="max-h-[360px]">
          <div className="p-2">
            {notifications.length === 0 && (
              <div className="rounded-lg border border-dashed border-muted-foreground/30 px-4 py-8 text-center text-sm text-muted-foreground">
                No notifications yet. New check-ins and updates will show up here.
              </div>
            )}

            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg p-3 text-sm transition-colors",
                  notification.isRead ? "opacity-75" : "bg-primary/5 hover:bg-primary/10",
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <span
                  className={cn(
                    "mt-1 h-2 w-2 rounded-full",
                    notification.isRead ? "bg-muted-foreground/30" : "bg-primary",
                  )}
                />
                <div className="flex-1 space-y-1">
                  <p className="font-semibold leading-tight">{notification.title}</p>
                  <p className="text-muted-foreground">{notification.message}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
