import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { useApp } from "@/contexts/AppContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  Calendar,
  User,
  FileText,
  MessageSquare,
  Briefcase,
  Star,
  TrendingUp,
  Wallet,
  ShieldCheck,
  Hourglass
} from "lucide-react";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "in_progress":
      return <Badge variant="inProgress">In Progress</Badge>;
    case "pending_review":
      return <Badge variant="pending">Pending Review</Badge>;
    case "completed":
      return <Badge variant="success">Completed</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const getPriorityBadge = (deadline: string) => {
  const daysLeft = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft <= 7) {
    return <Badge variant="destructive" className="text-xs">High Priority</Badge>;
  } else if (daysLeft <= 14) {
    return <Badge variant="secondary" className="text-xs">Medium</Badge>;
  }
  return null;
};

const ExpertDashboard = () => {
  const navigate = useNavigate();
  const { signOut } = useAuthContext();
  const {
    currentUser,
    projects,
    notifications,
    hasSeenOnboarding,
    updateProfile,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    completeOnboarding,
    applyAsExpert,
    myExpertApplication,
  } = useApp();
  const { toast } = useToast();

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [specialization, setSpecialization] = useState("");
  const [credentials, setCredentials] = useState("");
  const [submittingApplication, setSubmittingApplication] = useState(false);

  // Redirect if not logged in or not an expert
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    } else if (currentUser.role !== "expert") {
      navigate(`/${currentUser.role}`);
    } else if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, [currentUser, hasSeenOnboarding, navigate]);

  if (!currentUser) return null;

  // Filter projects assigned to this expert
  const expertProjects = projects.filter(p => p.expertId === currentUser.id);
  const activeProjects = expertProjects.filter(p => p.status === "in_progress");
  const pendingReviewProjects = expertProjects.filter(p => 
    p.milestones.some(m => m.status === "in_progress")
  );
  const completedProjects = expertProjects.filter(p => p.status === "completed");

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const handleCompleteOnboarding = () => {
    completeOnboarding();
    setShowOnboarding(false);
  };

  const handleSubmitApplication = async () => {
    if (!specialization.trim() || !credentials.trim()) {
      toast({ title: "Missing information", description: "Fill in both fields to apply.", variant: "destructive" });
      return;
    }
    setSubmittingApplication(true);
    const result = await applyAsExpert(specialization.trim(), credentials.trim());
    setSubmittingApplication(false);
    if (!result.success) {
      toast({ title: "Couldn't submit application", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Application submitted", description: "An admin will review it shortly." });
  };

  return (
    <>
      <OnboardingModal open={showOnboarding} onComplete={handleCompleteOnboarding} />

      <DashboardLayout
        role="expert"
        title="Expert Dashboard"
        description="Manage your assigned projects and help students succeed."
        notifications={notifications}
        onMarkAsRead={markNotificationAsRead}
        onMarkAllAsRead={markAllNotificationsAsRead}
        onDeleteNotification={deleteNotification}
        user={currentUser}
        onUpdateProfile={updateProfile}
        onLogout={handleLogout}
        headerActions={
          <Button asChild size="sm" className="gap-2">
            <Link to="/expert/earnings">
              <Wallet className="h-4 w-4" />
              View Earnings
            </Link>
          </Button>
        }
      >
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            Welcome back, {currentUser.name.split(" ")[0]} 👋
          </h2>
          {currentUser.verified && (
            <Badge className="bg-success/10 text-success border-success/20">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>

        {/* Verification gate: you cannot be assigned to a project until an
            admin approves your application, no matter what this dashboard
            otherwise shows. */}
        {!currentUser.verified && (
          <Card className="shadow-card mb-8 border-l-4 border-l-warning">
            {myExpertApplication ? (
              <CardContent className="pt-6 flex items-start gap-3">
                <Hourglass className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Application under review</p>
                  <p className="text-sm text-muted-foreground">
                    We're reviewing your expert application. You'll be able to get assigned to
                    projects once an admin approves it.
                  </p>
                </div>
              </CardContent>
            ) : (
              <>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ShieldCheck className="h-5 w-5 text-warning" />
                    Get verified to start taking projects
                  </CardTitle>
                  <CardDescription>
                    You can't be assigned to a project until an admin reviews and approves this.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="specialization">Your specialization</Label>
                    <Input
                      id="specialization"
                      placeholder="e.g. Full-stack web development, Data science"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="credentials">Relevant credentials / experience</Label>
                    <Textarea
                      id="credentials"
                      placeholder="Degrees, certifications, past projects, years of experience..."
                      value={credentials}
                      onChange={(e) => setCredentials(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <Button onClick={handleSubmitApplication} disabled={submittingApplication}>
                    {submittingApplication ? "Submitting..." : "Submit Application"}
                  </Button>
                </CardContent>
              </>
            )}
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Active Tasks</p>
                  <p className="text-3xl font-bold text-foreground">{activeProjects.length}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-accent flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-accent-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pending Review</p>
                  <p className="text-3xl font-bold text-foreground">{pendingReviewProjects.length}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Completed</p>
                  <p className="text-3xl font-bold text-foreground">{completedProjects.length}</p>
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
                  <p className="text-sm text-muted-foreground mb-1">Avg. Rating</p>
                  <div className="flex items-center gap-1">
                    <p className="text-3xl font-bold text-foreground">4.9</p>
                    <Star className="h-5 w-5 text-warning fill-warning" />
                  </div>
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Tasks */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Assigned Tasks</h2>
          <div className="space-y-4">
            {activeProjects.length === 0 && (
              <Card className="shadow-card">
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No active tasks assigned yet.</p>
                </CardContent>
              </Card>
            )}
            {activeProjects.map((project) => {
              const currentMilestone = project.milestones.find(m => m.status === "in_progress") || 
                project.milestones.find(m => m.status === "pending");
              const lastMessage = project.messages[project.messages.length - 1];

              return (
                <Card key={project.id} className="shadow-card hover:shadow-elevated transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Task Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start gap-2 mb-2">
                          <h3 className="font-semibold text-foreground">
                            {project.title}
                          </h3>
                          {getStatusBadge(project.status)}
                          {getPriorityBadge(project.deadline)}
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                          <User className="h-4 w-4" />
                          <span>Student: {project.studentName || 'Unknown'}</span>
                        </div>

                        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                          <span className="font-medium text-foreground">Current Milestone:</span>
                          <span>{currentMilestone?.title || "All completed"}</span>
                        </div>

                        {/* Progress */}
                        <div className="space-y-2 max-w-md">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium text-foreground">{project.progress}%</span>
                          </div>
                          <Progress value={project.progress} className="h-2" />
                        </div>

                        {/* Meta Info */}
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            Due: {new Date(project.deadline).toLocaleDateString()}
                          </span>
                          {lastMessage && lastMessage.content && (
                            <span className="flex items-center gap-1.5">
                              <MessageSquare className="h-3.5 w-3.5" />
                              "{lastMessage.content.substring(0, 40)}..."
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
                        <Button variant="default" className="gap-2" asChild>
                          <Link to={`/expert/project/${project.id}`}>
                            <FileText className="h-4 w-4" />
                            View Task
                          </Link>
                        </Button>
                        <Button variant="outline" className="gap-2" asChild>
                          <Link to={`/expert/project/${project.id}?tab=chat`}>
                            <MessageSquare className="h-4 w-4" />
                            Chat
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Recent Completions */}
        {completedProjects.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">Recently Completed</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedProjects.map((project) => (
                <Card key={project.id} className="shadow-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{project.title}</h3>
                        <p className="text-sm text-muted-foreground">Student: {project.studentName || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Completed: {new Date(project.deadline).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 text-warning fill-warning" />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </DashboardLayout>
    </>
  );
};

export default ExpertDashboard;
