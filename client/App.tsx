import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import type { ReactNode } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Docs from "./pages/Docs";
import Settings from "./pages/Settings";
import Signup from "./pages/Signup";
import Signin from "./pages/Signin";
import Layout from "./components/Layout";
import FinanceErp from "./pages/Erp";
import Operations from "./pages/Operations";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Signin />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/erp" element={<ProtectedRoute><Layout><FinanceErp /></Layout></ProtectedRoute>} />
          <Route path="/operations" element={<ProtectedRoute><Layout><Operations /></Layout></ProtectedRoute>} />
          <Route path="/docs" element={<Layout><Docs /></Layout>} />
          <Route path="/settings" element={<Layout><Settings /></Layout>} />
          <Route path="/overview" element={<Layout><Index /></Layout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);

function ProtectedRoute({ children }: { children: ReactNode }) {
  const user = localStorage.getItem("finance_user") || sessionStorage.getItem("finance_user") || localStorage.getItem("flare_user") || sessionStorage.getItem("flare_user");
  return user ? <>{children}</> : <Navigate to="/signin" replace />;
}
