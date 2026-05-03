import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import PWAInstallBanner from "./components/PWAInstallBanner.tsx";
import Chatbot from "./components/Chatbot.tsx";

// Lazy-load every non-landing route so the initial bundle stays small
const Index = lazy(() => import("./pages/Index.tsx"));
const Login = lazy(() => import("./pages/Login.tsx"));
const Terms = lazy(() => import("./pages/Terms.tsx"));
const Privacy = lazy(() => import("./pages/Privacy.tsx"));
const TradeRegister = lazy(() => import("./pages/TradeRegister.tsx"));
const SignupTrade = lazy(() => import("./pages/SignupTrade.tsx"));
const SignupTradeUnderReview = lazy(() => import("./pages/SignupTradeUnderReview.tsx"));
const PostAJob = lazy(() => import("./pages/PostAJob.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.tsx"));
const TradeDashboard = lazy(() => import("./pages/TradeDashboard.tsx"));
const TradeSettings = lazy(() => import("./pages/TradeSettings.tsx"));
const HomeownerDashboard = lazy(() => import("./pages/HomeownerDashboard.tsx"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail.tsx"));
const CompareQuotes = lazy(() => import("./pages/CompareQuotes.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const QuoteChecker = lazy(() => import("./pages/QuoteChecker.tsx"));
const GreenGrants = lazy(() => import("./pages/GreenGrants.tsx"));
const PlanningAlertsPage = lazy(() => import("./pages/PlanningAlerts.tsx"));
const HomeownerManual = lazy(() => import("./pages/HomeownerManual.tsx"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe.tsx"));
const Contact = lazy(() => import("./pages/Contact.tsx"));
const About = lazy(() => import("./pages/About.tsx"));
const SignupHomeowner = lazy(() => import("./pages/SignupHomeowner.tsx"));
const SignupHomeownerNext = lazy(() => import("./pages/SignupHomeownerNext.tsx"));
const SignupCheckEmail = lazy(() => import("./pages/SignupCheckEmail.tsx"));
const SignupTradeRedirect = lazy(() => import("./pages/SignupTradeRedirect.tsx"));
const AdminVerifications = lazy(() => import("./pages/AdminVerifications.tsx"));
const AdminEmailStatus = lazy(() => import("./pages/AdminEmailStatus.tsx"));
const CheckatradeAlternative = lazy(() => import("./pages/CheckatradeAlternative.tsx"));
const IsCheckatradeWorthIt = lazy(() => import("./pages/IsCheckatradeWorthIt.tsx"));
import AdminRoute from "./components/AdminRoute.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center font-mono text-sm text-muted-foreground">
    Loading…
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <PWAInstallBanner />
        <Chatbot />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/register" element={<TradeRegister />} />
            <Route path="/register/trade" element={<SignupTrade />} />
            <Route path="/post-a-job" element={<PostAJob />} />
            <Route path="/quote-checker" element={<QuoteChecker />} />
            <Route path="/green" element={<GreenGrants />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />
            <Route path="/checkatrade-alternative" element={<CheckatradeAlternative />} />
            <Route path="/is-checkatrade-worth-it" element={<IsCheckatradeWorthIt />} />
            <Route path="/planning-alerts" element={<PlanningAlertsPage />} />
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
              path="/project/:id/compare"
              element={
                <ProtectedRoute>
                  <CompareQuotes />
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
            <Route path="/signup/homeowner" element={<SignupHomeowner />} />
            <Route path="/signup/homeowner/next" element={<SignupHomeownerNext />} />
            <Route path="/signup/homeowner/check-email" element={<SignupCheckEmail />} />
            <Route path="/signup/trade" element={<SignupTradeRedirect />} />
            <Route path="/signup/trade/under-review" element={<ProtectedRoute><SignupTradeUnderReview /></ProtectedRoute>} />
            <Route path="/admin/verifications" element={<AdminRoute><AdminVerifications /></AdminRoute>} />
            <Route path="/admin/email-status" element={<AdminRoute><AdminEmailStatus /></AdminRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
