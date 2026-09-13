import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  GraduationCap, 
  ArrowLeft, 
  Upload, 
  Shield, 
  Info,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const stages = [
  { id: "topic", label: "Topic Selection" },
  { id: "proposal", label: "Proposal Writing" },
  { id: "chapter1-3", label: "Chapters 1-3" },
  { id: "implementation", label: "Implementation" },
  { id: "chapter4-5", label: "Chapters 4-5" },
  { id: "defense", label: "Defense Prep" },
];

const helpTypes = [
  { id: "writing", label: "Documentation & Writing" },
  { id: "coding", label: "Coding & Implementation" },
  { id: "research", label: "Research & Analysis" },
  { id: "explanation", label: "Concept Explanation" },
  { id: "debugging", label: "Debugging & Fixes" },
  { id: "defense", label: "Defense Preparation" },
];

const urgencyLevels = [
  { id: "relaxed", label: "Relaxed", description: "I have plenty of time" },
  { id: "moderate", label: "Moderate", description: "Some time pressure" },
  { id: "urgent", label: "Urgent", description: "Deadline approaching" },
];

const NewProject = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [currentStage, setCurrentStage] = useState("");
  const [selectedHelp, setSelectedHelp] = useState<string[]>([]);
  const [urgency, setUrgency] = useState("moderate");
  const [files, setFiles] = useState<FileList | null>(null);

  const toggleHelp = (helpId: string) => {
    setSelectedHelp((prev) =>
      prev.includes(helpId) ? prev.filter((id) => id !== helpId) : [...prev, helpId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to payment page with project details
    navigate("/payment", {
      state: {
        title,
        description,
        currentStage,
        selectedHelp,
        urgency,
      },
    });
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
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8 max-w-2xl">
        {/* Back Button */}
        <Button variant="ghost" className="gap-2 mb-6 -ml-2" asChild>
          <Link to="/student">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>

        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle className="text-2xl">New Project Request</CardTitle>
            <CardDescription className="text-base">
              Tell us about your project and what kind of help you need. 
              We'll match you with the right expert.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Trust Reminder */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-accent/50 border border-accent mb-6">
              <Shield className="h-5 w-5 text-accent-foreground flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-accent-foreground mb-1">
                  Guided Support, Not Outsourcing
                </p>
                <p className="text-muted-foreground">
                  Our experts guide you through milestones and explain every step. 
                  You'll understand your project for your defense.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Project Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Project Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Hospital Management System"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Project Description</Label>
                <Textarea
                  id="description"
                  placeholder="Briefly describe your project, its goals, and any specific requirements..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  className="resize-none"
                />
              </div>

              {/* Current Stage */}
              <div className="space-y-3">
                <Label>Current Stage</Label>
                <RadioGroup value={currentStage} onValueChange={setCurrentStage}>
                  <div className="grid grid-cols-2 gap-2">
                    {stages.map((stage) => (
                      <label
                        key={stage.id}
                        htmlFor={stage.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          currentStage === stage.id
                            ? "border-primary bg-accent"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <RadioGroupItem value={stage.id} id={stage.id} />
                        <span className="text-sm font-medium">{stage.label}</span>
                      </label>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              {/* Help Needed */}
              <div className="space-y-3">
                <Label>What Help Do You Need?</Label>
                <p className="text-sm text-muted-foreground">Select all that apply</p>
                <div className="grid grid-cols-2 gap-2">
                  {helpTypes.map((help) => (
                    <label
                      key={help.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedHelp.includes(help.id)
                          ? "border-primary bg-accent"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <Checkbox
                        checked={selectedHelp.includes(help.id)}
                        onCheckedChange={() => toggleHelp(help.id)}
                      />
                      <span className="text-sm font-medium">{help.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Urgency */}
              <div className="space-y-3">
                <Label>Timeline Pressure</Label>
                <RadioGroup value={urgency} onValueChange={setUrgency}>
                  <div className="space-y-2">
                    {urgencyLevels.map((level) => (
                      <label
                        key={level.id}
                        htmlFor={`urgency-${level.id}`}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          urgency === level.id
                            ? "border-primary bg-accent"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <RadioGroupItem value={level.id} id={`urgency-${level.id}`} />
                        <div>
                          <span className="text-sm font-medium">{level.label}</span>
                          <p className="text-xs text-muted-foreground">{level.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label>Attach Files (Optional)</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setFiles(e.target.files)}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium text-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, DOC, or ZIP files up to 10MB
                    </p>
                  </label>
                  {files && files.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {Array.from(files).map((file, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-foreground bg-muted rounded-lg px-3 py-2">
                          <FileText className="h-4 w-4" />
                          {file.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Info Note */}
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border">
                <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  After submission, our team will review your request and assign an expert 
                  who matches your project needs. You'll see a notification in your dashboard 
                  as soon as that happens.
                </p>
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full h-12 text-base">
                Submit Request
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default NewProject;
