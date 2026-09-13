import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  GraduationCap, 
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  CreditCard,
  Building2,
  AlertCircle,
  Percent,
  XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/contexts/AppContext";
import { formatCurrency, PLATFORM_FEE_PERCENTAGE } from "@/lib/platformFee";

const statusStyles: Record<string, { icon: typeof CheckCircle2; className: string }> = {
  paid: { icon: CheckCircle2, className: "text-success border-success/20" },
  processing: { icon: Clock, className: "text-warning border-warning/20" },
  pending: { icon: Clock, className: "text-warning border-warning/20" },
  failed: { icon: XCircle, className: "text-destructive border-destructive/20" },
};

const ExpertEarnings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser, projects, payouts, availableBalance, requestPayout } = useApp();
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Redirect if not logged in or not expert
  useEffect(() => {
    if (!currentUser || currentUser.role !== "expert") {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  if (!currentUser || currentUser.role !== "expert") {
    return null;
  }

  // Get expert's projects
  const expertProjects = projects.filter(p => p.expertId === currentUser.id);

  // payoutAmount from the database is already net of the platform fee.
  // The "gross"/"fee" figures below are a display-only estimate derived
  // from that net amount, purely so the expert can see what was deducted -
  // they are never used to decide what's actually payable.
  const calculateEarnings = () => {
    let totalEarnings = 0;
    let releasedEarnings = 0;
    let totalPlatformFees = 0;
    const projectEarnings: Array<{
      projectId: string;
      projectTitle: string;
      total: number;
      released: number;
      pending: number;
      platformFee: number;
      milestonesCompleted: number;
      totalMilestones: number;
    }> = [];

    expertProjects.forEach(project => {
      let projectTotal = 0;
      let projectReleased = 0;
      let milestonesCompleted = 0;

      project.milestones.forEach(milestone => {
        const netAmount = milestone.payoutAmount || 0;
        projectTotal += netAmount;
        if (milestone.payoutReleased) {
          projectReleased += netAmount;
          milestonesCompleted++;
        }
      });

      const projectGross = Math.round(projectTotal / (1 - PLATFORM_FEE_PERCENTAGE));
      const projectFee = projectGross - projectTotal;
      const projectPending = projectTotal - projectReleased;

      totalEarnings += projectTotal;
      releasedEarnings += projectReleased;
      totalPlatformFees += projectFee;

      projectEarnings.push({
        projectId: project.id,
        projectTitle: project.title,
        total: projectTotal,
        released: projectReleased,
        pending: projectPending,
        platformFee: projectFee,
        milestonesCompleted,
        totalMilestones: project.milestones.length
      });
    });

    return { totalEarnings, releasedEarnings, pendingEarnings: totalEarnings - releasedEarnings, totalPlatformFees, projectEarnings };
  };

  const { totalEarnings, pendingEarnings, totalPlatformFees, projectEarnings } = calculateEarnings();

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);

    if (!amount || amount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid withdrawal amount.", variant: "destructive" });
      return;
    }
    if (amount > availableBalance) {
      toast({ title: "Insufficient Balance", description: `You can only withdraw up to ${formatCurrency(availableBalance)}`, variant: "destructive" });
      return;
    }
    if (!bankName || !accountNumber) {
      toast({ title: "Missing Information", description: "Please enter your bank details.", variant: "destructive" });
      return;
    }
    if (!/^\d{10}$/.test(accountNumber)) {
      toast({ title: "Invalid Account Number", description: "Nigerian account numbers are 10 digits.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    const result = await requestPayout({ amount, bankName, accountNumber });
    setIsProcessing(false);

    if (!result.success) {
      toast({ title: "Withdrawal request failed", description: result.error, variant: "destructive" });
      return;
    }

    setWithdrawDialogOpen(false);
    toast({
      title: "Withdrawal Requested",
      description: `${formatCurrency(amount)} will be sent to your ${bankName} account. An admin processes payouts manually within 24-48 hours.`,
    });
    setWithdrawAmount("");
    setBankName("");
    setAccountNumber("");
  };

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
            <Badge variant="outline" className="ml-2 text-xs">Expert</Badge>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Back Button */}
        <Button variant="ghost" className="gap-2 mb-6 -ml-2" asChild>
          <Link to="/expert">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>

        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
          Earnings Dashboard
        </h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-card border-success/20 bg-success/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
                  <p className="text-3xl font-bold text-success">{formatCurrency(availableBalance)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Ready to withdraw</p>
                </div>
                <div className="h-14 w-14 rounded-full bg-success/10 flex items-center justify-center">
                  <DollarSign className="h-7 w-7 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-warning/20 bg-warning/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pending Earnings</p>
                  <p className="text-3xl font-bold text-warning">{formatCurrency(pendingEarnings)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Awaiting confirmation</p>
                </div>
                <div className="h-14 w-14 rounded-full bg-warning/10 flex items-center justify-center">
                  <Clock className="h-7 w-7 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Earnings</p>
                  <p className="text-3xl font-bold text-foreground">{formatCurrency(totalEarnings)}</p>
                  <p className="text-xs text-muted-foreground mt-1">After {Math.round(PLATFORM_FEE_PERCENTAGE * 100)}% fee</p>
                </div>
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-7 w-7 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-muted">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Platform Fees</p>
                  <p className="text-3xl font-bold text-muted-foreground">{formatCurrency(totalPlatformFees)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{Math.round(PLATFORM_FEE_PERCENTAGE * 100)}% deducted</p>
                </div>
                <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                  <Percent className="h-7 w-7 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Withdraw Button */}
        <div className="mb-8">
          <Button 
            size="lg" 
            className="gap-2"
            onClick={() => setWithdrawDialogOpen(true)}
            disabled={availableBalance <= 0}
          >
            <CreditCard className="h-5 w-5" />
            Withdraw Funds
          </Button>
          {availableBalance <= 0 && (
            <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              Complete milestones to earn withdrawable funds
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Earnings Breakdown */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Earnings by Project
              </CardTitle>
              <CardDescription>Breakdown of your earnings across projects</CardDescription>
            </CardHeader>
            <CardContent>
              {projectEarnings.length === 0 ? (
                <p className="text-muted-foreground text-sm">No project earnings yet.</p>
              ) : (
                <div className="space-y-4">
                  {projectEarnings.map((project) => (
                    <div key={project.projectId} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <Link 
                          to={`/expert/project/${project.projectId}`}
                          className="font-medium text-foreground hover:text-primary transition-colors"
                        >
                          {project.projectTitle}
                        </Link>
                        <span className="font-bold text-foreground">{formatCurrency(project.total)}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm mb-2">
                        <span className="text-success">Released: {formatCurrency(project.released)}</span>
                        <span className="text-warning">Pending: {formatCurrency(project.pending)}</span>
                        <span className="text-muted-foreground text-xs">Fee: {formatCurrency(project.platformFee)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={project.totalMilestones ? (project.milestonesCompleted / project.totalMilestones) * 100 : 0} 
                          className="h-2 flex-1" 
                        />
                        <span className="text-xs text-muted-foreground">
                          {project.milestonesCompleted}/{project.totalMilestones} milestones
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Withdrawal History */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Withdrawal History
              </CardTitle>
              <CardDescription>Your real payout requests and their status</CardDescription>
            </CardHeader>
            <CardContent>
              {payouts.length === 0 ? (
                <p className="text-muted-foreground text-sm">No withdrawals yet.</p>
              ) : (
                <div className="space-y-3">
                  {payouts.map((payout) => {
                    const style = statusStyles[payout.status] || statusStyles.pending;
                    const StatusIcon = style.icon;
                    return (
                      <div key={payout.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <StatusIcon className={`h-5 w-5 ${style.className.split(" ")[0]}`} />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{formatCurrency(payout.amount)}</p>
                            <p className="text-sm text-muted-foreground">{payout.bankName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className={style.className}>
                            {payout.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(payout.requestedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Withdrawal Dialog */}
      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
            <DialogDescription>
              Available balance: {formatCurrency(availableBalance)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Withdrawal Amount (₦)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank">Bank Name</Label>
              <Input
                id="bank"
                placeholder="e.g. First Bank, GTBank"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account">Account Number</Label>
              <Input
                id="account"
                placeholder="Enter 10-digit account number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                maxLength={10}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleWithdraw} disabled={isProcessing}>
              {isProcessing ? "Requesting..." : "Withdraw"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpertEarnings;
