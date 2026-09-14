import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useApp } from "@/contexts/AppContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, PLATFORM_FEE_PERCENTAGE } from "@/lib/platformFee";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Users,
  Target,
  Wallet,
  AlertTriangle,
  Gift,
  Loader2,
} from "lucide-react";

const AdminAnalytics = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    projects,
    experts,
    notifications,
    updateProfile,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
  } = useApp();
  const { signOut } = useAuthContext();

  const [counts, setCounts] = useState<{ students: number; experts: number } | null>(null);
  const [loadingCounts, setLoadingCounts] = useState(true);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  // Total signups by role. This is the one number that can't be derived from
  // `projects`/`experts` already in AppContext (which only cover paying
  // students and experts) - so it's fetched directly here, admin-only, and
  // allowed by the same "admins can view all profiles" RLS policy already
  // used everywhere else.
  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") return;
    (async () => {
      setLoadingCounts(true);
      const [studentsRes, expertsRes] = await Promise.all([
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "expert"),
      ]);
      setCounts({
        students: studentsRes.count || 0,
        experts: expertsRes.count || 0,
      });
      setLoadingCounts(false);
    })();
  }, [currentUser]);

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  if (!currentUser || currentUser.role !== "admin") return null;

  // Activation: signup -> paid project. Counts distinct students who have
  // paid for at least one project, against the real total signup count.
  const payingStudentIds = new Set(
    projects.filter((p) => p.paymentStatus === "paid").map((p) => p.studentId)
  );
  const activationRate = counts && counts.students > 0
    ? (payingStudentIds.size / counts.students) * 100
    : 0;

  // Milestone completion: of all milestones ever generated (i.e. every paid
  // project), how many actually reached mutual confirmation.
  const allMilestones = projects.flatMap((p) => p.milestones);
  const completedMilestones = allMilestones.filter((m) => m.status === "completed");
  const stalledMilestones = allMilestones.filter((m) => m.status === "in_progress");
  const milestoneCompletionRate = allMilestones.length > 0
    ? (completedMilestones.length / allMilestones.length) * 100
    : 0;

  const milestoneStatusData = [
    { name: "Pending", value: allMilestones.filter((m) => m.status === "pending").length, color: "hsl(var(--muted-foreground))" },
    { name: "In Progress", value: stalledMilestones.length, color: "hsl(var(--warning))" },
    { name: "In Review", value: allMilestones.filter((m) => m.status === "pending_review").length, color: "hsl(var(--primary))" },
    { name: "Completed", value: completedMilestones.length, color: "hsl(var(--success))" },
  ];

  // Expert utilization: verified experts with 0-1 active projects are a
  // supply-side warning sign per the go-to-market plan - it means you have
  // idle, ready-to-work supply that demand isn't reaching.
  const verifiedExperts = experts.filter((e) => e.verified && !e.suspended);
  const underutilizedExperts = verifiedExperts.filter((e) => e.activeProjects <= 1);

  // GMV and take rate. Take rate is fixed at 10% by the schema (see
  // lib/platformFee.ts), so the only lever for growth is GMV itself.
  const paidProjects = projects.filter((p) => p.paymentStatus === "paid");
  const gmv = paidProjects.reduce((sum, p) => sum + p.amountPaid, 0);
  const platformRevenue = Math.round(gmv * PLATFORM_FEE_PERCENTAGE);
  const totalPaidToExperts = allMilestones
    .filter((m) => m.payoutReleased)
    .reduce((sum, m) => sum + (m.payoutAmount || 0), 0);

  return (
    <DashboardLayout
      role="admin"
      title="Analytics"
      description="The numbers worth watching early, per your go-to-market plan."
      notifications={notifications}
      onMarkAsRead={markNotificationAsRead}
      onMarkAllAsRead={markAllNotificationsAsRead}
      onDeleteNotification={deleteNotification}
      user={currentUser}
      onUpdateProfile={updateProfile}
      onLogout={handleLogout}
    >
      {/* Top-line stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Activation Rate</p>
                {loadingCounts ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  <p className="text-3xl font-bold text-foreground">{activationRate.toFixed(1)}%</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {payingStudentIds.size} of {counts?.students ?? "..."} students have paid
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Milestone Completion</p>
                <p className="text-3xl font-bold text-foreground">{milestoneCompletionRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {completedMilestones.length} of {allMilestones.length} milestones
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">GMV</p>
                <p className="text-3xl font-bold text-foreground">{formatCurrency(gmv)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(platformRevenue)} platform revenue (10%)
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-accent flex items-center justify-center">
                <Wallet className="h-6 w-6 text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`shadow-card ${underutilizedExperts.length > 0 ? "border-l-4 border-l-warning" : ""}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Underutilized Experts</p>
                <p className="text-3xl font-bold text-foreground">{underutilizedExperts.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  of {verifiedExperts.length} verified experts, 0-1 active projects
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Milestone breakdown chart */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Milestone Status Breakdown</CardTitle>
            <CardDescription>
              Stalled milestones (stuck "in progress") are the earliest sign of a trust or
              quality problem worth spot-checking.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {allMilestones.length === 0 ? (
              <p className="text-sm text-muted-foreground">No milestones generated yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={milestoneStatusData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {milestoneStatusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Supply-side warning list */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Idle Verified Experts
            </CardTitle>
            <CardDescription>
              Verified but rarely assigned. Either demand isn't reaching them, or something
              about their profile isn't converting - worth a direct check-in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {underutilizedExperts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Every verified expert has 2+ active projects. Good sign.
              </p>
            ) : (
              <div className="space-y-2">
                {underutilizedExperts.map((expert) => (
                  <div key={expert.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium text-foreground">{expert.name}</p>
                      <p className="text-sm text-muted-foreground">{expert.specialty}</p>
                    </div>
                    <Badge variant="outline">{expert.activeProjects} active</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Money flow + honest placeholder for what isn't built yet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Money Flow</CardTitle>
            <CardDescription>Where GMV actually goes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total GMV</span>
              <span className="font-medium text-foreground">{formatCurrency(gmv)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Platform revenue (10% fee)</span>
              <span className="font-medium text-foreground">{formatCurrency(platformRevenue)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Released to experts</span>
              <span className="font-medium text-foreground">{formatCurrency(totalPaidToExperts)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Awaiting milestone confirmation</span>
              <span className="font-medium text-foreground">
                {formatCurrency(Math.max(0, gmv - platformRevenue - totalPaidToExperts))}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <Gift className="h-5 w-5" />
              Referral Share
            </CardTitle>
            <CardDescription>
              Not tracked yet - there's no referral system in the product. Your plan calls this
              out as "your best read on whether the trust positioning is actually working," so
              it's worth building before this card is useful.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminAnalytics;
