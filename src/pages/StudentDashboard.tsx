import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PaymentStatusBadge } from "@/components/payment/PaymentStatusBadge";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { useApp } from "@/contexts/AppContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { 
  GraduationCap, 
  Plus, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  Calendar,
  User,
  MoreHorizontal,
  CreditCard,
} from "lucide-react";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "in_progress":
      return <Badge variant="inProgress">In Progress</Badge>;
    case "pending":
      return <Badge variant="pending">Pending Assignment</Badge>;
    case "pending_payment":
      return <Badge variant="pending">Pending Payment</Badge>;
    case "completed":
      return <Badge variant="success">Completed</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { signOut } = useAuthContext();
  const { 
    currentUser, 
    projects,
    experts,
    notifications,
    hasSeenOnboarding,
    updateProfile,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    completeOnboarding,
  } = useApp();

  const [showOnboarding, setShowOnboarding] = useState(false);

  // Redirect if not logged in or not a student
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    } else if (currentUser.role !== "student") {
      navigate(`/${currentUser.role}`);
    } else if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, [currentUser, hasSeenOnboarding, navigate]);

  if (!currentUser) return null;

  // Filter projects for this student
  const studentProjects = projects.filter(p => p.studentId === currentUser.id);
  
  const activeCount = studentProjects.filter(p => p.status === "in_progress").length;
  const pendingCount = studentProjects.filter(p => p.status === "pending" || p.status === "pending_payment").length;
  const completedCount = studentProjects.filter(p => p.status === "completed").length;

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const handleCompleteOnboarding = () => {
    completeOnboarding();
    setShowOnboarding(false);
  };

  return (
    <>
      <OnboardingModal open={showOnboarding} onComplete={handleCompleteOnboarding} />

      <DashboardLayout
        role="student"
        title="Student Dashboard"
        description="Track your projects and collaborate with your experts."
        notifications={notifications}
        onMarkAsRead={markNotificationAsRead}
        onMarkAllAsRead={markAllNotificationsAsRead}
        onDeleteNotification={deleteNotification}
        user={currentUser}
        onUpdateProfile={updateProfile}
        onLogout={handleLogout}
        headerActions={
          <Button asChild size="sm" className="gap-2">
            <Link to="/new-project">
              <Plus className="h-4 w-4" />
              New Project Request
            </Link>
          </Button>
        }
      >
        <h2 className="text-xl font-semibold text-foreground mb-6">
          Welcome back, {currentUser.name.split(" ")[0]} 👋
        </h2>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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
                  <p className="text-sm text-muted-foreground mb-1">Pending</p>
                  <p className="text-3xl font-bold text-foreground">{pendingCount}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center">
                  <MoreHorizontal className="h-6 w-6 text-warning" />
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
        </div>

        {/* Projects List */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Your Projects</h2>
          <div className="space-y-4">
            {studentProjects.map((project) => (
              <Card key={project.id} className="shadow-card hover:shadow-elevated transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Project Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-3">
                        <div>
                          <h3 className="font-semibold text-foreground mb-1 truncate">
                            {project.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2">
                            {getStatusBadge(project.status)}
                            <PaymentStatusBadge status={project.paymentStatus} size="sm" />
                            {project.expertId && (
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <User className="h-3.5 w-3.5" />
                                {experts.find(e => e.id === project.expertId)?.name || "Expert assigned"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Progress */}
                      {project.status !== "pending" && project.status !== "pending_payment" && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium text-foreground">{project.progress}%</span>
                          </div>
                          <Progress value={project.progress} className="h-2" />
                        </div>
                      )}

                      {/* Meta Info */}
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          Due: {new Date(project.deadline).toLocaleDateString()}
                        </span>
                        <span>Updated {project.lastUpdate}</span>
                        {project.paymentStatus === "paid" && (
                          <span className="flex items-center gap-1.5 text-success">
                            <CreditCard className="h-3.5 w-3.5" />
                            ₦{project.amountPaid.toLocaleString()} paid
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action */}
                    <div className="flex-shrink-0 flex gap-2">
                      {project.paymentStatus === "unpaid" && (
                        <Button variant="default" className="gap-2" asChild>
                          <Link to="/payment" state={{ projectId: project.id, title: project.title }}>
                            <CreditCard className="h-4 w-4" />
                            Complete Payment
                          </Link>
                        </Button>
                      )}
                      <Button variant="outline" className="gap-2 w-full md:w-auto" asChild>
                        <Link to={`/project/${project.id}`}>
                          View Details
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Empty State (shown when no projects) */}
        {studentProjects.length === 0 && (
          <Card className="shadow-card">
            <CardContent className="py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <GraduationCap className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle className="mb-2">No projects yet</CardTitle>
              <CardDescription className="mb-6">
                Start your first project request and get matched with an expert.
              </CardDescription>
              <Button asChild className="gap-2">
                <Link to="/new-project">
                  <Plus className="h-4 w-4" />
                  Create Your First Project
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </DashboardLayout>
    </>
  );
};

export default StudentDashboard;
