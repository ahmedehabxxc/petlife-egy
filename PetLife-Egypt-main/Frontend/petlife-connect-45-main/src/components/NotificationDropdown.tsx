import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { Notification } from "@/types";
import api from "@/services/api";
import { useAuthStore } from "@/stores/authStore";
import { useNavigate } from "react-router-dom";

const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const loadNotifications = async () => {
      if (!user?.id) {
        setNotifications([]);
        return;
      }

      try {
        const response = await api.get("/Notifications", {
          params: Number.isFinite(user.userId) ? { userId: user.userId } : undefined,
        });
        const rows = Array.isArray(response.data) ? response.data : [];
        const mapped = rows.map((n: any) => ({
          id: String(n.id ?? n.Id ?? ""),
          userId: n.userId ?? n.UserId ?? undefined,
          senderId: n.senderId ?? n.SenderId ?? undefined,
          title: n.title ?? n.Title ?? "Notification",
          message: n.message ?? n.Message ?? "",
          read: Boolean(n.isRead ?? n.IsRead ?? false),
          createdAt: n.createdAt ?? n.CreatedAt ?? new Date().toISOString(),
          type: n.type ?? n.Type ?? "info",
          actionUrl: n.actionUrl ?? n.ActionUrl ?? undefined,
          conversationId: n.conversationId ?? n.ConversationId ?? undefined,
          relatedId: n.relatedId ?? n.RelatedId ?? undefined,
        }));
        setNotifications(mapped);
      } catch {
        setNotifications([]);
      }
    };

    void loadNotifications();
  }, [user?.id]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="px-3 py-2 border-b">
          <p className="font-heading font-semibold text-sm">Notifications</p>
        </div>
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          notifications.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${
                !n.read ? "bg-primary/5" : ""
              }`}
              onClick={async () => {
                try {
                  await api.post(`/Notifications/mark-read/${n.id}`);
                } catch {
                  // ignore
                }
                if (n.actionUrl) {
                  navigate(n.actionUrl);
                }
              }}
            >
              <span className="font-medium text-sm">{n.title}</span>
              <span className="text-xs text-muted-foreground">{n.message}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;
