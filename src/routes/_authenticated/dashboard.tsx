import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Rocket, BookOpen, Languages, Trophy, Flame, Star, Award, LogOut, Check, Lock, Video, School } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

type Profile = { id: string; display_name: string; total_xp: number; streak_days: number; village: string | null; class_level: number | null; school_id: string | null };
type Subject = { id: string; slug: string; name: string; description: string | null; color: string; icon: string };
type Quest = { id: string; subject_id: string; title: string; description: string; difficulty: string; xp_reward: number; question: string; options: string[]; correct_index: number; sort_order: number };
type Badge = { id: string; slug: string; name: string; description: string; icon: string; xp_threshold: number };
type LB = { id: string; display_name: string; total_xp: number; village: string | null };

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  rocket: Rocket, book: BookOpen, sparkles: Sparkles, languages: Languages,
  trophy: Trophy, star: Star, award: Award,
};

function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [badges, setBadges] = useState<Badge[]>([]);
  const [myBadges, setMyBadges] = useState<Set<string>>(new Set());
  const [leaderboard, setLeaderboard] = useState<LB[]>([]);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [openQuest, setOpenQuest] = useState<Quest | null>(null);
  const [pick, setPick] = useState<number | null>(null);
  const [showOnboard, setShowOnboard] = useState(false);
  const [obMode, setObMode] = useState<"join" | "create">("join");
  const [obCode, setObCode] = useState("");
  const [obName, setObName] = useState("");
  const [obBusy, setObBusy] = useState(false);

  const load = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;

    const [p, s, q, c, b, ub, lb] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
      supabase.from("subjects").select("*").order("name"),
      supabase.from("quests").select("*").order("sort_order"),
      supabase.from("quest_completions").select("quest_id").eq("user_id", uid),
      supabase.from("badges").select("*").order("xp_threshold"),
      supabase.from("user_badges").select("badge_id").eq("user_id", uid),
      supabase.from("profiles").select("id, display_name, total_xp, village").order("total_xp", { ascending: false }).limit(10),
    ]);
    if (p.data) setProfile(p.data as Profile);
    if (p.data && !(p.data as Profile).school_id) setShowOnboard(true);
    if (s.data) { setSubjects(s.data as Subject[]); if (!activeSubject && s.data[0]) setActiveSubject((s.data[0] as Subject).id); }
    if (q.data) setQuests((q.data as unknown) as Quest[]);
    if (c.data) setCompleted(new Set(c.data.map(r => r.quest_id)));
    if (b.data) setBadges(b.data as Badge[]);
    if (ub.data) setMyBadges(new Set(ub.data.map(r => r.badge_id)));
    if (lb.data) setLeaderboard(lb.data as LB[]);
  };

  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const submit = async () => {
    if (!openQuest || pick === null) return;
    if (pick !== openQuest.correct_index) {
      toast.error("Not quite — try again!");
      return;
    }
    const { data, error } = await supabase.rpc("complete_quest", { _quest_id: openQuest.id });
    if (error) return toast.error(error.message);
    const res = data as { already: boolean; xp_earned: number; total_xp: number; new_badges: Array<{ name: string }> };
    if (res.already) toast("Already completed ✔");
    else {
      toast.success(`Correct! +${res.xp_earned} XP`);
      res.new_badges?.forEach(nb => toast.success(`🏆 New badge: ${nb.name}`));
    }
    setOpenQuest(null); setPick(null);
    await load();
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const doJoin = async () => {
    if (!obCode.trim()) return;
    setObBusy(true);
    const { error } = await supabase.rpc("join_school", { _code: obCode.trim().toUpperCase() });
    setObBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Joined school!");
    setShowOnboard(false);
    await load();
  };
  const doCreate = async () => {
    if (!obName.trim()) return;
    setObBusy(true);
    const { data, error } = await supabase.rpc("create_school", { _name: obName.trim() });
    setObBusy(false);
    if (error) return toast.error(error.message);
    const r = data as { teacher_code: string; student_code: string };
    toast.success(`School created! Teacher code: ${r.teacher_code} · Student code: ${r.student_code}`);
    setShowOnboard(false);
    await load();
  };

  const level = profile ? Math.floor(profile.total_xp / 100) + 1 : 1;
  const levelProgress = profile ? profile.total_xp % 100 : 0;
  const subjectQuests = quests.filter(q => q.subject_id === activeSubject);

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "var(--font-sans)" }}>
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl grid place-items-center text-primary-foreground shadow-[var(--shadow-soft)]" style={{ background: "var(--gradient-hero)" }}>
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>VidyaQuest</span>
          </Link>
          <div className="flex items-center gap-5">
            <Link to="/dashboard" className="text-sm font-bold text-foreground flex items-center gap-1.5"><Trophy className="w-4 h-4" />Quests</Link>
            <Link to="/lessons" className="text-sm font-bold text-muted-foreground hover:text-foreground flex items-center gap-1.5"><Video className="w-4 h-4" />Lessons</Link>
            <button onClick={signOut} className="text-sm font-semibold text-muted-foreground hover:text-foreground flex items-center gap-2">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10 space-y-10">
        {/* Hero stats */}
        <div className="rounded-3xl p-8 md:p-10 text-primary-foreground shadow-[var(--shadow-playful)] relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
          <div className="grid md:grid-cols-3 gap-6 items-center relative">
            <div className="md:col-span-2">
              <div className="text-sm font-bold opacity-90 uppercase tracking-widest">Welcome back</div>
              <h1 className="mt-1 text-4xl md:text-5xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                {profile?.display_name ?? "Learner"} 👋
              </h1>
              <div className="mt-5 flex flex-wrap gap-6">
                <Stat label="Level" value={String(level)} />
                <Stat label="Total XP" value={profile ? profile.total_xp.toLocaleString() : "0"} />
                <Stat label="Streak" value={`${profile?.streak_days ?? 0} 🔥`} />
                <Stat label="Badges" value={String(myBadges.size)} />
              </div>
            </div>
            <div className="bg-card/95 backdrop-blur text-foreground rounded-2xl p-5 shadow-[var(--shadow-soft)]">
              <div className="text-xs font-bold text-muted-foreground uppercase">Level {level} progress</div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>{levelProgress}/100 XP</span>
                <span className="text-xs text-muted-foreground">to Lv{level+1}</span>
              </div>
              <div className="mt-3 h-3 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${levelProgress}%`, background: "var(--gradient-hero)" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Subject tabs */}
        <section>
          <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: "var(--font-display)" }}>Choose your realm</h2>
          <div className="flex flex-wrap gap-3">
            {subjects.map(s => {
              const Icon = iconMap[s.icon] ?? Sparkles;
              const active = s.id === activeSubject;
              return (
                <button key={s.id} onClick={() => setActiveSubject(s.id)} className={`px-5 py-3 rounded-2xl font-bold flex items-center gap-2 transition ${active ? "text-white shadow-[var(--shadow-playful)]" : "bg-card border border-border hover:border-primary"}`} style={active ? { background: s.color } : undefined}>
                  <Icon className="w-5 h-5" /> {s.name}
                </button>
              );
            })}
          </div>
        </section>

        {/* Quests grid */}
        <section className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {subjectQuests.map(q => {
              const done = completed.has(q.id);
              return (
                <div key={q.id} className="rounded-2xl p-6 bg-card border border-border shadow-[var(--shadow-soft)] flex items-center gap-5 hover:-translate-y-0.5 transition">
                  <div className={`w-14 h-14 rounded-2xl grid place-items-center font-bold text-lg ${done ? "bg-secondary text-secondary-foreground" : "bg-accent text-accent-foreground"}`}>
                    {done ? <Check className="w-6 h-6" /> : `#${q.sort_order}`}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>{q.title}</h3>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase">{q.difficulty}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{q.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-primary font-bold text-lg">+{q.xp_reward} XP</div>
                    <button onClick={() => { setOpenQuest(q); setPick(null); }} className={`mt-1 px-4 py-2 rounded-full text-sm font-bold transition ${done ? "bg-muted text-muted-foreground" : "text-primary-foreground shadow-[var(--shadow-soft)] hover:-translate-y-0.5"}`} style={done ? undefined : { background: "var(--gradient-hero)" }}>
                      {done ? "Replay" : "Start"}
                    </button>
                  </div>
                </div>
              );
            })}
            {subjectQuests.length === 0 && <div className="text-muted-foreground text-sm">No quests yet in this realm.</div>}
          </div>

          {/* Sidebar: badges + leaderboard */}
          <aside className="space-y-6">
            <div className="rounded-2xl p-6 bg-card border border-border shadow-[var(--shadow-soft)]">
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
                <Trophy className="w-5 h-5 text-primary" /> Badges
              </h3>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {badges.map(b => {
                  const earned = myBadges.has(b.id);
                  const Icon = iconMap[b.icon] ?? Trophy;
                  return (
                    <div key={b.id} title={`${b.name} — ${b.description}`} className={`aspect-square rounded-xl grid place-items-center transition ${earned ? "text-primary-foreground shadow-[var(--shadow-soft)]" : "bg-muted text-muted-foreground"}`} style={earned ? { background: "var(--gradient-hero)" } : undefined}>
                      {earned ? <Icon className="w-6 h-6" /> : <Lock className="w-4 h-4" />}
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 text-xs text-muted-foreground">{myBadges.size} of {badges.length} unlocked</div>
            </div>

            <div className="rounded-2xl p-6 bg-card border border-border shadow-[var(--shadow-soft)]">
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
                <Flame className="w-5 h-5 text-primary" /> Village Leaderboard
              </h3>
              <ol className="mt-4 space-y-2">
                {leaderboard.map((r, i) => {
                  const isMe = r.id === profile?.id;
                  return (
                    <li key={r.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isMe ? "bg-accent/40" : ""}`}>
                      <span className="w-6 text-center font-bold text-muted-foreground">{i + 1}</span>
                      <span className="flex-1 truncate font-semibold">{r.display_name}{isMe && " (you)"}</span>
                      <span className="text-primary font-bold">{r.total_xp} XP</span>
                    </li>
                  );
                })}
                {leaderboard.length === 0 && <div className="text-sm text-muted-foreground">Be the first!</div>}
              </ol>
            </div>
          </aside>
        </section>
      </main>

      {/* Quest modal */}
      {openQuest && (
        <div className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm grid place-items-center p-4" onClick={() => { setOpenQuest(null); setPick(null); }}>
          <div className="w-full max-w-lg rounded-3xl bg-card p-8 shadow-[var(--shadow-playful)]" onClick={e => e.stopPropagation()}>
            <div className="text-xs font-bold text-primary uppercase tracking-widest">Quest · +{openQuest.xp_reward} XP</div>
            <h3 className="mt-2 text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>{openQuest.title}</h3>
            <p className="mt-4 text-lg">{openQuest.question}</p>
            <div className="mt-5 space-y-2">
              {openQuest.options.map((opt, i) => (
                <button key={i} onClick={() => setPick(i)} className={`w-full text-left px-4 py-3 rounded-xl border-2 font-semibold transition ${pick === i ? "border-primary bg-accent/40" : "border-border hover:border-primary/50"}`}>
                  {String.fromCharCode(65 + i)}. {opt}
                </button>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => { setOpenQuest(null); setPick(null); }} className="flex-1 py-3 rounded-xl border-2 border-border font-bold hover:border-primary transition">Cancel</button>
              <button onClick={submit} disabled={pick === null} className="flex-1 py-3 rounded-xl font-bold text-primary-foreground shadow-[var(--shadow-soft)] disabled:opacity-50 transition" style={{ background: "var(--gradient-hero)" }}>Submit</button>
            </div>
          </div>
        </div>
      )}

      {showOnboard && (
        <div className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm grid place-items-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-[var(--shadow-playful)]">
            <div className="flex items-center gap-2 text-primary"><School className="w-5 h-5" /><span className="text-xs font-bold uppercase tracking-widest">Set up your school</span></div>
            <h3 className="mt-2 text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Join or create a school</h3>
            <div className="mt-5 grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
              <button onClick={() => setObMode("join")} className={`py-2 rounded-lg font-bold text-sm ${obMode === "join" ? "bg-card shadow" : "text-muted-foreground"}`}>Join with code</button>
              <button onClick={() => setObMode("create")} className={`py-2 rounded-lg font-bold text-sm ${obMode === "create" ? "bg-card shadow" : "text-muted-foreground"}`}>Create school</button>
            </div>
            {obMode === "join" ? (
              <div className="mt-5 space-y-3">
                <p className="text-sm text-muted-foreground">Enter the teacher or student code from your school admin.</p>
                <input value={obCode} onChange={e => setObCode(e.target.value)} placeholder="e.g. S-A1B2C3" className="w-full px-4 py-3 rounded-xl border border-border bg-background uppercase font-mono" />
                <button disabled={obBusy} onClick={doJoin} className="w-full py-3 rounded-xl font-bold text-primary-foreground shadow-[var(--shadow-soft)] disabled:opacity-50" style={{ background: "var(--gradient-hero)" }}>Join school</button>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                <p className="text-sm text-muted-foreground">You'll be the school admin and can invite teachers & students with the generated codes.</p>
                <input value={obName} onChange={e => setObName(e.target.value)} placeholder="School name" className="w-full px-4 py-3 rounded-xl border border-border bg-background" />
                <button disabled={obBusy} onClick={doCreate} className="w-full py-3 rounded-xl font-bold text-primary-foreground shadow-[var(--shadow-soft)] disabled:opacity-50" style={{ background: "var(--gradient-hero)" }}>Create school</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>{value}</div>
      <div className="text-xs opacity-90 font-semibold uppercase tracking-wide">{label}</div>
    </div>
  );
}