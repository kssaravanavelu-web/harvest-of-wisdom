import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { display_name: name || email.split("@")[0] } },
        });
        if (error) throw error;
        toast.success("Welcome to VidyaQuest!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) return toast.error(result.error.message);
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen grid place-items-center px-6 py-12 bg-background" style={{ fontFamily: "var(--font-sans)" }}>
      <div className="absolute inset-0 -z-10 opacity-60" style={{ background: "radial-gradient(ellipse at top, oklch(0.85 0.12 55 / 0.5), transparent 60%), radial-gradient(ellipse at bottom, oklch(0.8 0.14 155 / 0.4), transparent 60%)" }} />
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="w-10 h-10 rounded-xl grid place-items-center text-primary-foreground shadow-[var(--shadow-soft)]" style={{ background: "var(--gradient-hero)" }}>
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>VidyaQuest</span>
        </Link>
        <div className="rounded-3xl bg-card border border-border p-8 shadow-[var(--shadow-playful)]">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            {mode === "signup" ? "Start your quest" : "Welcome back, hero"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "signup" ? "Create your learner account" : "Sign in to continue earning XP"}
          </p>

          <button onClick={handleGoogle} className="mt-6 w-full py-3 rounded-xl border-2 border-border font-bold hover:border-primary transition flex items-center justify-center gap-2">
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleEmail} className="space-y-3">
            {mode === "signup" && (
              <input type="text" placeholder="Your name" value={name} onChange={e=>setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:border-primary transition" />
            )}
            <input type="email" required placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:border-primary transition" />
            <input type="password" required minLength={6} placeholder="Password (min 6 chars)" value={password} onChange={e=>setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:border-primary transition" />
            <button disabled={loading} type="submit" className="w-full py-3 rounded-xl font-bold text-primary-foreground shadow-[var(--shadow-playful)] hover:-translate-y-0.5 transition disabled:opacity-60" style={{ background: "var(--gradient-hero)" }}>
              {loading ? "..." : mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
            <button onClick={() => setMode(mode === "signup" ? "signin" : "signup")} className="font-bold text-primary hover:underline">
              {mode === "signup" ? "Sign in" : "Create one"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}