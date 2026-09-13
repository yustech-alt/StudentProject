import { useState, useEffect, useRef } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  GraduationCap, 
  ArrowLeft,
  CheckCircle2, 
  Circle,
  Clock,
  Calendar,
  User,
  MessageSquare,
  FileText,
  Upload,
  Download,
  Send,
  Paperclip,
  Shield,
  Star,
  Edit,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Check,
  CheckCheck,
  Wallet,
  DollarSign,
  Play
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useApp } from "@/contexts/AppContext";
import { ChatDisclaimer } from "@/components/chat/ChatDisclaimer";
import { PaymentStatusBadge } from "@/components/payment/PaymentStatusBadge";
import { useFileUpload } from "@/hooks/useFileUpload";
import { FileUploadProgress } from "@/components/files/FileUploadProgress";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { formatCurrency, PLATFORM_FEE_PERCENTAGE } from "@/lib/platformFee";

const getMilestoneIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-5 w-5 text-success" />;
    case "in_progress":
      return <Clock className="h-5 w-5 text-primary animate-pulse" />;
    case "pending_review":
      return <AlertCircle className="h-5 w-5 text-warning" />;
    default:
      return <Circle className="h-5 w-5 text-muted-foreground" />;
  }
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

// formatCurrency is now imported from @/lib/platformFee

const ExpertProjectDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser, projects, addMessage, setMilestoneFeedback, confirmMilestone, startMilestone, markMessagesAsRead, addProjectFile, getFileUrl } = useApp();
  
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<any>(null);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const { emitProjectEvent } = useRealtimeNotifications();
  
  const { uploads, isUploading, uploadFile, removeUpload } = useFileUpload({
    bucket: 'project-files',
    onComplete: (file) => {
      if (file.status === 'complete' && file.path && id) {
        addProjectFile(id, {
          name: file.fileName,
          uploadedBy: 'expert',
          date: new Date().toISOString().split('T')[0],
          size: file.fileSizeBytes ? `${Math.round(file.fileSizeBytes / 1024)} KB` : 'Uploaded',
          path: file.path
        });
        // Emit real-time event for file upload
        emitProjectEvent(id, 'file_uploaded', {
          file_name: file.fileName,
          user_name: currentUser?.name || 'Expert'
        });
      }
    }
  });

  // Redirect if not logged in or not expert
  useEffect(() => {
    if (!currentUser || currentUser.role !== "expert") {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  const project = projects.find(p => p.id === id);

  // Mark messages as read when viewing chat
  useEffect(() => {
    if (activeTab === "chat" && id && currentUser?.role === "expert") {
      markMessagesAsRead(id, "expert");
    }
  }, [activeTab, id, currentUser, markMessagesAsRead]);

  if (!currentUser || currentUser.role !== "expert" || !project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Project not found</h2>
          <Button asChild>
            <Link to="/expert">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  // payoutAmount from the database is already net of the platform fee
  // (see AppContext's Milestone type) - no need to apply the fee again here.
  const totalEarnings = project.milestones.reduce((sum, m) => sum + (m.payoutAmount || 0), 0);
  const totalEarningsGross = Math.round(totalEarnings / (1 - PLATFORM_FEE_PERCENTAGE));
  const releasedEarnings = project.milestones
    .filter(m => m.payoutReleased)
    .reduce((sum, m) => sum + (m.payoutAmount || 0), 0);
  const pendingEarnings = totalEarnings - releasedEarnings;
  const platformFee = totalEarningsGross - totalEarnings;

  // Use files from context (shared between student and expert)
  const files = project.files || [];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      for (const file of Array.from(selectedFiles)) {
        await uploadFile(file, id);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleChatFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      for (const file of Array.from(selectedFiles)) {
        await uploadFile(file, id);
        toast({
          title: "File Uploaded",
          description: `${file.name} has been uploaded and is now available in Files tab.`,
        });
      }
    }
    if (chatFileInputRef.current) {
      chatFileInputRef.current.value = '';
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && id) {
      addMessage(id, {
        sender: "expert",
        senderName: currentUser.name,
        content: newMessage,
      });
      toast({
        title: "Message Sent",
        description: "Your message has been delivered to the student.",
      });
      setNewMessage("");
    }
  };

  const handleOpenReview = (milestone: any) => {
    setSelectedMilestone(milestone);
    setReviewDialogOpen(true);
  };

  const handleApprove = async () => {
    if (id && selectedMilestone) {
      // Leaving feedback/rating is separate from confirming: confirming is
      // what actually moves the milestone toward payout, via the same
      // mutual student+expert confirmation used everywhere else.
      await setMilestoneFeedback(selectedMilestone.id, reviewFeedback, reviewRating);
      await confirmMilestone(id, selectedMilestone.id);
      toast({
        title: "Milestone Approved",
        description: `"${selectedMilestone?.title}" has been confirmed on your side.`,
      });
      setReviewDialogOpen(false);
      setReviewFeedback("");
      setReviewRating(5);
    }
  };

  const handleConfirmMilestone = (milestoneId: string) => {
    if (id) {
      confirmMilestone(id, milestoneId);

      const milestone = project.milestones.find(m => m.id === milestoneId);
      const studentAlreadyConfirmed = milestone?.studentConfirmed;
      const netEarnings = milestone?.payoutAmount || 0;

      // Emit real-time event for milestone confirmation
      emitProjectEvent(id, 'milestone_confirmed', {
        milestone_id: milestoneId,
        milestone_title: milestone?.title || 'Milestone',
        confirmed_by: currentUser?.name || 'Expert'
      });

      if (studentAlreadyConfirmed) {
        // Both confirmed - the database has already released the real payout
        // and sent both of you a persisted notification.
        toast({
          title: "🎉 Milestone Completed & Payment Released!",
          description: `${formatCurrency(netEarnings)} has been added to your available balance.`,
        });
      } else {
        toast({
          title: "Milestone Confirmed",
          description: "Waiting for student confirmation to release payment.",
        });
      }
    }
  };

  const handleRequestRevision = async () => {
    if (id && selectedMilestone) {
      await setMilestoneFeedback(selectedMilestone.id, reviewFeedback);
      toast({
        title: "Revision Requested",
        description: "Your feedback has been saved. The student can see it on the milestone.",
      });
      setReviewDialogOpen(false);
      setReviewFeedback("");
      setReviewRating(5);
    }
  };

  const unreadCount = project.messages.filter(m => m.sender === "student" && !m.read).length;

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

        {/* Project Header */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          <div className="flex-1">
            <div className="flex items-start gap-3 mb-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  {project.title}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={project.status === "in_progress" ? "inProgress" : project.status === "completed" ? "success" : "pending"}>
                    {project.status === "in_progress" ? "In Progress" : project.status === "completed" ? "Completed" : "Pending"}
                  </Badge>
                  <Badge variant="outline">{project.currentStage}</Badge>
                  <PaymentStatusBadge status={project.paymentStatus} />
                </div>
              </div>
            </div>
            <p className="text-muted-foreground mb-4">{project.description}</p>

            {/* Progress */}
            <div className="space-y-2 max-w-md">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-medium text-foreground">{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-3" />
            </div>
          </div>

          {/* Earnings Card - Expert Only */}
          <Card className="shadow-card lg:w-80 border-success/20 bg-success/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="h-5 w-5 text-success" />
                Your Earnings
              </CardTitle>
              <p className="text-xs text-muted-foreground">After {Math.round(PLATFORM_FEE_PERCENTAGE * 100)}% platform fee</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Released</span>
                  <span className="font-bold text-success text-lg">{formatCurrency(releasedEarnings)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <span className="font-medium text-warning">{formatCurrency(pendingEarnings)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Platform Fee</span>
                  <span className="text-muted-foreground">{formatCurrency(platformFee)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Your Total</span>
                    <span className="font-bold">{formatCurrency(totalEarnings)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Student Card */}
        <Card className="shadow-card mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Student Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src="" />
                <AvatarFallback className="bg-muted text-muted-foreground font-medium">
                  {(project.studentName || 'U').split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">{project.studentName || 'Unknown'}</p>
                <p className="text-sm text-muted-foreground">{project.studentEmail}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <p className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                {project.studentEmail}
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Due: {new Date(project.deadline).toLocaleDateString()}
              </p>
              <PaymentStatusBadge status={project.paymentStatus} />
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Milestones
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2 relative">
              <MessageSquare className="h-4 w-4" />
              Chat
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="files" className="gap-2">
              <FileText className="h-4 w-4" />
              Files
            </TabsTrigger>
          </TabsList>

          {/* Milestones Tab */}
          <TabsContent value="overview">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Project Milestones</CardTitle>
                <CardDescription>Review submissions and confirm completion. Both you and the student must confirm for payment to be released.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {project.milestones.map((milestone, index) => (
                    <div key={milestone.id} className="flex gap-4">
                      {/* Timeline */}
                      <div className="flex flex-col items-center">
                        {getMilestoneIcon(milestone.status)}
                        {index < project.milestones.length - 1 && (
                          <div className={`w-0.5 flex-1 my-2 ${
                            milestone.status === "completed" ? "bg-success" : "bg-border"
                          }`} />
                        )}
                      </div>

                      {/* Content */}
                      <div className={`flex-1 pb-6 ${index === project.milestones.length - 1 ? 'pb-0' : ''}`}>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className={`font-medium ${
                                milestone.status === "completed" ? "text-foreground" : 
                                milestone.status === "pending_review" ? "text-warning" :
                                milestone.status === "in_progress" ? "text-primary" : "text-muted-foreground"
                              }`}>
                                {milestone.title}
                              </h3>
                              {milestone.payoutAmount && (
                                <Badge variant="outline" className="text-xs gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  {formatCurrency(milestone.payoutAmount)}
                                </Badge>
                              )}
                              {milestone.payoutReleased && (
                                <Badge className="bg-success/10 text-success border-success/20 text-xs">
                                  Paid
                                </Badge>
                              )}
                            </div>
                            {milestone.status === "completed" && milestone.feedback && (
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex">
                                  {[...Array(milestone.rating || 0)].map((_, i) => (
                                    <Star key={i} className="h-3 w-3 text-warning fill-warning" />
                                  ))}
                                </div>
                                <span className="text-xs text-muted-foreground">Your feedback given</span>
                              </div>
                            )}
                            {/* Confirmation Status */}
                            {(milestone.status === "in_progress" || milestone.status === "pending_review") && (
                              <div className="flex items-center gap-3 mt-1 text-xs">
                                <span className={milestone.studentConfirmed ? "text-success" : "text-muted-foreground"}>
                                  Student: {milestone.studentConfirmed ? "✓ Confirmed" : "Pending"}
                                </span>
                                <span className={milestone.expertConfirmed ? "text-success" : "text-muted-foreground"}>
                                  You: {milestone.expertConfirmed ? "✓ Confirmed" : "Pending"}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {milestone.status === "completed" && milestone.completedDate && (
                              <span className="text-sm text-muted-foreground">
                                Approved: {new Date(milestone.completedDate).toLocaleDateString()}
                              </span>
                            )}
                            {milestone.status === "pending_review" && (
                              <Button size="sm" className="gap-2" onClick={() => handleOpenReview(milestone)}>
                                <Edit className="h-3 w-3" />
                                Review Submission
                              </Button>
                            )}
                            {milestone.status === "pending" && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="gap-2"
                                onClick={() => {
                                  if (id) {
                                    startMilestone(id, milestone.id);
                                    // Emit real-time event for milestone started
                                    emitProjectEvent(id, 'milestone_started', {
                                      milestone_id: milestone.id,
                                      milestone_title: milestone.title,
                                      user_name: currentUser?.name || 'Expert'
                                    });
                                    toast({
                                      title: "Milestone Started",
                                      description: `"${milestone.title}" is now in progress.`,
                                    });
                                  }
                                }}
                              >
                                <Play className="h-3 w-3" />
                                Start Step
                              </Button>
                            )}
                            {milestone.status === "in_progress" && !milestone.expertConfirmed && (
                              <Button size="sm" onClick={() => handleConfirmMilestone(milestone.id)}>
                                <Check className="h-4 w-4 mr-1" />
                                Confirm Complete
                              </Button>
                            )}
                            {milestone.status === "in_progress" && milestone.expertConfirmed && !milestone.studentConfirmed && (
                              <Badge variant="outline" className="text-warning border-warning">
                                Waiting for student
                              </Badge>
                            )}
                          </div>
                        </div>

                        {milestone.deliverables && milestone.deliverables.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {milestone.deliverables.map((file) => (
                              <Badge key={file} variant="secondary" className="gap-1 font-normal cursor-pointer hover:bg-secondary/80">
                                <FileText className="h-3 w-3" />
                                {file}
                                <Download className="h-3 w-3 ml-1" />
                              </Badge>
                            ))}
                          </div>
                        )}

                        {milestone.feedback && (
                          <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground italic">"{milestone.feedback}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Chat with Student</CardTitle>
                <CardDescription>Provide guidance and answer questions</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Chat Disclaimer */}
                <ChatDisclaimer variant="header" />

                <ScrollArea className="h-[400px] pr-4 mb-4">
                  <div className="space-y-4">
                    {project.messages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={`flex gap-3 ${msg.sender === "expert" ? "flex-row-reverse" : ""}`}
                      >
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className={
                            msg.sender === "expert" ? "bg-primary/10 text-primary" : "bg-muted"
                          }>
                            {msg.senderName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`max-w-[80%] ${msg.sender === "expert" ? "text-right" : ""}`}>
                          <div className={`flex items-center gap-2 mb-1 ${msg.sender === "expert" ? "justify-end" : ""}`}>
                            <span className="text-sm font-medium text-foreground">{msg.senderName}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(msg.timestamp)}
                            </span>
                          </div>
                          <div className={`rounded-lg p-3 ${
                            msg.sender === "expert" 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-muted"
                          }`}>
                            <p className="text-sm whitespace-pre-line">{msg.content}</p>
                            {msg.attachment && (
                              <div className={`flex items-center gap-2 mt-2 pt-2 border-t ${
                                msg.sender === "expert" ? "border-primary-foreground/20" : "border-border"
                              }`}>
                                <Paperclip className="h-3 w-3" />
                                <span className="text-xs underline cursor-pointer">{msg.attachment}</span>
                              </div>
                            )}
                          </div>
                          {/* Read Receipt for expert's messages */}
                          {msg.sender === "expert" && (
                            <div className={`flex items-center gap-1 mt-1 ${msg.sender === "expert" ? "justify-end" : ""}`}>
                              {msg.read ? (
                                <span className="text-xs text-success flex items-center gap-1">
                                  <CheckCheck className="h-3 w-3" />
                                  Read {msg.readAt && formatTimestamp(msg.readAt)}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Check className="h-3 w-3" />
                                  Sent
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Inline Disclaimer */}
                <ChatDisclaimer variant="inline" />

                {/* Message Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1"
                  />
                  <input
                    type="file"
                    ref={chatFileInputRef}
                    onChange={handleChatFileUpload}
                    className="hidden"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt,.zip,.sql"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => chatFileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                  <Button onClick={handleSendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files">
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Project Files</CardTitle>
                  <CardDescription>All files shared in this project</CardDescription>
                </div>
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt,.zip,.sql"
                  />
                  <Button 
                    className="gap-2" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Upload className="h-4 w-4" />
                    {isUploading ? "Uploading..." : "Upload File"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {uploads.length > 0 && (
                  <div className="mb-4">
                    <FileUploadProgress uploads={uploads} onRemove={removeUpload} />
                  </div>
                )}
                <div className="space-y-2">
                  {files.map((file) => (
                    <div 
                      key={file.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Uploaded by {file.uploadedBy === "expert" ? "you" : "student"} • {file.date} • {file.size}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={async () => {
                          const signedUrl = await getFileUrl(file.path);
                          if (signedUrl) {
                            window.open(signedUrl, '_blank');
                          } else {
                            toast({ title: "Couldn't open file", description: "Try again in a moment.", variant: "destructive" });
                          }
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Review Submission</DialogTitle>
            <DialogDescription>
              {selectedMilestone?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedMilestone?.deliverables && selectedMilestone.deliverables.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Submitted Files</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedMilestone.deliverables.map((file: string) => (
                    <Badge key={file} variant="secondary" className="gap-1 cursor-pointer">
                      <FileText className="h-3 w-3" />
                      {file}
                      <Download className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="rating" className="text-sm font-medium">Rating</Label>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-6 w-6 transition-colors ${
                        star <= reviewRating
                          ? "text-warning fill-warning"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="feedback" className="text-sm font-medium">Feedback</Label>
              <Textarea
                id="feedback"
                value={reviewFeedback}
                onChange={(e) => setReviewFeedback(e.target.value)}
                placeholder="Provide feedback for the student..."
                className="mt-2 resize-none"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={handleRequestRevision}>
              <ThumbsDown className="h-4 w-4" />
              Request Revision
            </Button>
            <Button className="gap-2" onClick={handleApprove}>
              <ThumbsUp className="h-4 w-4" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpertProjectDetail;