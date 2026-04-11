import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Privacy from "./pages/Privacy.tsx";
import TradeRegister from "./pages/TradeRegister.tsx";
import TradeRegisterNew from "./pages/TradeRegisterNew.tsx";
import PostAJob from "./pages/PostAJob.tsx";
import Login from "./pages/Login.tsx";
import TradeDashboard from "./pages/TradeDashboard.tsx";
import HomeownerDashboard from "./pages/HomeownerDashboard.tsx";
import ProjectDetail from "./pages/ProjectDetail.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/register" element={<TradeRegister />} />
          <Route path="/register/trade" element={<TradeRegisterNew />} />
          <Route path="/post-a-job" element={<PostAJob />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard/trade"
            element={
              <ProtectedRoute>
                <TradeDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/homeowner"
            element={
              <ProtectedRoute>
                <HomeownerDashboard />
              </ProtectedRoute>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
