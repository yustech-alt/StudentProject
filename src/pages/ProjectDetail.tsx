import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
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
  Check,
  CheckCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/contexts/AppContext";
import { ChatDisclaimer } from "@/components/chat/ChatDisclaimer";
import { PaymentStatusBadge } from "@/components/payment/PaymentStatusBadge";
import { useFileUpload } from "@/hooks/useFileUpload";
import { FileUploadProgress } from "@/components/files/FileUploadProgress";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";

const getMilestoneIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-5 w-5 text-success" />;
    case "in_progress":
      return <Clock className="h-5 w-5 text-primary animate-pulse" />;
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

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser, projects, experts, addMessage, confirmMilestone, markMessagesAsRead, addProjectFile, getFileUrl } = useApp();
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const { emitProjectEvent } = useRealtimeNotifications();
  
  const { uploads, isUploading, uploadFile, removeUpload } = useFileUpload({
    bucket: 'project-files',
    onComplete: (file) => {
      if (file.status === 'complete' && file.path && id) {
        addProjectFile(id, {
          name: file.fileName,
          uploadedBy: 'student',
          date: new Date().toISOString().split('T')[0],
          size: file.fileSizeBytes ? `${Math.round(file.fileSizeBytes / 1024)} KB` : 'Uploaded',
          path: file.path
        });
        // Emit real-time event for file upload
        emitProjectEvent(id, 'file_uploaded', {
          file_name: file.fileName,
          user_name: currentUser?.name || 'Student'
        });
      }
    }
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  const project = projects.find(p => p.id === id);
  const expert = project?.expertId ? experts.find(e => e.id === project.expertId) : null;

  // Mark messages as read when viewing chat
  useEffect(() => {
    if (activeTab === "chat" && id && currentUser?.role === "student") {
      markMessagesAsRead(id, "student");
    }
  }, [activeTab, id, currentUser, markMessagesAsRead]);

  if (!currentUser || !project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Project not found</h2>
          <Button asChild>
            <Link to="/student">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleSendMessage = () => {
    if (newMessage.trim() && id) {
      addMessage(id, {
        sender: currentUser.role === "student" ? "student" : "expert",
        senderName: currentUser.name,
        content: newMessage,
      });
      toast({
        title: "Message Sent",
        description: "Your message has been delivered.",
      });
      setNewMessage("");
    }
  };

  const handleConfirmMilestone = (milestoneId: string) => {
    if (id) {
      confirmMilestone(id, milestoneId);
      
      const milestone = project.milestones.find(m => m.id === milestoneId);
      const expertAlreadyConfirmed = milestone?.expertConfirmed;
      
      // Emit real-time event for milestone confirmation
      emitProjectEvent(id, 'milestone_confirmed', {
        milestone_id: milestoneId,
        milestone_title: milestone?.title || 'Milestone',
        confirmed_by: currentUser?.name || 'Student'
      });
      
      if (expertAlreadyConfirmed) {
        // Both confirmed - the database has already released the real payout
        // and sent both of you a persisted notification.
        toast({
          title: "🎉 Milestone Completed!",
          description: `Both you and the expert have confirmed. Payment has been released.`,
        });
      } else {
        toast({
          title: "Milestone Confirmed",
          description: "Waiting for expert confirmation to release payment.",
        });
      }
    }
  };

  // Use files from context (shared between student and expert)
  const files = project?.files || [];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      for (const file of Array.from(selectedFiles)) {
        await uploadFile(file, id);
      }
    }
    // Reset input
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

  const unreadCount = project.messages.filter(m => m.sender === "expert" && !m.read).length;

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
      <main className="container py-8">
        {/* Back Button */}
        <Button variant="ghost" className="gap-2 mb-6 -ml-2" asChild>
          <Link to="/student">
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

          {/* Expert Card */}
          <Card className="shadow-card lg:w-80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Assigned Expert</CardTitle>
            </CardHeader>
            <CardContent>
              {expert ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {expert.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{expert.name}</p>
                        <Badge className="bg-success/10 text-success border-success/20 text-xs px-1.5">
                          <CheckCircle2 className="h-3 w-3" />
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{expert.specialty}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-accent/50 rounded-lg">
                    <Shield className="h-4 w-4 text-accent-foreground" />
                    <span>Verified expert with {expert.activeProjects}+ active projects</span>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">No expert assigned yet</p>
              )}
            </CardContent>
          </Card>
        </div>

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
                <CardDescription>Track progress through each phase of your project. Both you and the expert must confirm completion for payment to be released.</CardDescription>
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
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                          <div>
                            <h3 className={`font-medium ${
                              milestone.status === "completed" ? "text-foreground" : 
                              milestone.status === "in_progress" ? "text-primary" : "text-muted-foreground"
                            }`}>
                              {milestone.title}
                            </h3>
                            {/* Confirmation Status */}
                            {(milestone.status === "in_progress" || milestone.status === "pending_review") && (
                              <div className="flex items-center gap-3 mt-1 text-xs">
                                <span className={milestone.studentConfirmed ? "text-success" : "text-muted-foreground"}>
                                  You: {milestone.studentConfirmed ? "✓ Confirmed" : "Pending"}
                                </span>
                                <span className={milestone.expertConfirmed ? "text-success" : "text-muted-foreground"}>
                                  Expert: {milestone.expertConfirmed ? "✓ Confirmed" : "Pending"}
                                </span>
                              </div>
                            )}
                          </div>
                          {milestone.status === "completed" && milestone.completedDate && (
                            <span className="text-sm text-muted-foreground">
                              Completed: {new Date(milestone.completedDate).toLocaleDateString()}
                            </span>
                          )}
                          {milestone.status === "in_progress" && !milestone.studentConfirmed && (
                            <Button size="sm" onClick={() => handleConfirmMilestone(milestone.id)}>
                              <Check className="h-4 w-4 mr-1" />
                              Confirm Complete
                            </Button>
                          )}
                          {milestone.status === "in_progress" && milestone.studentConfirmed && !milestone.expertConfirmed && (
                            <Badge variant="outline" className="text-warning border-warning">
                              Waiting for expert
                            </Badge>
                          )}
                        </div>

                        {milestone.deliverables && milestone.deliverables.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {milestone.deliverables.map((file) => (
                              <Badge key={file} variant="secondary" className="gap-1 font-normal">
                                <FileText className="h-3 w-3" />
                                {file}
                              </Badge>
                            ))}
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
                <CardTitle>Chat with Expert</CardTitle>
                <CardDescription>Discuss your project and get guidance</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Chat Disclaimer */}
                <ChatDisclaimer variant="header" />

                <ScrollArea className="h-[400px] pr-4 mb-4">
                  <div className="space-y-4">
                    {project.messages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={`flex gap-3 ${msg.sender === "student" ? "flex-row-reverse" : ""}`}
                      >
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className={
                            msg.sender === "expert" ? "bg-primary/10 text-primary" : "bg-muted"
                          }>
                            {msg.senderName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`max-w-[80%] ${msg.sender === "student" ? "text-right" : ""}`}>
                          <div className={`flex items-center gap-2 mb-1 ${msg.sender === "student" ? "justify-end" : ""}`}>
                            <span className="text-sm font-medium text-foreground">{msg.senderName}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(msg.timestamp)}
                            </span>
                          </div>
                          <div className={`rounded-lg p-3 ${
                            msg.sender === "student" 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-muted"
                          }`}>
                            <p className="text-sm whitespace-pre-line">{msg.content}</p>
                            {msg.attachment && (
                              <div className={`flex items-center gap-2 mt-2 pt-2 border-t ${
                                msg.sender === "student" ? "border-primary-foreground/20" : "border-border"
                              }`}>
                                <Paperclip className="h-3 w-3" />
                                <span className="text-xs underline cursor-pointer">{msg.attachment}</span>
                              </div>
                            )}
                          </div>
                          {/* Read Receipt for student's messages */}
                          {msg.sender === "student" && (
                            <div className={`flex items-center gap-1 mt-1 ${msg.sender === "student" ? "justify-end" : ""}`}>
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
                {/* Upload Progress */}
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
                            Uploaded by {file.uploadedBy === "student" ? "you" : "expert"} • {file.date} • {file.size}
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
    </div>
  );
};

export default ProjectDetail;