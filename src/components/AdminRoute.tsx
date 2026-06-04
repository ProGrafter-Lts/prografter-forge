import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminNav from "@/components/AdminNav";

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const [state, setState] = useState<"loading" | "ok" | "denied" | "anon">("loading");

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (mounted) setState("anon");
        return;
      }
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (mounted) setState(error || !data ? "denied" : "ok");
    })();
    return () => { mounted = false; };
  }, []);

  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono text-sm text-muted-foreground">
        Verifying access…
      </div>
    );
  }
  if (state === "anon") return <Navigate to="/login" replace />;
  if (state === "denied") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream px-6">
        <div className="max-w-md text-center">
          <h1 className="font-heading text-3xl text-navy mb-3">Admin only</h1>
          <p className="font-body text-secondary-text">
            This page is restricted to ProGrafter staff.
          </p>
        </div>
      </div>
    );
  }
  return (
    <>
      <AdminNav />
      {children}
    </>
  );
};

export default AdminRoute;
