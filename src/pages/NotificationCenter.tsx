import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GraduationCap,
  ArrowLeft,
  Bell,
  MessageSquare,
  CheckCircle2,
  UserPlus,
  FileText,
  AlertCircle,
  Clock,
  Trash2,
  CheckCheck,
  Filter,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";

const notificationTypes = [
  { id: "all", label: "All", icon: Bell },
  { id: "message", label: "Messages", icon: MessageSquare },
  { id: "milestone", label: "Milestones", icon: CheckCircle2 },
  { id: "assignment", label: "Assignments", icon: UserPlus },
  { id: "review", label: "Reviews", icon: FileText },
  { id: "payment", label: "Payments", icon: CheckCircle2 },
  { id: "system", label: "System", icon: AlertCircle },
];

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "message":
      return <MessageSquare className="h-5 w-5 text-primary" />;
    case "milestone":
      return <CheckCircle2 className="h-5 w-5 text-success" />;
    case "assignment":
      return <UserPlus className="h-5 w-5 text-accent-foreground" />;
    case "review":
      return <FileText className="h-5 w-5 text-warning" />;
    case "payment":
      return <CheckCircle2 className="h-5 w-5 text-success" />;
    case "system":
      return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    default:
      return <Bell className="h-5 w-5" />;
  }
};

const NotificationCenter = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
  } = useApp();
  const [activeFilter, setActiveFilter] = useState("all");

  // Redirect if not logged in
  if (!currentUser) {
    navigate("/login");
    return null;
  }

  const filteredNotifications =
    activeFilter === "all"
      ? notifications
      : notifications.filter((n) => n.type === activeFilter);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredUnreadCount = filteredNotifications.filter((n) => !n.read).length;

  const backPath =
    currentUser.role === "student"
      ? "/student"
      : currentUser.role === "expert"
      ? "/expert"
      : "/admin";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">ProjectSupport</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8 max-w-4xl">
        {/* Back Button */}
        <Button variant="ghost" className="gap-2 mb-6 -ml-2" asChild>
          <Link to={backPath}>
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
              <Bell className="h-7 w-7 text-primary" />
              Notification Center
            </h1>
            <p className="text-muted-foreground mt-1">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                : "All caught up!"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllNotificationsAsRead} className="gap-2">
              <CheckCheck className="h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <Tabs value={activeFilter} onValueChange={setActiveFilter} className="mb-6">
          <TabsList className="flex-wrap h-auto gap-1 p-1">
            {notificationTypes.map((type) => {
              const typeCount =
                type.id === "all"
                  ? notifications.length
                  : notifications.filter((n) => n.type === type.id).length;
              const Icon = type.icon;
              return (
                <TabsTrigger
                  key={type.id}
                  value={type.id}
                  className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{type.label}</span>
                  {typeCount > 0 && (
                    <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-xs ml-1">
                      {typeCount}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        {/* Notifications List */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  {activeFilter === "all" ? "All Notifications" : notificationTypes.find((t) => t.id === activeFilter)?.label}
                </CardTitle>
                <CardDescription>
                  {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? "s" : ""}
                  {filteredUnreadCount > 0 && ` (${filteredUnreadCount} unread)`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-lg font-medium text-foreground mb-1">No notifications</p>
                  <p className="text-sm text-muted-foreground">
                    {activeFilter === "all"
                      ? "You're all caught up!"
                      : `No ${notificationTypes.find((t) => t.id === activeFilter)?.label.toLowerCase()} notifications`}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`group flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                        !notification.read
                          ? "bg-primary/5 border-primary/20"
                          : "bg-background border-border hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        {notification.link ? (
                          <Link
                            to={notification.link}
                            className="font-medium text-foreground hover:text-primary transition-colors"
                            onClick={() => markNotificationAsRead(notification.id)}
                          >
                            {notification.title}
                          </Link>
                        ) : (
                          <p className="font-medium text-foreground">{notification.title}</p>
                        )}
                        <p className="text-sm text-muted-foreground mt-0.5">{notification.description}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {notification.time}
                          </span>
                          <Badge variant="outline" className="text-xs capitalize">
                            {notification.type}
                          </Badge>
                          {!notification.read && (
                            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markNotificationAsRead(notification.id)}
                            className="h-8 px-2"
                          >
                            <CheckCheck className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                          className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default NotificationCenter;
