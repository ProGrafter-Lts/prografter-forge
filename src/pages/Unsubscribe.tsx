import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type Status = "loading" | "valid" | "already" | "invalid" | "submitting" | "success" | "error";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    const validate = async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON } }
        );
        const data = await res.json();
        if (res.ok && data.valid) setStatus("valid");
        else if (data.reason === "already_unsubscribed") setStatus("already");
        else setStatus("invalid");
      } catch {
        setStatus("invalid");
      }
    };
    validate();
  }, [token]);

  const handleConfirm = async () => {
    if (!token) return;
    setStatus("submitting");
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      if ((data as { success?: boolean })?.success) setStatus("success");
      else if ((data as { reason?: string })?.reason === "already_unsubscribed") setStatus("already");
      else {
        setErrorMsg("Something went wrong.");
        setStatus("error");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
    }
  };

  return (
    <main className="min-h-screen bg-deep flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-cream/5 border border-cream/10 rounded-2xl p-10 text-center">
        <h1 className="font-heading text-cream text-3xl mb-4">Email Preferences</h1>

        {status === "loading" && (
          <p className="font-body text-secondary-text text-sm">Checking your link…</p>
        )}

        {status === "valid" && (
          <>
            <p className="font-body text-cream/80 text-sm mb-6">
              Click below to unsubscribe from ProGrafter emails.
            </p>
            <button
              onClick={handleConfirm}
              className="w-full bg-teal text-cream font-mono text-sm py-3 rounded-xl hover:bg-teal-hover transition-colors"
            >
              Confirm Unsubscribe
            </button>
          </>
        )}

        {status === "submitting" && (
          <p className="font-body text-secondary-text text-sm">Processing…</p>
        )}

        {status === "success" && (
          <>
            <h2 className="font-heading text-teal text-2xl mb-2">You're unsubscribed.</h2>
            <p className="font-body text-cream/70 text-sm">
              You won't receive any further emails from ProGrafter.
            </p>
          </>
        )}

        {status === "already" && (
          <>
            <h2 className="font-heading text-cream text-2xl mb-2">Already unsubscribed.</h2>
            <p className="font-body text-cream/70 text-sm">
              This email address is no longer on our list.
            </p>
          </>
        )}

        {status === "invalid" && (
          <p className="font-body text-red-400 text-sm">
            This unsubscribe link is invalid or has expired.
          </p>
        )}

        {status === "error" && (
          <p className="font-body text-red-400 text-sm">{errorMsg || "Something went wrong."}</p>
        )}
      </div>
    </main>
  );
};

export default Unsubscribe;
