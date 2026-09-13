import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";
import { logError } from "@/lib/logger";
import { validateProjectEventData } from "@/lib/validations";
interface ProjectEvent {
  id: string;
  project_id: string;
  event_type: "milestone_confirmed" | "file_uploaded" | "message_sent" | "milestone_started";
  user_id: string;
  user_role: "student" | "expert" | "admin";
  data: {
    milestone_title?: string;
    milestone_id?: string;
    file_name?: string;
    confirmed_by?: string;
    user_name?: string;
  };
  created_at: string;
}

interface DbNotification {
  id: string;
  user_id: string;
  project_id: string | null;
  type: string;
  title: string;
  description: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

export const useRealtimeNotifications = () => {
  const { currentUser, addNotification, projects } = useApp();
  const { toast } = useToast();

  const handleProjectEvent = useCallback((payload: { new: ProjectEvent }) => {
    const event = payload.new;
    
    if (!currentUser) return;

    // Get project details
    const project = projects.find(p => p.id === event.project_id);
    if (!project) return;

    // Don't notify the user who triggered the event
    if (event.user_id === currentUser.id) return;

    // Check if the user is related to this project
    const isRelated = 
      (currentUser.role === "student" && project.studentId === currentUser.id) ||
      (currentUser.role === "expert" && project.expertId === currentUser.id) ||
      currentUser.role === "admin";

    if (!isRelated) return;

    let notificationData: { type: "milestone" | "file_upload" | "message"; title: string; description: string; link: string } | null = null;

    switch (event.event_type) {
      case "milestone_confirmed":
        notificationData = {
          type: "milestone",
          title: "Milestone Confirmed",
          description: `${event.data.confirmed_by || "Someone"} confirmed "${event.data.milestone_title || "milestone"}" on ${project.title}`,
          link: currentUser.role === "expert" 
            ? `/expert/project/${project.id}` 
            : `/project/${project.id}`,
        };
        break;

      case "file_uploaded":
        notificationData = {
          type: "file_upload" as "milestone",
          title: "New File Uploaded",
          description: `${event.data.user_name || "Someone"} uploaded "${event.data.file_name}" to ${project.title}`,
          link: currentUser.role === "expert" 
            ? `/expert/project/${project.id}?tab=files` 
            : `/project/${project.id}?tab=files`,
        };
        break;

      case "milestone_started":
        notificationData = {
          type: "milestone",
          title: "Milestone Started",
          description: `Expert started working on "${event.data.milestone_title}" for ${project.title}`,
          link: currentUser.role === "expert" 
            ? `/expert/project/${project.id}` 
            : `/project/${project.id}`,
        };
        break;
    }

    if (notificationData) {
      // Add to local state
      addNotification({
        type: notificationData.type === "file_upload" ? "milestone" : notificationData.type,
        title: notificationData.title,
        description: notificationData.description,
        read: false,
        link: notificationData.link,
      });

      // Show toast
      toast({
        title: notificationData.title,
        description: notificationData.description,
      });
    }
  }, [currentUser, projects, addNotification, toast]);

  useEffect(() => {
    if (!currentUser) return;

    // Subscribe to project_events table for real-time updates
    const channel = supabase
      .channel('project-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_events',
        },
        handleProjectEvent
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, handleProjectEvent]);

  // Function to emit a project event with validation
  const emitProjectEvent = async (
    projectId: string,
    eventType: ProjectEvent["event_type"],
    data: ProjectEvent["data"]
  ) => {
    if (!currentUser) return;

    try {
      // Validate event data before sending to database
      const validatedData = validateProjectEventData(data);
      
      // Validate project ID length
      if (projectId.length > 100) {
        logError("useRealtimeNotifications:emitProjectEvent", new Error("Project ID too long"));
        return;
      }

      // Use type assertion since the types haven't been regenerated yet
      const { error } = await (supabase as any)
        .from('project_events')
        .insert({
          project_id: projectId,
          event_type: eventType,
          user_id: currentUser.id,
          user_role: currentUser.role,
          data: validatedData,
        });

      if (error) {
        logError("useRealtimeNotifications:emitProjectEvent", error);
      }
    } catch (err) {
      logError("useRealtimeNotifications:emitProjectEvent", err);
    }
  };

  return { emitProjectEvent };
};
