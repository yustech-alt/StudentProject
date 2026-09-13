import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import StudentDashboard from "./pages/StudentDashboard";
import ExpertDashboard from "./pages/ExpertDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ProjectDetail from "./pages/ProjectDetail";
import ExpertProjectDetail from "./pages/ExpertProjectDetail";
import ExpertEarnings from "./pages/ExpertEarnings";
import NotificationCenter from "./pages/NotificationCenter";
import NewProject from "./pages/NewProject";
import Payment from "./pages/Payment";
import PaymentSuccess from "./pages/PaymentSuccess";
import NotFound from "./pages/NotFound";
import AdminSetup from "./pages/AdminSetup";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="light" storageKey="projectsupport-ui-theme">
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* First admin setup (requires login; works only if no admin exists) */}
                <Route path="/admin-setup" element={
                  <ProtectedRoute allowedRoles={["student", "expert", "admin"]}>
                    <AdminSetup />
                  </ProtectedRoute>
                } />
                
                {/* Protected student routes */}
                <Route path="/student" element={
                  <ProtectedRoute requiredRole="student">
                    <StudentDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/project/:id" element={
                  <ProtectedRoute allowedRoles={["student", "admin"]}>
                    <ProjectDetail />
                  </ProtectedRoute>
                } />
                <Route path="/new-project" element={
                  <ProtectedRoute requiredRole="student">
                    <NewProject />
                  </ProtectedRoute>
                } />
                <Route path="/payment" element={
                  <ProtectedRoute requiredRole="student">
                    <Payment />
                  </ProtectedRoute>
                } />
                <Route path="/payment/success" element={
                  <ProtectedRoute requiredRole="student">
                    <PaymentSuccess />
                  </ProtectedRoute>
                } />
                
                {/* Protected expert routes */}
                <Route path="/expert" element={
                  <ProtectedRoute requiredRole="expert">
                    <ExpertDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/expert/project/:id" element={
                  <ProtectedRoute allowedRoles={["expert", "admin"]}>
                    <ExpertProjectDetail />
                  </ProtectedRoute>
                } />
                <Route path="/expert/earnings" element={
                  <ProtectedRoute requiredRole="expert">
                    <ExpertEarnings />
                  </ProtectedRoute>
                } />
                
                {/* Protected admin routes */}
                <Route path="/admin" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                
                {/* Protected shared routes */}
                <Route path="/notifications" element={
                  <ProtectedRoute>
                    <NotificationCenter />
                  </ProtectedRoute>
                } />
                
                {/* Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AppProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
