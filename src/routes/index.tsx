import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import heroImage from "@/assets/hero.jpg";
import { Trophy, Sparkles, Wifi, Languages, Rocket, Star, Flame, Award, BookOpen, Users, Target, Heart } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

const subjects = [
  { icon: Rocket, name: "Math Missions", color: "bg-[oklch(0.62_0.22_30)]", desc: "Number quests & puzzle boss fights", xp: 1240 },
  { icon: BookOpen, name: "Story Realm", color: "bg-[oklch(0.7_0.18_155)]", desc: "Read tales, unlock chapters", xp: 980 },
  { icon: Sparkles, name: "Science Lab", color: "bg-[oklch(0.75_0.18_85)]", desc: "Experiments with animated mentors", xp: 720 },
  { icon: Languages, name: "Bhasha Battle", color: "bg-[oklch(0.55_0.18_290)]", desc: "English + मातृभाषा word duels", xp: 640 },
];

const features = [
  { icon: Wifi, title: "Works Offline", body: "Download quests once — kids learn without signal, progress syncs when back online." },
  { icon: Languages, title: "10+ Local Languages", body: "Hindi, Tamil, Bengali, Marathi, Kannada and more — kids learn in their mother tongue." },
  { icon: Trophy, title: "Quests, Not Homework", body: "Every chapter becomes a mission with XP, badges and boss levels." },
  { icon: Users, title: "Village Leaderboards", body: "Friendly competition between classrooms, schools and neighboring villages." },
  { icon: Heart, title: "Teacher Dashboard", body: "Track every student's streak and struggles in one glance — even on ₹5,000 phones." },
  { icon: Target, title: "Aligned to NCERT", body: "Grades 3–8 syllabus mapped to CBSE and state boards." },
];

const badges = [
  { icon: Flame, label: "7-Day Streak", tint: "oklch(0.62 0.22 30)" },
  { icon: Star, label: "Math Wizard", tint: "oklch(0.75 0.18 85)" },
  { icon: Award, label: "Story Master", tint: "oklch(0.7 0.18 155)" },
  { icon: Trophy, label: "Village Champ", tint: "oklch(0.55 0.18 290)" },
];

function Index() {
  const [xp, setXp] = useState(340);
  const level = Math.floor(xp / 100) + 1;
  const progress = xp % 100;

  return (
    <div className="min-h-screen bg-background font-sans text-foreground" style={{ fontFamily: "var(--font-sans)" }}>
      {/* Nav */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl grid place-items-center text-primary-foreground shadow-[var(--shadow-soft)]" style={{ background: "var(--gradient-hero)" }}>
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>VidyaQuest</span>
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-semibold text-muted-foreground">
            <a href="#quests" className="hover:text-foreground transition">Quests</a>
            <a href="#how" className="hover:text-foreground transition">How it works</a>
            <a href="#impact" className="hover:text-foreground transition">Impact</a>
          </nav>
          <button className="rounded-full px-5 py-2 text-sm font-bold text-primary-foreground shadow-[var(--shadow-playful)] transition hover:scale-105" style={{ background: "var(--gradient-hero)" }}>
            Start Playing
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-60" style={{ background: "radial-gradient(ellipse at top left, oklch(0.85 0.12 55 / 0.5), transparent 60%), radial-gradient(ellipse at bottom right, oklch(0.8 0.14 155 / 0.4), transparent 60%)" }} />
        <div className="mx-auto max-w-7xl px-6 pt-16 pb-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-4 py-1.5 text-xs font-bold text-muted-foreground shadow-[var(--shadow-soft)]">
              <Flame className="w-3.5 h-3.5 text-primary" /> Trusted by 240+ village schools
            </span>
            <h1 className="mt-6 text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              Learning that feels like{" "}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-hero)" }}>the best game ever.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              VidyaQuest turns every lesson into a quest. Kids in rural classrooms earn XP, unlock badges,
              and climb village leaderboards — in their own language, even without internet.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button className="rounded-full px-7 py-3.5 text-base font-bold text-primary-foreground shadow-[var(--shadow-playful)] transition hover:-translate-y-0.5" style={{ background: "var(--gradient-hero)" }}>
                Try a Quest Free
              </button>
              <button className="rounded-full px-7 py-3.5 text-base font-bold bg-card border-2 border-border hover:border-primary transition">
                For Teachers →
              </button>
            </div>
            <div className="mt-10 flex gap-8">
              {[{n:"12k+",l:"Young Learners"},{n:"98%",l:"Come back daily"},{n:"10",l:"Languages"}].map(s=>(
                <div key={s.l}>
                  <div className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>{s.n}</div>
                  <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero visual with floating player card */}
          <div className="relative">
            <div className="rounded-[2rem] overflow-hidden shadow-[var(--shadow-playful)] border-4 border-card rotate-1">
              <img src={heroImage} alt="Rural children learning happily" width={1536} height={1024} className="w-full h-auto" />
            </div>
            {/* Floating XP card */}
            <div className="absolute -bottom-6 -left-6 bg-card rounded-2xl p-4 shadow-[var(--shadow-playful)] border border-border w-64 -rotate-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full grid place-items-center text-primary-foreground font-bold" style={{ background: "var(--gradient-hero)" }}>
                  Lv{level}
                </div>
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground font-semibold">Priya, Class 5</div>
                  <div className="text-sm font-bold">{xp} XP earned</div>
                </div>
              </div>
              <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: "var(--gradient-hero)" }} />
              </div>
              <button onClick={() => setXp(x => x + 25)} className="mt-3 w-full text-xs font-bold py-2 rounded-lg bg-accent text-accent-foreground hover:brightness-110 transition">
                + Complete Quest (+25 XP)
              </button>
            </div>
            {/* Floating badge */}
            <div className="absolute -top-4 -right-4 bg-card rounded-2xl p-3 shadow-[var(--shadow-playful)] border border-border rotate-6 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-primary" />
              <div>
                <div className="text-[10px] text-muted-foreground font-bold uppercase">New Badge</div>
                <div className="text-sm font-bold">Math Wizard</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subjects / Quest realms */}
      <section id="quests" className="mx-auto max-w-7xl px-6 py-24">
        <div className="max-w-2xl">
          <div className="text-sm font-bold text-primary uppercase tracking-widest">Quest Realms</div>
          <h2 className="mt-2 text-4xl md:text-5xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Four worlds. Endless adventures.
          </h2>
          <p className="mt-4 text-muted-foreground">Each subject is its own world with a story, characters, boss levels and rewards mapped to NCERT chapters.</p>
        </div>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {subjects.map((s, i) => (
            <div key={s.name} className="group rounded-3xl bg-card border border-border p-6 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-playful)] hover:-translate-y-1 transition-all">
              <div className={`w-14 h-14 rounded-2xl grid place-items-center text-white ${s.color} shadow-[var(--shadow-soft)] group-hover:rotate-6 transition-transform`}>
                <s.icon className="w-7 h-7" />
              </div>
              <h3 className="mt-5 text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>{s.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              <div className="mt-5 pt-5 border-t border-border flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">TOTAL XP</span>
                <span className="text-lg font-bold text-primary">{s.xp.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Badges strip */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="rounded-[2rem] p-10 md:p-14 relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
          <div className="grid md:grid-cols-2 gap-10 items-center relative">
            <div>
              <h3 className="text-4xl md:text-5xl font-bold text-primary-foreground leading-tight" style={{ fontFamily: "var(--font-display)" }}>
                Every child deserves a trophy shelf.
              </h3>
              <p className="mt-4 text-primary-foreground/90 max-w-md">Kids collect badges for streaks, mastery and helping classmates. Real trophies get shipped to top village learners every term.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {badges.map(b => (
                <div key={b.label} className="rounded-2xl bg-card/95 backdrop-blur p-5 text-center shadow-[var(--shadow-soft)] hover:scale-105 transition">
                  <div className="w-14 h-14 mx-auto rounded-full grid place-items-center" style={{ background: b.tint }}>
                    <b.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="mt-3 text-sm font-bold">{b.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="how" className="mx-auto max-w-7xl px-6 pb-24">
        <div className="max-w-2xl">
          <div className="text-sm font-bold text-primary uppercase tracking-widest">Built for the village</div>
          <h2 className="mt-2 text-4xl md:text-5xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Made for how rural India actually learns.
          </h2>
        </div>
        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(f => (
            <div key={f.title} className="rounded-3xl p-7 bg-card border border-border shadow-[var(--shadow-soft)]">
              <div className="w-12 h-12 rounded-xl bg-accent grid place-items-center text-accent-foreground">
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="mt-5 text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Impact / CTA */}
      <section id="impact" className="mx-auto max-w-7xl px-6 pb-32">
        <div className="rounded-[2rem] bg-card border border-border p-10 md:p-16 text-center shadow-[var(--shadow-soft)]">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/40 px-4 py-1.5 text-xs font-bold uppercase tracking-widest">
            <Heart className="w-3.5 h-3.5 text-primary" /> Free for government schools
          </div>
          <h2 className="mt-6 text-4xl md:text-6xl font-bold tracking-tight max-w-3xl mx-auto" style={{ fontFamily: "var(--font-display)" }}>
            Bring VidyaQuest to your <span className="text-primary">village school.</span>
          </h2>
          <p className="mt-5 text-muted-foreground max-w-xl mx-auto">Set up in 10 minutes on a shared tablet or Android phone. No IT team required.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button className="rounded-full px-8 py-4 text-base font-bold text-primary-foreground shadow-[var(--shadow-playful)] hover:-translate-y-0.5 transition" style={{ background: "var(--gradient-hero)" }}>
              Enroll my school
            </button>
            <button className="rounded-full px-8 py-4 text-base font-bold bg-transparent border-2 border-border hover:border-primary transition">
              Watch 2-min demo
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg grid place-items-center text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>VidyaQuest</span>
          </div>
          <p>© 2026 VidyaQuest · Learning is a game worth winning.</p>
        </div>
      </footer>
    </div>
  );
}
