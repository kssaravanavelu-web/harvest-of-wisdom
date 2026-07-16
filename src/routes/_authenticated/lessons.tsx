import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Video, Trophy, LogOut, Upload, Play, Plus, X, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/lessons")({
  component: LessonsPage,
});

type Lesson = { id: string; title: string; description: string | null; video_path: string; xp_reward: number; teacher_id: string; school_id: string; subject_id: string | null; created_at: string };
type Question = { id: string; lesson_id: string; question: string; options: string[]; correct_index: number; sort_order: number };
type Submission = { id: string; lesson_id: string; student_id: string; score: number; total: number; xp_earned: number };
type Subject = { id: string; name: string; color: string };

function LessonsPage() {
  const navigate = useNavigate();
  const [uid, setUid] = useState<string | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [isTeacher, setIsTeacher] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [mySubs, setMySubs] = useState<Map<string, Submission>>(new Map());
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [openLesson, setOpenLesson] = useState<Lesson | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showUpload, setShowUpload] = useState(false);

  const load = async () => {
    const { data: ud } = await supabase.auth.getUser();
    const u = ud.user?.id;
    if (!u) return;
    setUid(u);
    const { data: prof } = await supabase.from("profiles").select("school_id").eq("id", u).maybeSingle();
    const sid = prof?.school_id ?? null;
    setSchoolId(sid);
    if (!sid) return;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u).eq("school_id", sid);
    setIsTeacher(!!roles?.some(r => r.role === "teacher" || r.role === "admin"));
    const [ls, subs, sj] = await Promise.all([
      supabase.from("video_lessons").select("*").eq("school_id", sid).order("created_at", { ascending: false }),
      supabase.from("lesson_submissions").select("*").eq("student_id", u),
      supabase.from("subjects").select("id, name, color"),
    ]);
    if (ls.data) setLessons(ls.data as Lesson[]);
    if (subs.data) setMySubs(new Map(subs.data.map(s => [s.lesson_id, s as Submission])));
    if (sj.data) setSubjects(sj.data as Subject[]);
  };

  useEffect(() => { void load(); /* eslint-disable-next-line */ }, []);

  const openViewer = async (l: Lesson) => {
    setOpenLesson(l);
    setAnswers({});
    const { data: signed } = await supabase.storage.from("lesson-videos").createSignedUrl(l.video_path, 3600);
    setVideoUrl(signed?.signedUrl ?? null);
    const { data: qs } = await supabase.from("lesson_questions").select("*").eq("lesson_id", l.id).order("sort_order");
    setQuestions((qs ?? []).map(q => ({ ...q, options: q.options as string[] })) as Question[]);
  };

  const submitQuiz = async () => {
    if (!openLesson) return;
    if (questions.some(q => answers[q.id] === undefined)) return toast.error("Answer all questions");
    const { data, error } = await supabase.rpc("submit_lesson", { _lesson_id: openLesson.id, _answers: answers });
    if (error) return toast.error(error.message);
    const r = data as { score: number; total: number; xp_earned: number };
    toast.success(`Scored ${r.score}/${r.total} · +${r.xp_earned} XP`);
    setOpenLesson(null); setVideoUrl(null);
    await load();
  };

  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/" }); };

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
            <Link to="/dashboard" className="text-sm font-bold text-muted-foreground hover:text-foreground flex items-center gap-1.5"><Trophy className="w-4 h-4" />Quests</Link>
            <Link to="/lessons" className="text-sm font-bold text-foreground flex items-center gap-1.5"><Video className="w-4 h-4" />Lessons</Link>
            <button onClick={signOut} className="text-sm font-semibold text-muted-foreground hover:text-foreground flex items-center gap-2"><LogOut className="w-4 h-4" />Sign out</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        {!schoolId ? (
          <div className="rounded-3xl border border-border bg-card p-8 text-center">
            <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Join a school first</h2>
            <p className="text-muted-foreground text-sm mt-2">Go to your dashboard to join or create a school.</p>
            <Link to="/dashboard" className="inline-block mt-4 px-5 py-2 rounded-full font-bold text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>Go to Dashboard</Link>
          </div>
        ) : (
          <>
            <div className="flex items-end justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Video Lessons</h1>
                <p className="text-muted-foreground text-sm">Watch and answer quiz to earn XP</p>
              </div>
              {isTeacher && (
                <button onClick={() => setShowUpload(true)} className="px-5 py-3 rounded-2xl font-bold text-primary-foreground shadow-[var(--shadow-playful)] flex items-center gap-2" style={{ background: "var(--gradient-hero)" }}>
                  <Plus className="w-5 h-5" /> Upload lesson
                </button>
              )}
            </div>

            {lessons.length === 0 ? (
              <div className="text-muted-foreground text-sm">No lessons yet. {isTeacher && "Upload one to get started!"}</div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {lessons.map(l => {
                  const sub = mySubs.get(l.id);
                  const subj = subjects.find(s => s.id === l.subject_id);
                  return (
                    <div key={l.id} className="rounded-2xl bg-card border border-border p-5 shadow-[var(--shadow-soft)] flex flex-col">
                      <div className="aspect-video rounded-xl grid place-items-center text-primary-foreground mb-4" style={{ background: subj?.color ?? "var(--gradient-hero)" }}>
                        <Video className="w-12 h-12 opacity-90" />
                      </div>
                      <h3 className="font-bold text-lg" style={{ fontFamily: "var(--font-display)" }}>{l.title}</h3>
                      {l.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{l.description}</p>}
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-primary font-bold">+{l.xp_reward} XP</div>
                        {sub ? (
                          <div className="text-xs font-bold text-secondary flex items-center gap-1"><Check className="w-3 h-3" />{sub.score}/{sub.total}</div>
                        ) : (
                          <button onClick={() => openViewer(l)} className="px-4 py-2 rounded-full text-sm font-bold text-primary-foreground flex items-center gap-1.5" style={{ background: "var(--gradient-hero)" }}><Play className="w-3.5 h-3.5" />Watch</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {openLesson && (
        <div className="fixed inset-0 z-50 bg-foreground/70 backdrop-blur-sm grid place-items-center p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl bg-card p-6 shadow-[var(--shadow-playful)] my-8">
            <div className="flex items-start justify-between">
              <h3 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>{openLesson.title}</h3>
              <button onClick={() => { setOpenLesson(null); setVideoUrl(null); }} className="p-2 rounded-full hover:bg-muted"><X className="w-5 h-5" /></button>
            </div>
            {videoUrl && (
              <video src={videoUrl} controls className="w-full mt-4 rounded-xl bg-black aspect-video" />
            )}
            {questions.length > 0 && (
              <div className="mt-6 space-y-5">
                <h4 className="font-bold text-lg">Quiz</h4>
                {questions.map((q, qi) => (
                  <div key={q.id}>
                    <div className="font-semibold">{qi + 1}. {q.question}</div>
                    <div className="mt-2 grid gap-2">
                      {q.options.map((o, i) => (
                        <button key={i} onClick={() => setAnswers(a => ({ ...a, [q.id]: i }))} className={`text-left px-4 py-2 rounded-xl border-2 font-medium ${answers[q.id] === i ? "border-primary bg-accent/40" : "border-border hover:border-primary/50"}`}>
                          {String.fromCharCode(65 + i)}. {o}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <button onClick={submitQuiz} className="w-full py-3 rounded-xl font-bold text-primary-foreground shadow-[var(--shadow-soft)]" style={{ background: "var(--gradient-hero)" }}>Submit Quiz</button>
              </div>
            )}
          </div>
        </div>
      )}

      {showUpload && schoolId && uid && (
        <UploadModal schoolId={schoolId} teacherId={uid} subjects={subjects} onClose={() => setShowUpload(false)} onDone={() => { setShowUpload(false); void load(); }} />
      )}
    </div>
  );
}

function UploadModal({ schoolId, teacherId, subjects, onClose, onDone }: { schoolId: string; teacherId: string; subjects: Subject[]; onClose: () => void; onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [xp, setXp] = useState(30);
  const [subjectId, setSubjectId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [qs, setQs] = useState<{ question: string; options: string[]; correct_index: number }[]>([
    { question: "", options: ["", "", "", ""], correct_index: 0 },
  ]);
  const [busy, setBusy] = useState(false);

  const addQ = () => setQs(q => [...q, { question: "", options: ["", "", "", ""], correct_index: 0 }]);
  const rmQ = (i: number) => setQs(q => q.filter((_, idx) => idx !== i));

  const submit = async () => {
    if (!title.trim() || !file) return toast.error("Title and video are required");
    if (qs.some(q => !q.question.trim() || q.options.some(o => !o.trim()))) return toast.error("Fill all quiz fields");
    setBusy(true);
    try {
      const path = `${schoolId}/${crypto.randomUUID()}-${file.name}`;
      const up = await supabase.storage.from("lesson-videos").upload(path, file, { contentType: file.type });
      if (up.error) throw up.error;
      const { data: lesson, error: lErr } = await supabase.from("video_lessons").insert({
        school_id: schoolId, teacher_id: teacherId, title, description: desc || null,
        video_path: path, xp_reward: xp, subject_id: subjectId || null,
      }).select().single();
      if (lErr) throw lErr;
      const rows = qs.map((q, i) => ({ lesson_id: lesson.id, question: q.question, options: q.options, correct_index: q.correct_index, sort_order: i }));
      const { error: qErr } = await supabase.from("lesson_questions").insert(rows);
      if (qErr) throw qErr;
      toast.success("Lesson uploaded!");
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-foreground/70 backdrop-blur-sm grid place-items-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl bg-card p-6 shadow-[var(--shadow-playful)] my-8">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}><Upload className="w-5 h-5" />Upload lesson</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted"><X className="w-5 h-5" /></button>
        </div>
        <div className="mt-4 grid gap-3">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Lesson title" className="px-4 py-3 rounded-xl border border-border bg-background" />
          <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Short description (optional)" rows={2} className="px-4 py-3 rounded-xl border border-border bg-background" />
          <div className="grid grid-cols-2 gap-3">
            <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="px-4 py-3 rounded-xl border border-border bg-background">
              <option value="">— Subject (optional) —</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input type="number" min={5} max={200} value={xp} onChange={e => setXp(Number(e.target.value))} placeholder="XP reward" className="px-4 py-3 rounded-xl border border-border bg-background" />
          </div>
          <label className="px-4 py-3 rounded-xl border-2 border-dashed border-border bg-background cursor-pointer text-sm">
            <input type="file" accept="video/*" onChange={e => setFile(e.target.files?.[0] ?? null)} className="hidden" />
            {file ? <span className="font-semibold">🎥 {file.name}</span> : <span className="text-muted-foreground">Click to select video file…</span>}
          </label>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h4 className="font-bold">Quiz questions</h4>
            <button onClick={addQ} className="text-sm font-bold text-primary flex items-center gap-1"><Plus className="w-4 h-4" />Add question</button>
          </div>
          <div className="mt-3 space-y-4">
            {qs.map((q, i) => (
              <div key={i} className="rounded-xl border border-border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-muted-foreground">Q{i + 1}</span>
                  {qs.length > 1 && <button onClick={() => rmQ(i)} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>}
                </div>
                <input value={q.question} onChange={e => setQs(a => a.map((x, idx) => idx === i ? { ...x, question: e.target.value } : x))} placeholder="Question" className="w-full px-3 py-2 rounded-lg border border-border bg-background" />
                {q.options.map((o, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input type="radio" name={`correct-${i}`} checked={q.correct_index === oi} onChange={() => setQs(a => a.map((x, idx) => idx === i ? { ...x, correct_index: oi } : x))} />
                    <input value={o} onChange={e => setQs(a => a.map((x, idx) => idx === i ? { ...x, options: x.options.map((oo, ooi) => ooi === oi ? e.target.value : oo) } : x))} placeholder={`Option ${String.fromCharCode(65 + oi)}`} className="flex-1 px-3 py-2 rounded-lg border border-border bg-background" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <button disabled={busy} onClick={submit} className="mt-6 w-full py-3 rounded-xl font-bold text-primary-foreground shadow-[var(--shadow-soft)] disabled:opacity-50" style={{ background: "var(--gradient-hero)" }}>
          {busy ? "Uploading…" : "Upload lesson"}
        </button>
      </div>
    </div>
  );
}