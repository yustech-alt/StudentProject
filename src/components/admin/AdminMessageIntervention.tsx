import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Shield, AlertTriangle, MessageSquare, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminMessageInterventionProps {
  projectId: number;
  projectTitle: string;
  studentName: string;
  expertName: string;
  onSendMessage: (message: string, recipientType: "both" | "student" | "expert") => void;
}

const warningTemplates = [
  {
    id: "off-platform",
    label: "Off-Platform Communication Warning",
    message: "⚠️ ADMIN NOTICE: We've detected potential off-platform communication attempts. This violates our terms of service. Please keep all project communication within the platform. Further violations may result in account suspension.",
  },
  {
    id: "outsourcing",
    label: "Project Outsourcing Warning",
    message: "⚠️ ADMIN NOTICE: Requests for complete project outsourcing or bypassing the milestone-based learning approach are not permitted. Our platform focuses on guidance and education. Please ensure all interactions follow these principles.",
  },
  {
    id: "deadline",
    label: "Deadline Reminder",
    message: "📅 ADMIN NOTICE: This is a reminder about the upcoming project deadline. Please ensure timely communication and milestone submissions to stay on track.",
  },
  {
    id: "quality",
    label: "Quality Concern",
    message: "⚠️ ADMIN NOTICE: We've identified quality concerns with recent submissions. Please ensure all work meets academic standards and includes proper explanations for the student's understanding.",
  },
];

export function AdminMessageIntervention({
  projectId,
  projectTitle,
  studentName,
  expertName,
  onSendMessage,
}: AdminMessageInterventionProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [recipientType, setRecipientType] = useState<"both" | "student" | "expert">("both");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = warningTemplates.find(t => t.id === templateId);
    if (template) {
      setMessage(template.message);
    }
  };

  const handleSend = () => {
    if (!message.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message to send.",
        variant: "destructive",
      });
      return;
    }

    onSendMessage(message, recipientType);
    
    toast({
      title: "Admin Message Sent",
      description: `Message sent to ${recipientType === "both" ? "both parties" : recipientType}.`,
    });

    setOpen(false);
    setMessage("");
    setSelectedTemplate("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Shield className="h-4 w-4" />
          Admin Intervention
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Admin Message Intervention
          </DialogTitle>
          <DialogDescription>
            Send an official admin message to the project chat for "{projectTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Recipients */}
          <div className="space-y-2">
            <Label>Send To</Label>
            <Select value={recipientType} onValueChange={(v) => setRecipientType(v as typeof recipientType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="both">Both Parties ({studentName} & {expertName})</SelectItem>
                <SelectItem value="student">Student Only ({studentName})</SelectItem>
                <SelectItem value="expert">Expert Only ({expertName})</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quick Templates */}
          <div className="space-y-2">
            <Label>Quick Templates</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template..." />
              </SelectTrigger>
              <SelectContent>
                {warningTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your admin message..."
              rows={5}
              className="resize-none"
            />
          </div>

          {/* Preview */}
          {message && (
            <div className="rounded-lg border bg-destructive/5 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive mb-1">Message Preview</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{message}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} className="gap-2">
            <Send className="h-4 w-4" />
            Send Message
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
