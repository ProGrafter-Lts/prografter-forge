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
import TradeSettings from "./pages/TradeSettings.tsx";
import HomeownerDashboard from "./pages/HomeownerDashboard.tsx";
import ProjectDetail from "./pages/ProjectDetail.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import NotFound from "./pages/NotFound.tsx";
import QuoteChecker from "./pages/QuoteChecker.tsx";
import GreenGrants from "./pages/GreenGrants.tsx";
import PlanningAlertsPage from "./pages/PlanningAlerts.tsx";
import HomeownerManual from "./pages/HomeownerManual.tsx";
import Unsubscribe from "./pages/Unsubscribe.tsx";
import PWAInstallBanner from "./components/PWAInstallBanner.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <PWAInstallBanner />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/register" element={<TradeRegister />} />
          <Route path="/register/trade" element={<TradeRegisterNew />} />
          <Route path="/post-a-job" element={<PostAJob />} />
          <Route path="/quote-checker" element={<QuoteChecker />} />
          <Route path="/green" element={<GreenGrants />} />
          <Route path="/login" element={<Login />} />
          <Route path="/unsubscribe" element={<Unsubscribe />} />
          <Route
            path="/planning-alerts"
            element={
              <ProtectedRoute>
                <PlanningAlertsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/trade"
            element={
              <ProtectedRoute>
                <TradeDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/trade/settings"
            element={
              <ProtectedRoute>
                <TradeSettings />
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
          <Route
            path="/project/:id"
            element={
              <ProtectedRoute>
                <ProjectDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manual/:id"
            element={
              <ProtectedRoute>
                <HomeownerManual />
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
