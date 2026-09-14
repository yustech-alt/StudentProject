import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, 
  CheckCircle2, 
  Users,
  Search,
  Filter,
  UserPlus,
  Eye,
  AlertCircle,
  Ban,
  ShieldCheck as ShieldCheckIcon,
  MessageSquare,
  ListChecks,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { PaymentStatusBadge } from "@/components/payment/PaymentStatusBadge";
import { useApp } from "@/contexts/AppContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { FullPageSpinner } from "@/components/ui/spinner";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "in_progress":
      return <Badge variant="inProgress">In Progress</Badge>;
    case "pending":
      return <Badge variant="pending">Pending Assignment</Badge>;
    case "completed":
      return <Badge variant="success">Completed</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const AdminDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signOut } = useAuthContext();
  const {
    currentUser,
    notifications,
    projects,
    experts,
    expertApplications,
    updateProfile,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    assignExpert,
    reviewExpertApplication,
    suspendUser,
    completeOnboarding,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<typeof projects[0] | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [oversightProject, setOversightProject] = useState<typeof projects[0] | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<{ userId: string; name: string; currentlySuspended: boolean } | null>(null);
  const [suspendReason, setSuspendReason] = useState("");

  // Check if onboarding should be shown
  useEffect(() => {
    if (currentUser && !currentUser.onboardingCompleted) {
      setShowOnboarding(true);
    }
  }, [currentUser]);

  // ProtectedRoute already enforces authentication + role.
  // We just need to wait for the derived `currentUser` to be available.
  if (!currentUser) {
    return <FullPageSpinner label="Loading admin dashboard..." />;
  }

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.studentName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = projects.filter(p => p.status === "pending").length;
  const activeCount = projects.filter(p => p.status === "in_progress").length;
  const completedCount = projects.filter(p => p.status === "completed").length;

  const handleAssignExpert = async (expertId: string) => {
    if (selectedProject) {
      const expert = experts.find(e => e.id === expertId);
      await assignExpert(selectedProject.id, expertId);

      // The expert and student are notified for real, server-side, by the
      // assign_expert function itself - not by a toast in this admin's own
      // browser, which would never reach either of them.
      toast({
        title: "Expert Assigned",
        description: `${expert?.name} has been assigned to ${selectedProject?.title}`,
      });
      setAssignDialogOpen(false);
      setSelectedProject(null);
    }
  };

  const handleReviewApplication = async (applicationId: string, approve: boolean) => {
    await reviewExpertApplication(applicationId, approve);
    toast({
      title: approve ? "Expert approved" : "Application rejected",
      description: approve
        ? "They can now be assigned to projects."
        : "The applicant has been notified of the decision.",
    });
  };

  const handleConfirmSuspend = async () => {
    if (!suspendTarget) return;
    const nextSuspended = !suspendTarget.currentlySuspended;
    const result = await suspendUser(suspendTarget.userId, nextSuspended, suspendReason.trim() || undefined);
    if (!result.success) {
      toast({ title: "Couldn't update account", description: result.error, variant: "destructive" });
      return;
    }
    toast({
      title: nextSuspended ? "Account suspended" : "Account reinstated",
      description: nextSuspended
        ? `${suspendTarget.name} has been suspended and signed out of the platform.`
        : `${suspendTarget.name} can use ProjectSupport again.`,
    });
    setSuspendTarget(null);
    setSuspendReason("");
  };

  const handleUpdateProfile = (updatedData: Partial<typeof currentUser>) => {
    updateProfile(updatedData);
    toast({
      title: "Profile Updated",
      description: "Your profile has been updated successfully.",
    });
  };

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
    navigate("/login");
  };

  const handleMarkAsRead = (id: string) => {
    markNotificationAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    markAllNotificationsAsRead();
  };

  const handleDeleteNotification = (id: string) => {
    deleteNotification(id);
  };

  const handleCompleteOnboarding = () => {
    completeOnboarding();
    setShowOnboarding(false);
  };

  const userForDropdown = {
    id: currentUser.id,
    name: currentUser.name,
    email: currentUser.email,
    role: currentUser.role,
    avatar: currentUser.avatar || "",
    initials: currentUser.name.split(' ').map(n => n[0]).join(''),
    phone: currentUser.phone || "",
    location: currentUser.location || "",
    bio: currentUser.bio || "",
  };

  return (
    <>
      <OnboardingModal
        open={showOnboarding}
        onComplete={handleCompleteOnboarding}
      />

      <DashboardLayout
        role="admin"
        title="Admin Dashboard"
        description="Manage projects, assign experts, and monitor progress."
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onDeleteNotification={handleDeleteNotification}
        user={userForDropdown}
        onUpdateProfile={handleUpdateProfile}
        onLogout={handleLogout}
      >
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-card border-l-4 border-l-warning">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pending Assignment</p>
                  <p className="text-3xl font-bold text-foreground">{pendingCount}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Active Projects</p>
                  <p className="text-3xl font-bold text-foreground">{activeCount}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-accent flex items-center justify-center">
                  <Clock className="h-6 w-6 text-accent-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Completed</p>
                  <p className="text-3xl font-bold text-foreground">{completedCount}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Active Experts</p>
                  <p className="text-3xl font-bold text-foreground">{experts.length}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Expert Applications Review Queue */}
        {expertApplications.filter(a => a.status === "pending").length > 0 && (
          <Card className="shadow-card mb-8 border-l-4 border-l-warning">
            <CardHeader>
              <CardTitle>Expert Applications Awaiting Review</CardTitle>
              <CardDescription>
                Nobody can be assigned to a project until you approve them here.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {expertApplications.filter(a => a.status === "pending").map((app) => (
                <div key={app.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border">
                  <div>
                    <p className="font-medium text-foreground">{app.name}</p>
                    <p className="text-sm text-muted-foreground">{app.email} • {app.specialization}</p>
                    <p className="text-sm text-muted-foreground mt-1">{app.credentials}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => handleReviewApplication(app.id, false)}>
                      Reject
                    </Button>
                    <Button size="sm" onClick={() => handleReviewApplication(app.id, true)}>
                      Approve
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Expert Management: this is real moderation power, not just viewing */}
        {experts.length > 0 && (
          <Card className="shadow-card mb-8">
            <CardHeader>
              <CardTitle>Experts</CardTitle>
              <CardDescription>
                Suspend an expert who violates platform rules. They're signed out immediately and
                can't be assigned to new projects while suspended.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {experts.map((expert) => (
                <div key={expert.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {expert.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{expert.name}</p>
                        {expert.verified && <Badge variant="outline" className="text-xs">Verified</Badge>}
                        {expert.suspended && <Badge variant="destructive" className="text-xs">Suspended</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{expert.specialty} • {expert.activeProjects} active projects</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={expert.suspended ? "outline" : "destructive"}
                    className="gap-1 shrink-0"
                    onClick={() => setSuspendTarget({ userId: expert.id, name: expert.name, currentlySuspended: expert.suspended })}
                  >
                    {expert.suspended ? <ShieldCheckIcon className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                    {expert.suspended ? "Reinstate" : "Suspend"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects or students..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending Assignment</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Projects Table */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>All Projects</CardTitle>
            <CardDescription>
              {filteredProjects.length} projects found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Project</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Student</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Expert</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Payment</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Deadline</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project) => {
                    const assignedExpert = experts.find(e => e.id === project.expertId);
                    return (
                      <tr key={project.id} className="border-b last:border-b-0 hover:bg-muted/50">
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-foreground">{project.title}</p>
                            <p className="text-sm text-muted-foreground">{project.currentStage}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {project.studentName?.split(' ').map(n => n[0]).join('') || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium text-foreground">{project.studentName || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">{project.studentEmail || ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {assignedExpert ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {assignedExpert.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-foreground">{assignedExpert.name}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground italic">Not assigned</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          {getStatusBadge(project.status)}
                        </td>
                        <td className="py-4 px-4">
                          <PaymentStatusBadge status={project.paymentStatus} />
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-foreground">
                            {new Date(project.deadline).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setOversightProject(project)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {!assignedExpert && (
                              <Dialog open={assignDialogOpen && selectedProject?.id === project.id} onOpenChange={(open) => {
                                setAssignDialogOpen(open);
                                if (open) setSelectedProject(project);
                              }}>
                                <DialogTrigger asChild>
                                  <Button variant="default" size="sm" className="gap-1">
                                    <UserPlus className="h-4 w-4" />
                                    Assign
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Assign Expert</DialogTitle>
                                    <DialogDescription>
                                      Select an expert to assign to "{project.title}"
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-3 mt-4">
                                    {experts.filter((expert) => expert.verified).length === 0 && (
                                      <p className="text-sm text-muted-foreground">
                                        No verified experts yet. Approve an application above first.
                                      </p>
                                    )}
                                    {experts.filter((expert) => expert.verified).map((expert) => (
                                      <div
                                        key={expert.id}
                                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                                        onClick={() => handleAssignExpert(expert.id)}
                                      >
                                        <div className="flex items-center gap-3">
                                          <Avatar>
                                            <AvatarFallback className="bg-primary/10 text-primary">
                                              {expert.name.split(' ').map(n => n[0]).join('')}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div>
                                            <p className="font-medium text-foreground">{expert.name}</p>
                                            <p className="text-sm text-muted-foreground">{expert.specialty}</p>
                                          </div>
                                        </div>
                                        <Badge variant="outline">{expert.activeProjects} projects</Badge>
                                      </div>
                                    ))}
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>

      {/* Project Oversight: admins can see everything, but there is no
          message input and no confirm/edit button anywhere in here. This is
          supervision, not participation. */}
      <Dialog open={!!oversightProject} onOpenChange={(open) => !open && setOversightProject(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{oversightProject?.title}</DialogTitle>
            <DialogDescription>
              Read-only oversight. Student: {oversightProject?.studentName} • Expert: {oversightProject?.expertName || "Unassigned"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 pb-2">
            <Button
              size="sm"
              variant="destructive"
              className="gap-1"
              onClick={() => oversightProject && setSuspendTarget({
                userId: oversightProject.studentId,
                name: oversightProject.studentName,
                currentlySuspended: false,
              })}
            >
              <Ban className="h-3.5 w-3.5" />
              Suspend Student
            </Button>
            {oversightProject?.expertId && (
              <Button
                size="sm"
                variant="destructive"
                className="gap-1"
                onClick={() => oversightProject.expertId && setSuspendTarget({
                  userId: oversightProject.expertId,
                  name: oversightProject.expertName || "Expert",
                  currentlySuspended: experts.find(e => e.id === oversightProject.expertId)?.suspended || false,
                })}
              >
                <Ban className="h-3.5 w-3.5" />
                Suspend Expert
              </Button>
            )}
          </div>

          <Tabs defaultValue="milestones" className="flex-1 overflow-hidden flex flex-col">
            <TabsList>
              <TabsTrigger value="milestones" className="gap-1.5">
                <ListChecks className="h-4 w-4" />
                Milestones
              </TabsTrigger>
              <TabsTrigger value="messages" className="gap-1.5">
                <MessageSquare className="h-4 w-4" />
                Messages
              </TabsTrigger>
            </TabsList>

            <TabsContent value="milestones" className="flex-1 overflow-hidden">
              <ScrollArea className="h-[45vh] pr-4">
                <div className="space-y-3">
                  {oversightProject?.milestones.length === 0 && (
                    <p className="text-sm text-muted-foreground">No milestones yet.</p>
                  )}
                  {oversightProject?.milestones.map((m) => (
                    <div key={m.id} className="p-3 rounded-lg border space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-foreground">{m.seq}. {m.title}</p>
                        <Badge variant="outline" className="capitalize">{m.status.replace('_', ' ')}</Badge>
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Student confirmed: {m.studentConfirmed ? "Yes" : "No"}</span>
                        <span>Expert confirmed: {m.expertConfirmed ? "Yes" : "No"}</span>
                        <span>Payout: {m.payoutReleased ? "Released" : "Pending"} (₦{(m.payoutAmount || 0).toLocaleString()})</span>
                      </div>
                      {m.feedback && (
                        <p className="text-sm text-muted-foreground italic">"{m.feedback}"{m.rating ? ` — ${m.rating}/5` : ""}</p>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="messages" className="flex-1 overflow-hidden">
              <ScrollArea className="h-[45vh] pr-4">
                <div className="space-y-3">
                  {oversightProject?.messages.length === 0 && (
                    <p className="text-sm text-muted-foreground">No messages yet.</p>
                  )}
                  {oversightProject?.messages.map((msg) => (
                    <div key={msg.id} className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">{msg.senderName}</span>
                        <span className="text-xs text-muted-foreground">{new Date(msg.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{msg.content}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Suspend / Reinstate confirmation */}
      <Dialog open={!!suspendTarget} onOpenChange={(open) => !open && setSuspendTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {suspendTarget?.currentlySuspended ? "Reinstate" : "Suspend"} {suspendTarget?.name}?
            </DialogTitle>
            <DialogDescription>
              {suspendTarget?.currentlySuspended
                ? "They'll be able to use ProjectSupport normally again."
                : "They'll be signed out immediately and blocked from creating projects, sending messages, confirming milestones, or requesting payouts until reinstated."}
            </DialogDescription>
          </DialogHeader>
          {!suspendTarget?.currentlySuspended && (
            <div className="space-y-2">
              <Label htmlFor="suspend-reason">Reason (shown to the user)</Label>
              <Textarea
                id="suspend-reason"
                placeholder="e.g. Violated platform guidelines by arranging payment outside the app"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendTarget(null)}>Cancel</Button>
            <Button
              variant={suspendTarget?.currentlySuspended ? "default" : "destructive"}
              onClick={handleConfirmSuspend}
            >
              {suspendTarget?.currentlySuspended ? "Reinstate" : "Suspend"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminDashboard;
