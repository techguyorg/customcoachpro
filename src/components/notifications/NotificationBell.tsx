import { useState } from "react";
import { Bell, Check, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  useNotifications, 
  useUnreadCount, 
  useMarkAsRead, 
  useMarkAllAsRead,
  useRealtimeNotifications,
  type Notification 
} from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useEffect } from "react";

const notificationIcons: Record<string, string> = {
  checkin_submitted: "📋",
  checkin_reviewed: "✅",
  plan_assigned: "📝",
  plan_updated: "🔄",
  goal_achieved: "🏆",
  goal_reminder: "⏰",
  measurement_logged: "📊",
  photo_uploaded: "📸",
  coach_note: "📝",
  reminder: "🔔",
  system: "ℹ️",
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: notifications, isLoading } = useNotifications();
  const unreadCount = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const navigate = useNavigate();
  const { newNotification, clearNewNotification } = useRealtimeNotifications();

  // Show toast for new real-time notifications
  useEffect(() => {
    if (newNotification) {
      toast(newNotification.title, {
        description: newNotification.message,
        icon: notificationIcons[newNotification.type] || "🔔",
      });
      clearNewNotification();
    }
  }, [newNotification, clearNewNotification]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead.mutateAsync(notification.id);
    }

    // Navigate based on reference type
    if (notification.reference_type === "checkin") {
      navigate(`/coach/checkins?id=${notification.reference_id}`);
    } else if (notification.reference_type === "plan_assignment") {
      navigate("/client/programs");
    }
    
    setOpen(false);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead.mutateAsync();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleMarkAllRead}
              disabled={markAllAsRead.isPending}
            >
              {markAllAsRead.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Mark all read
                </>
              )}
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${
                    !notification.is_read ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    <span className="text-xl">
                      {notificationIcons[notification.type] || "🔔"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium truncate ${
                          !notification.is_read ? "text-foreground" : "text-muted-foreground"
                        }`}>
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
