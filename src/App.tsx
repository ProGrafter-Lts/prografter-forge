import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
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
const Cookies = lazy(() => import("./pages/Cookies.tsx"));
const TradeRegister = lazy(() => import("./pages/TradeRegister.tsx"));
const SignupTrade = lazy(() => import("./pages/SignupTrade.tsx"));
const SignupTradeUnderReview = lazy(() => import("./pages/SignupTradeUnderReview.tsx"));
const SignupTradeAssessmentPending = lazy(() => import("./pages/SignupTradeAssessmentPending.tsx"));
const Verification = lazy(() => import("./pages/Verification.tsx"));
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
const AdminSuppliers = lazy(() => import("./pages/AdminSuppliers.tsx"));
const Suppliers = lazy(() => import("./pages/Suppliers.tsx"));
const AdminEmailStatus = lazy(() => import("./pages/AdminEmailStatus.tsx"));
const AdminTestimonials = lazy(() => import("./pages/AdminTestimonials.tsx"));
const SubmitTestimonial = lazy(() => import("./pages/SubmitTestimonial.tsx"));
const CheckatradeAlternative = lazy(() => import("./pages/CheckatradeAlternative.tsx"));
const IsCheckatradeWorthIt = lazy(() => import("./pages/IsCheckatradeWorthIt.tsx"));
const ContractPage = lazy(() => import("./pages/ContractPage.tsx"));
const LegalReview = lazy(() => import("./pages/LegalReview.tsx"));
const QuickBuildPage = lazy(() => import("./pages/QuickBuildPage.tsx"));
const Apply = lazy(() => import("./pages/Apply.tsx"));
const Vetting = lazy(() => import("./pages/Vetting.tsx"));
const PostJobBrief = lazy(() => import("./pages/PostJobBrief.tsx"));
const QuoteCheckerAI = lazy(() => import("./pages/QuoteCheckerAI.tsx"));
const JobOS = lazy(() => import("./pages/JobOS.tsx"));
const ReviewSubmit = lazy(() => import("./pages/ReviewSubmit.tsx"));
const TraderReviews = lazy(() => import("./pages/TraderReviews.tsx"));
const DisputeRaise = lazy(() => import("./pages/DisputeRaise.tsx"));
const DisputeDetail = lazy(() => import("./pages/DisputeDetail.tsx"));
const AdminDisputes = lazy(() => import("./pages/AdminDisputes.tsx"));
const PlanningPipeline = lazy(() => import("./pages/PlanningPipeline.tsx"));
const AdminTradeScraper = lazy(() => import("./pages/AdminTradeScraper.tsx"));
const AdminApplications = lazy(() => import("./pages/AdminApplications.tsx"));
const AdminApplicationDetail = lazy(() => import("./pages/AdminApplicationDetail.tsx"));
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
            <Route path="/cookies" element={<Cookies />} />
            <Route path="/register" element={<TradeRegister />} />
            <Route path="/register/trade" element={<SignupTradeRedirect />} />
            <Route path="/post-a-job" element={<Navigate to="/post-job-brief" replace />} />
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
              path="/project/:id/contract"
              element={
                <ProtectedRoute>
                  <ContractPage />
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
            <Route path="/signup/trade/under-review" element={<ProtectedRoute><SignupTradeUnderReview /></ProtectedRoute>} />
            <Route path="/signup/trade/assessment-pending" element={<ProtectedRoute><SignupTradeAssessmentPending /></ProtectedRoute>} />
            <Route path="/verification" element={<Verification />} />
            <Route path="/signup/trade" element={<SignupTradeRedirect />} />
            <Route path="/signup/trade/under-review" element={<ProtectedRoute><SignupTradeUnderReview /></ProtectedRoute>} />
            <Route path="/admin/verifications" element={<AdminRoute><AdminVerifications /></AdminRoute>} />
            <Route path="/admin/suppliers" element={<AdminRoute><AdminSuppliers /></AdminRoute>} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/admin/email-status" element={<AdminRoute><AdminEmailStatus /></AdminRoute>} />
            <Route path="/admin/testimonials" element={<AdminRoute><AdminTestimonials /></AdminRoute>} />
            <Route path="/share-your-experience" element={<SubmitTestimonial />} />
            <Route path="/legal-review" element={<LegalReview />} />
            <Route path="/apply" element={<Apply />} />
            <Route path="/vetting" element={<Vetting />} />
            <Route path="/post-job-brief" element={<PostJobBrief />} />
            <Route path="/quote-checker-ai" element={<QuoteCheckerAI />} />
            <Route path="/jobs/:ref" element={<ProtectedRoute><JobOS /></ProtectedRoute>} />
            <Route path="/reviews/:ref" element={<ProtectedRoute><ReviewSubmit /></ProtectedRoute>} />
            <Route path="/traders/:id/reviews" element={<TraderReviews />} />
            <Route path="/disputes/new" element={<ProtectedRoute><DisputeRaise /></ProtectedRoute>} />
            <Route path="/disputes/:id" element={<ProtectedRoute><DisputeDetail /></ProtectedRoute>} />
            <Route path="/admin/disputes" element={<AdminRoute><AdminDisputes /></AdminRoute>} />
            <Route path="/admin/planning-pipeline" element={<AdminRoute><PlanningPipeline /></AdminRoute>} />
            <Route path="/admin/trade-scraper" element={<AdminRoute><AdminTradeScraper /></AdminRoute>} />
            <Route path="/admin/applications" element={<AdminRoute><AdminApplications /></AdminRoute>} />
            <Route path="/admin/applications/:id" element={<AdminRoute><AdminApplicationDetail /></AdminRoute>} />
            <Route
              path="/quote-builder/quickbuild"
              element={
                <ProtectedRoute>
                  <QuickBuildPage />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
