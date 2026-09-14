import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

// ---------------------------------------------------------------------------
// Types. Kept close to the original shape so existing pages need minimal
// changes, but every value here now comes from Supabase, not localStorage.
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  role: "student" | "expert" | "admin";
  initials: string;
  institution?: string;
  bio?: string;
  avatar?: string;
  specialization?: string;
  verified?: boolean;
  verificationStatus?: string;
  onboardingCompleted?: boolean;
  suspended?: boolean;
  suspendedReason?: string;
}

export interface Notification {
  id: string;
  type: "message" | "milestone" | "assignment" | "system" | "review" | "payment" | "file_upload";
  title: string;
  description: string;
  time: string;
  read: boolean;
  link?: string;
}

export interface Milestone {
  id: string;
  seq: number;
  title: string;
  status: "completed" | "in_progress" | "pending" | "pending_review";
  completedDate: string | null;
  deliverables: string[];
  feedback?: string;
  rating?: number;
  studentConfirmed?: boolean;
  expertConfirmed?: boolean;
  payoutAmount?: number; // net amount owed to the expert, after the platform fee
  payoutReleased?: boolean;
}

export interface Message {
  id: string;
  sender: "student" | "expert" | "admin";
  senderName: string;
  content: string;
  timestamp: string;
  attachment?: string;
  read?: boolean;
  readAt?: string;
}

export interface ProjectFile {
  id: string;
  name: string;
  uploadedBy: "student" | "expert";
  date: string;
  size: string;
  path: string; // storage path; fetch a signed URL on demand via getFileUrl()
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: "pending_payment" | "pending" | "in_progress" | "completed" | "cancelled";
  paymentStatus: "unpaid" | "paid" | "refunded";
  progress: number;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentUniversity?: string;
  expertId: string | null;
  expertName?: string;
  deadline: string;
  startDate: string;
  currentStage: string;
  lastUpdate: string;
  packageType: string;
  amountPaid: number;
  milestones: Milestone[];
  messages: Message[];
  files: ProjectFile[];
}

export interface Expert {
  id: string;
  name: string;
  email: string;
  specialty: string;
  activeProjects: number;
  verified: boolean;
  rating: number;
  suspended: boolean;
  suspendedReason?: string;
}

export interface PackageOption {
  id: string;
  title: string;
  price: number;
  milestoneCount: number;
  description: string;
}

export interface ExpertApplication {
  id: string;
  userId: string;
  name: string;
  email: string;
  specialization: string;
  credentials: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface Payout {
  id: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName?: string;
  status: "pending" | "processing" | "paid" | "failed";
  requestedAt: string;
}

interface AppState {
  projects: Project[];
  experts: Expert[];
  notifications: Notification[];
  packages: PackageOption[];
  expertApplications: ExpertApplication[];
  myExpertApplication: ExpertApplication | null;
  payouts: Payout[];
  availableBalance: number;
  loading: boolean;
}

interface AppContextType extends AppState {
  currentUser: User | null;

  // User actions
  updateProfile: (updates: Partial<User>) => Promise<void>;

  // Notification actions
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: string) => void;
  addNotification: (notification: Omit<Notification, "id" | "time">) => void;

  // Project actions
  createProject: (input: { title: string; description: string; packageId: string; deadline?: string }) => Promise<Project | null>;
  assignExpert: (projectId: string, expertId: string) => Promise<void>;
  addMessage: (projectId: string, message: { sender: "student" | "expert" | "admin"; senderName: string; content: string; attachment?: string }) => Promise<void>;
  addProjectFile: (projectId: string, file: { name: string; uploadedBy: "student" | "expert"; date: string; size: string; path: string }) => Promise<void>;
  confirmMilestone: (projectId: string, milestoneId: string) => Promise<void>;
  startMilestone: (projectId: string, milestoneId: string) => Promise<void>;
  markMessagesAsRead: (projectId: string, readerRole: "student" | "expert") => Promise<void>;
  simulateEmailNotification: (type: string, title: string, description: string) => void;
  getFileUrl: (path: string) => Promise<string | null>;

  // Payment actions: real Paystack checkout, not a client-side simulation.
  // Returns the Paystack authorization_url to redirect the browser to.
  startPayment: (projectId: string) => Promise<{ authorizationUrl: string } | { error: string }>;

  // Milestone feedback (separate from the mutual student/expert confirmation)
  setMilestoneFeedback: (milestoneId: string, feedback: string, rating?: number) => Promise<void>;

  // Expert application / review
  applyAsExpert: (specialization: string, credentials: string) => Promise<{ success: boolean; error?: string }>;
  reviewExpertApplication: (applicationId: string, approve: boolean) => Promise<void>;

  // Payouts
  requestPayout: (input: { amount: number; bankName: string; accountNumber: string; accountName?: string }) => Promise<{ success: boolean; error?: string }>;

  // Admin-only account moderation
  suspendUser: (userId: string, suspended: boolean, reason?: string) => Promise<{ success: boolean; error?: string }>;

  refresh: () => Promise<void>;

  // Onboarding
  hasSeenOnboarding: boolean;
  completeOnboarding: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function calculateProgress(milestones: Milestone[]): number {
  if (milestones.length === 0) return 0;
  const completed = milestones.filter((m) => m.status === "completed").length;
  return Math.round((completed / milestones.length) * 100);
}

type ProjectRow = Tables<"projects"> & {
  packages: Tables<"packages"> | null;
  milestones: Tables<"milestones">[];
  messages: (Tables<"messages"> & { sender_profile?: { full_name: string } | null })[];
  project_files: Tables<"project_files">[];
  student: { full_name: string; email: string; institution: string | null } | null;
  expert: { full_name: string; email: string } | null;
};

function mapProject(row: ProjectRow): Project {
  const milestones: Milestone[] = (row.milestones || [])
    .sort((a, b) => a.seq - b.seq)
    .map((m) => ({
      id: m.id,
      seq: m.seq,
      title: m.title,
      status: m.status,
      completedDate: m.completed_date,
      deliverables: Array.isArray(m.deliverables) ? (m.deliverables as string[]) : [],
      feedback: m.feedback ?? undefined,
      rating: m.rating ?? undefined,
      studentConfirmed: m.student_confirmed,
      expertConfirmed: m.expert_confirmed,
      payoutAmount: m.net_amount,
      payoutReleased: m.payout_released,
    }));

  const messages: Message[] = (row.messages || [])
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((m) => ({
      id: m.id,
      sender: m.sender_role as "student" | "expert" | "admin",
      senderName: m.sender_profile?.full_name || "",
      content: m.content,
      timestamp: m.created_at,
      attachment: m.attachment_url ?? undefined,
      read: m.read,
      readAt: m.read_at ?? undefined,
    }));

  const files: ProjectFile[] = (row.project_files || []).map((f) => ({
    id: f.id,
    name: f.file_name,
    uploadedBy: f.uploader_role as "student" | "expert",
    date: f.created_at.split("T")[0],
    size: f.file_size_bytes ? `${Math.round(f.file_size_bytes / 1024)} KB` : "",
    path: f.storage_path,
  }));

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    paymentStatus: row.payment_status,
    progress: calculateProgress(milestones),
    studentId: row.student_id,
    studentName: row.student?.full_name || "",
    studentEmail: row.student?.email || "",
    studentUniversity: row.student?.institution || undefined,
    expertId: row.expert_id,
    expertName: row.expert?.full_name || undefined,
    deadline: row.deadline || "",
    startDate: row.start_date || "",
    currentStage: row.current_stage,
    lastUpdate: timeAgo(row.updated_at),
    packageType: row.package_id,
    amountPaid: row.packages?.price_ngn || 0,
    milestones,
    messages,
    files,
  };
}

const PROJECT_SELECT = `
  *,
  packages(*),
  milestones(*),
  messages(*, sender_profile:profiles!messages_sender_profile_fkey(full_name)),
  project_files(*),
  student:profiles!projects_student_profile_fkey(full_name,email,institution),
  expert:profiles!projects_expert_profile_fkey(full_name,email)
`;

export function AppProvider({ children }: { children: ReactNode }) {
  const { user: authUser, profile, role, initialized } = useAuthContext();
  const authContext = useAuthContext();
  const { toast } = useToast();

  const [state, setState] = useState<AppState>({
    projects: [],
    experts: [],
    notifications: [],
    packages: [],
    expertApplications: [],
    myExpertApplication: null,
    payouts: [],
    availableBalance: 0,
    loading: true,
  });

  const currentUser: User | null =
    authUser && profile && role
      ? {
          id: authUser.id,
          name: profile.full_name || "",
          email: profile.email || authUser.email || "",
          phone: profile.phone || "",
          location: profile.location || "",
          role,
          initials: (profile.full_name || "").split(" ").map((n) => n[0]).join("").toUpperCase() || "U",
          institution: profile.institution || undefined,
          bio: profile.bio || undefined,
          avatar: profile.avatar_url || undefined,
          specialization: profile.specialization || undefined,
          verified: profile.verified || false,
          verificationStatus: (profile as any).verification_status || undefined,
          onboardingCompleted: profile.onboarding_completed || false,
          suspended: (profile as any).suspended || false,
          suspendedReason: (profile as any).suspended_reason || undefined,
        }
      : null;

  // Per-account, persisted in the database - not a browser-local flag. That
  // way it correctly shows exactly once per account, on any device, and
  // never re-shows for that account again after completion.
  const hasSeenOnboarding = currentUser ? currentUser.onboardingCompleted === true : true;

  const fetchInFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (!currentUser) {
      setState((s) => ({ ...s, projects: [], experts: [], notifications: [], expertApplications: [], myExpertApplication: null, payouts: [], availableBalance: 0, loading: false }));
      return;
    }
    if (fetchInFlight.current) return;
    fetchInFlight.current = true;

    try {
      const [projectsRes, notificationsRes, packagesRes] = await Promise.all([
        supabase.from("projects").select(PROJECT_SELECT).order("created_at", { ascending: false }),
        supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("packages").select("*").order("price_ngn", { ascending: true }),
      ]);

      const projects = ((projectsRes.data as unknown as ProjectRow[]) || []).map(mapProject);

      const notifications: Notification[] = (notificationsRes.data || []).map((n) => ({
        id: n.id,
        type: n.type as Notification["type"],
        title: n.title,
        description: n.description,
        time: timeAgo(n.created_at),
        read: n.read,
        link: n.link ?? undefined,
      }));

      const packages: PackageOption[] = (packagesRes.data || []).map((p) => ({
        id: p.id,
        title: p.title,
        price: p.price_ngn,
        milestoneCount: p.milestone_count,
        description: p.description,
      }));

      // Experts list: admins can query every expert profile directly.
      // Everyone else only ever needs the counterpart already embedded on
      // their own projects (RLS won't return other experts' profiles to them).
      let experts: Expert[] = [];
      if (role === "admin") {
        const { data: expertRoles } = await supabase.from("user_roles").select("user_id").eq("role", "expert");
        const expertIds = (expertRoles || []).map((r) => r.user_id);
        if (expertIds.length > 0) {
          const { data: expertProfiles } = await supabase.from("profiles").select("*").in("user_id", expertIds);
          experts = (expertProfiles || []).map((p) => ({
            id: p.user_id,
            name: p.full_name,
            email: p.email,
            specialty: p.specialization || "General",
            activeProjects: projects.filter((proj) => proj.expertId === p.user_id && proj.status === "in_progress").length,
            verified: !!p.verified,
            rating: 4.8,
            suspended: !!(p as any).suspended,
            suspendedReason: (p as any).suspended_reason || undefined,
          }));
        }
      } else {
        const seen = new Map<string, Expert>();
        for (const p of projects) {
          if (p.expertId && p.expertName && !seen.has(p.expertId)) {
            seen.set(p.expertId, {
              id: p.expertId,
              name: p.expertName,
              email: "",
              specialty: "",
              activeProjects: 0,
              verified: true,
              rating: 4.8,
              suspended: false,
            });
          }
        }
        experts = Array.from(seen.values());
      }

      // Admin-only: the review queue for expert applications.
      let expertApplications: ExpertApplication[] = [];
      if (role === "admin") {
        const { data: apps } = await supabase
          .from("expert_applications")
          .select("*, profiles!expert_applications_user_id_fkey(full_name,email)")
          .order("created_at", { ascending: true });
        expertApplications = (apps || []).map((a: any) => ({
          id: a.id,
          userId: a.user_id,
          name: a.profiles?.full_name || "Unknown",
          email: a.profiles?.email || "",
          specialization: a.specialization,
          credentials: a.credentials,
          status: a.status,
          createdAt: a.created_at,
        }));
      }

      // Expert-only: payout history and the real available balance, computed
      // the same way the server-side request_payout() function computes it,
      // so the UI never promises more than the database will actually allow.
      let payouts: Payout[] = [];
      let availableBalance = 0;
      let myExpertApplication: ExpertApplication | null = null;
      if (role === "expert") {
        const { data: myApp } = await supabase
          .from("expert_applications")
          .select("*")
          .eq("user_id", currentUser.id)
          .maybeSingle();
        if (myApp) {
          myExpertApplication = {
            id: myApp.id,
            userId: myApp.user_id,
            name: currentUser.email,
            email: currentUser.email,
            specialization: myApp.specialization,
            credentials: myApp.credentials,
            status: myApp.status as ExpertApplication["status"],
            createdAt: myApp.created_at,
          };
        }
        const { data: payoutRows } = await supabase
          .from("payouts")
          .select("*")
          .order("requested_at", { ascending: false });
        payouts = (payoutRows || []).map((p) => ({
          id: p.id,
          amount: p.amount_ngn,
          bankName: p.bank_name,
          accountNumber: p.account_number,
          accountName: p.account_name ?? undefined,
          status: p.status,
          requestedAt: p.requested_at,
        }));

        const released = projects
          .filter((p) => p.expertId === currentUser.id)
          .flatMap((p) => p.milestones)
          .filter((m) => m.payoutReleased)
          .reduce((sum, m) => sum + (m.payoutAmount || 0), 0);
        const alreadyRequested = payouts
          .filter((p) => p.status === "pending" || p.status === "processing" || p.status === "paid")
          .reduce((sum, p) => sum + p.amount, 0);
        availableBalance = Math.max(0, released - alreadyRequested);
      }

      setState({ projects, experts, notifications, packages, expertApplications, myExpertApplication, payouts, availableBalance, loading: false });
    } catch (err) {
      console.error("Failed to load app data:", err);
      setState((s) => ({ ...s, loading: false }));
    } finally {
      fetchInFlight.current = false;
    }
  }, [currentUser?.id, role]);

  useEffect(() => {
    if (!initialized) return;
    refresh();
  }, [initialized, refresh]);

  // The RLS/RPC checks are what actually stop a suspended account from doing
  // anything, but leaving them logged in would just be confusing - sign them
  // out and say why, the moment we learn about it.
  useEffect(() => {
    if (currentUser?.suspended) {
      toast({
        title: "Account suspended",
        description: currentUser.suspendedReason
          ? `Reason: ${currentUser.suspendedReason}`
          : "Contact support for details.",
        variant: "destructive",
      });
      authContext.signOut();
    }
  }, [currentUser?.suspended]);

  // Refetch whenever anything relevant changes, in this session or another.
  useEffect(() => {
    if (!currentUser) return;
    const debounce = (fn: () => void, ms: number) => {
      let t: ReturnType<typeof setTimeout>;
      return () => {
        clearTimeout(t);
        t = setTimeout(fn, ms);
      };
    };
    const debouncedRefresh = debounce(refresh, 400);

    const channel = supabase
      .channel("app-data-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, debouncedRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "milestones" }, debouncedRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, debouncedRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "project_files" }, debouncedRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "expert_applications" }, debouncedRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "payouts" }, debouncedRefresh)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${currentUser.id}` },
        debouncedRefresh
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, refresh]);

  // ---- User actions ----
  const updateProfile = async (updates: Partial<User>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.full_name = updates.name;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.location !== undefined) dbUpdates.location = updates.location;
    if (updates.institution !== undefined) dbUpdates.institution = updates.institution;
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
    if (updates.avatar !== undefined) dbUpdates.avatar_url = updates.avatar;
    if (updates.specialization !== undefined) dbUpdates.specialization = updates.specialization;
    if (updates.onboardingCompleted !== undefined) dbUpdates.onboarding_completed = updates.onboardingCompleted;

    const result = await authContext.updateProfile(dbUpdates as any);
    if (!result.success) {
      toast({ title: "Couldn't update profile", description: result.error, variant: "destructive" });
    }
  };

  // ---- Notifications ----
  const markNotificationAsRead = (id: string) => {
    setState((prev) => ({ ...prev, notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
    supabase.from("notifications").update({ read: true }).eq("id", id).then();
  };

  const markAllNotificationsAsRead = () => {
    if (!currentUser) return;
    setState((prev) => ({ ...prev, notifications: prev.notifications.map((n) => ({ ...n, read: true })) }));
    supabase.from("notifications").update({ read: true }).eq("user_id", currentUser.id).eq("read", false).then();
  };

  const deleteNotification = (id: string) => {
    setState((prev) => ({ ...prev, notifications: prev.notifications.filter((n) => n.id !== id) }));
    supabase.from("notifications").delete().eq("id", id).then();
  };

  // Persists a real row so it survives reloads and reaches the right user
  // even if they weren't online when it happened (fixes notifications that
  // used to only exist in the sender's own browser).
  const addNotification = (notification: Omit<Notification, "id" | "time">) => {
    if (!currentUser) return;
    supabase
      .from("notifications")
      .insert({
        user_id: currentUser.id,
        type: notification.type,
        title: notification.title,
        description: notification.description,
        link: notification.link,
        read: notification.read,
      })
      .then(({ error }) => {
        if (error) console.error("Failed to save notification:", error);
        else refresh();
      });
  };

  // ---- Projects ----
  const createProject = async (input: { title: string; description: string; packageId: string; deadline?: string }) => {
    if (!currentUser) return null;
    const { data, error } = await supabase
      .from("projects")
      .insert({
        title: input.title,
        description: input.description,
        package_id: input.packageId,
        student_id: currentUser.id,
        deadline: input.deadline || null,
      })
      .select(PROJECT_SELECT)
      .single();

    if (error || !data) {
      toast({ title: "Couldn't create project", description: error?.message, variant: "destructive" });
      return null;
    }
    await refresh();
    return mapProject(data as unknown as ProjectRow);
  };

  const assignExpert = async (projectId: string, expertId: string) => {
    const { error } = await supabase.rpc("assign_expert", { _project_id: projectId, _expert_id: expertId });
    if (error) {
      toast({ title: "Couldn't assign expert", description: error.message, variant: "destructive" });
      return;
    }
    await refresh();
  };

  const addMessage = async (
    projectId: string,
    message: { sender: "student" | "expert" | "admin"; senderName: string; content: string; attachment?: string }
  ) => {
    if (!currentUser) return;
    const { error } = await supabase.from("messages").insert({
      project_id: projectId,
      sender_id: currentUser.id,
      sender_role: message.sender,
      content: message.content,
      attachment_url: message.attachment,
    });
    if (error) {
      toast({ title: "Message not sent", description: error.message, variant: "destructive" });
      return;
    }
    await refresh();
  };

  const addProjectFile = async (
    projectId: string,
    file: { name: string; uploadedBy: "student" | "expert"; date: string; size: string; path: string }
  ) => {
    if (!currentUser) return;
    const { error } = await supabase.from("project_files").insert({
      project_id: projectId,
      uploaded_by: currentUser.id,
      uploader_role: file.uploadedBy,
      storage_path: file.path,
      file_name: file.name,
    });
    if (error) {
      toast({ title: "Couldn't record uploaded file", description: error.message, variant: "destructive" });
      return;
    }
    await refresh();
  };

  const confirmMilestone = async (_projectId: string, milestoneId: string) => {
    const { error } = await supabase.rpc("confirm_milestone", { _milestone_id: milestoneId });
    if (error) {
      toast({ title: "Couldn't confirm milestone", description: error.message, variant: "destructive" });
      return;
    }
    await refresh();
  };

  const startMilestone = async (_projectId: string, milestoneId: string) => {
    const { error } = await supabase.rpc("start_milestone", { _milestone_id: milestoneId });
    if (error) {
      toast({ title: "Couldn't start milestone", description: error.message, variant: "destructive" });
      return;
    }
    await refresh();
  };

  const markMessagesAsRead = async (projectId: string, readerRole: "student" | "expert") => {
    const oppositeRole = readerRole === "student" ? "expert" : "student";
    await supabase
      .from("messages")
      .update({ read: true, read_at: new Date().toISOString() })
      .eq("project_id", projectId)
      .eq("sender_role", oppositeRole)
      .eq("read", false);
  };

  const simulateEmailNotification = (type: string, title: string, description: string) => {
    // There is no real email provider wired up yet. This intentionally does
    // nothing user-visible; use addNotification for anything that should
    // actually reach the person.
    console.info(`[No email provider configured] ${type}: ${title} - ${description}`);
  };

  const getFileUrl = async (path: string): Promise<string | null> => {
    const { data, error } = await supabase.storage.from("project-files").createSignedUrl(path, 60 * 10);
    if (error) {
      console.error("Failed to create signed URL:", error);
      return null;
    }
    return data.signedUrl;
  };

  const startPayment = async (projectId: string): Promise<{ authorizationUrl: string } | { error: string }> => {
    const { data, error } = await supabase.functions.invoke("paystack-initialize", { body: { project_id: projectId } });
    if (error || !data?.success) {
      return { error: data?.error || error?.message || "Could not start payment" };
    }
    return { authorizationUrl: data.authorization_url };
  };

  const setMilestoneFeedback = async (milestoneId: string, feedback: string, rating?: number) => {
    const { error } = await supabase.rpc("set_milestone_feedback", {
      _milestone_id: milestoneId,
      _feedback: feedback,
      _rating: rating ?? null,
    });
    if (error) {
      toast({ title: "Couldn't save feedback", description: error.message, variant: "destructive" });
      return;
    }
    await refresh();
  };

  const suspendUser = async (userId: string, suspended: boolean, reason?: string) => {
    const { error } = await supabase.rpc("set_user_suspension", {
      _user_id: userId,
      _suspended: suspended,
      _reason: reason || null,
    });
    if (error) return { success: false, error: error.message };
    await refresh();
    return { success: true };
  };

  const applyAsExpert = async (specialization: string, credentials: string) => {
    if (!currentUser) return { success: false, error: "Not logged in" };
    const { error } = await supabase.from("expert_applications").insert({
      user_id: currentUser.id,
      specialization,
      credentials,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const reviewExpertApplication = async (applicationId: string, approve: boolean) => {
    const { error } = await supabase.rpc("review_expert_application", {
      _application_id: applicationId,
      _approve: approve,
    });
    if (error) {
      toast({ title: "Couldn't review application", description: error.message, variant: "destructive" });
      return;
    }
    await refresh();
  };

  const requestPayout = async (input: { amount: number; bankName: string; accountNumber: string; accountName?: string }) => {
    const { error } = await supabase.rpc("request_payout", {
      _amount_ngn: input.amount,
      _bank_name: input.bankName,
      _account_number: input.accountNumber,
      _account_name: input.accountName || null,
    });
    if (error) return { success: false, error: error.message };
    await refresh();
    return { success: true };
  };

  const completeOnboarding = () => {
    // Fire-and-forget: the modal closes immediately from local state in the
    // pages that call this; this call just makes sure it never comes back.
    void updateProfile({ onboardingCompleted: true });
  };

  const value: AppContextType = {
    currentUser,
    ...state,
    hasSeenOnboarding,
    updateProfile,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    addNotification,
    createProject,
    assignExpert,
    addMessage,
    addProjectFile,
    confirmMilestone,
    startMilestone,
    markMessagesAsRead,
    simulateEmailNotification,
    getFileUrl,
    startPayment,
    applyAsExpert,
    reviewExpertApplication,
    requestPayout,
    setMilestoneFeedback,
    suspendUser,
    refresh,
    completeOnboarding,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
