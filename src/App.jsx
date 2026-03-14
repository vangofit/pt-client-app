import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "./supabase";

const SK = "pt-manager-data";
const gid = () => Math.random().toString(36).slice(2, 11);

const C = {
  bg: "#0C0D11",
  card: "#16181F",
  cardAlt: "#1C1E27",
  accent: "#D4A843",
  ag: "rgba(212,168,67,0.12)",
  text: "#EDEAE3",
  td: "#7A786F",
  tm: "#B5B2A8",
  border: "#26282F",
  danger: "#E85454",
  success: "#4ADE80",
  info: "#60A5FA",
  warn: "#FBBF24",
};

const bi = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: "10px",
  border: `1px solid ${C.border}`,
  background: C.bg,
  color: C.text,
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "'Noto Sans KR', sans-serif",
};

function Btn({ children, variant = "primary", style, ...p }) {
  const base = {
    padding: "11px 20px",
    borderRadius: "10px",
    border: "none",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'Noto Sans KR', sans-serif",
    transition: "all 0.15s",
    ...style,
  };
  const v = {
    primary: { background: C.accent, color: C.bg },
    secondary: { background: "transparent", border: `1px solid ${C.border}`, color: C.tm },
    danger: { background: "rgba(232,84,84,0.12)", color: C.danger },
    ghost: { background: "transparent", color: C.td },
  };
  return (
    <button style={{ ...base, ...v[variant] }} {...p}>
      {children}
    </button>
  );
}

function BG({ children, color = C.accent }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: "6px",
        fontSize: "11px",
        fontWeight: 600,
        background: `${color}20`,
        color,
      }}
    >
      {children}
    </span>
  );
}

function Fd({ label, children }) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <div style={{ fontSize: "11px", fontWeight: 600, color: C.td, marginBottom: "5px", letterSpacing: "1px" }}>
        {label}
      </div>
      {children}
    </div>
  );
}

const BADGES = [
  { days: 1, emoji: "👟", title: "첫 출석", msg: "좋은 변화는 첫 걸음에서 시작됩니다." },
  { days: 3, emoji: "🔥", title: "3일 점화", msg: "처음의 의지가 행동으로 바뀌고 있어요." },
  { days: 7, emoji: "🌱", title: "첫 주 완주", msg: "운동 습관의 씨앗이 심어졌어요." },
  { days: 14, emoji: "💪", title: "2주 달성", msg: "운동이 생활 속에 자리잡기 시작했어요." },
  { days: 21, emoji: "🔁", title: "습관 루프", msg: "반복이 정체성을 만듭니다." },
  { days: 30, emoji: "🏅", title: "한 달 완주", msg: "운동은 이벤트가 아니라 생활이 됩니다." },
  { days: 50, emoji: "❤️", title: "심장 수호자", msg: "꾸준한 운동은 심혈관 건강에도 좋아요." },
  { days: 75, emoji: "🧠", title: "뇌 건강 지킴이", msg: "운동은 집중력과 기분 조절에도 도움을 줍니다." },
  { days: 100, emoji: "⭐", title: "100일 전사", msg: "상위권 꾸준함입니다." },
  { days: 150, emoji: "🏆", title: "반년의 약속", msg: "운동이 삶의 일부가 되는 구간입니다." },
  { days: 200, emoji: "🔥", title: "200일 철인", msg: "운동이 몸을 끌고 가는 단계에 들어섰어요." },
  { days: 365, emoji: "🎖️", title: "1년 마스터", msg: "몸도 마음도 완전히 다른 레벨입니다." },
];

const DEFAULT_PRESETS = [
  ["하체", [
    "Sissy Hack Squat",
    "FITNESS - Prone Leg Curl",
    "FREE MOTION - Calf Raise",
    "ARSENAL - Reloaded Glute Bridge",
    "GYMLECO - Pit Shark",
    "CYBEX - Kneeling Leg Curl",
    "PRECOR - Hack Slide",
    "GYMLECO - Squat Press",
    "NAUTILUS - Adduction",
    "PRECOR - Prone Leg Curl",
    "Cybex - Hip Thrust",
    "Gym80 - Leg Press",
    "Universal - Leg Press",
    "GYMLECO - V Squat",
  ]],
  ["가슴", [
    "NAUTILUS LEVERAGE - Chest Press",
    "BODY MASTER - Bench Press",
    "LIFE FITNESS - Assisted Dip",
    "BODY MASTER - Incline Bench Press",
    "BODY MASTER - Pec Dec",
    "HAMMER STRENGTH - Iso-Lateral Bench Press",
    "Universal - Incline Chest Press",
    "CYBEX - Fly",
    "BODY MASTER - Chest Press",
    "LIFE FITNESS - Pectoral Fly",
    "ARSENAL STRENGTH - Incline Chest Press",
    "Technogym - WCP",
    "CNK - Incline Chest Press",
  ]],
  ["등", [
    "Hoist - Lat Pulldown",
    "Cybex - Low Row",
    "FITNESS - Pull Down Machine",
    "HAMMER STRENGTH - Iso-Lateral High Row",
    "HAMMER STRENGTH - Iso-Lateral D.Y. Row",
    "PRIME - Seated Row",
    "LIFE FITNESS - Pull Over",
    "TECHNOGYM - T-Bar Row",
    "HAMMER STRENGTH - Iso Pull Down",
    "UNIVERSAL - Lat Pull Down",
  ]],
  ["어깨", [
    "Cybex - Overhead Press",
    "Cybex - Lateral Raise",
    "Dynamic - Shoulder Press",
    "CYBEX - Smith Machine Shoulder Press",
    "BODY MASTER - Shoulder Press",
    "ADVANCE - Bentover Lateral Raise",
    "원암 사이드 레터럴 레이즈",
  ]],
  ["팔", [
    "MAXPUMP - Standing Arms Curl",
    "원암 덤벨 오버헤드 익스텐션",
    "원암 덤벨 컬",
    "HAMMER STRENGTH - Seated Dip",
    "케이블 푸시다운 - 로프",
    "Nautilus - Multi Biceps",
    "BodyMaster - Overhead Tricep Extension",
  ]],
  ["복근", [
    "레그 레이즈",
    "러시안 트위스트",
    "플랭크",
    "복근 에어 바이크",
    "크런치",
    "행잉 레그 레이즈",
    "힐 터치",
  ]],
  ["기타", [
    "원암 케이블 푸시 다운",
    "케이블 해머 컬",
    "케이블 오버헤드 익스텐션",
    "리버스 케이블 컬",
    "리버스 덤벨 컬",
    "인클라인 덤벨 컬",
    "벤치 딥스",
  ]],
].flatMap(([category, list]) =>
  list.map((name) => ({
    id: gid(),
    name,
    category,
    photo: "",
    youtube: "",
  }))
);

const EMPTY_DATA = {
  trainer: {
    username: "hyungmin",
    password: "VangoFit!2026#",
    failedAttempts: 0,
    lockUntil: 0,
  },
  presets: DEFAULT_PRESETS,
  customRoutines: [],
  clients: [],
};

function migrateData(raw) {
  const d = raw || {};
  return {
    trainer: {
      username: d?.trainer?.username || "hyungmin",
      password: d?.trainer?.password || "VangoFit!2026#",
      failedAttempts: Number(d?.trainer?.failedAttempts || 0),
      lockUntil: Number(d?.trainer?.lockUntil || 0),
    },
    presets: Array.isArray(d?.presets) && d.presets.length ? d.presets : DEFAULT_PRESETS,
    customRoutines: Array.isArray(d?.customRoutines) ? d.customRoutines : [],
    clients: Array.isArray(d?.clients)
      ? d.clients.map((c) => ({
          id: c.id || gid(),
          name: c.name || "",
          pin: c.pin || "",
          phone: c.phone || "",
          gender: c.gender || "",
          age: c.age || "",
          goals: {
            targetWeight: c?.goals?.targetWeight || "",
            targetFatPct: c?.goals?.targetFatPct || "",
            targetMuscle: c?.goals?.targetMuscle || "",
          },
          notes: {
            injuries: c?.notes?.injuries || "",
            surgery: c?.notes?.surgery || "",
            conditions: c?.notes?.conditions || "",
            experience: c?.notes?.experience || "",
          },
          pt: {
            startDate: c?.pt?.startDate || "",
            endDate: c?.pt?.endDate || "",
            totalSessions: Number(c?.pt?.totalSessions || 0),
            baseCompletedSessions: Number(
              c?.pt?.baseCompletedSessions ?? c?.pt?.completedSessions ?? 0
            ),
          },
          attendance: Array.isArray(c?.attendance) ? c.attendance : [],
          inbodyHistory: Array.isArray(c?.inbodyHistory) ? c.inbodyHistory : [],
          sessions: Array.isArray(c?.sessions) ? c.sessions : [],
        }))
      : [],
  };
}

async function loadAppDataFromSupabase() {
  const [
    clientsRes,
    presetsRes,
    sessionsRes,
    attendanceRes,
    inbodyRes,
    routinesRes,
    trainerRes,
  ] = await Promise.all([
    supabase.from("clients").select("*").order("created_at", { ascending: true }),
    supabase.from("presets").select("*").order("category", { ascending: true }),
    supabase.from("sessions").select("*").order("session_date", { ascending: false }),
    supabase.from("attendance").select("*").order("attendance_date", { ascending: false }),
    supabase.from("inbody_records").select("*").order("record_date", { ascending: false }),
    supabase.from("custom_routines").select("*").order("created_at", { ascending: false }),
    supabase.from("trainer_settings").select("*").eq("id", 1).maybeSingle(),
  ]);

  if (clientsRes.error) throw clientsRes.error;
  if (presetsRes.error) throw presetsRes.error;
  if (sessionsRes.error) throw sessionsRes.error;
  if (attendanceRes.error) throw attendanceRes.error;
  if (inbodyRes.error) throw inbodyRes.error;
  if (routinesRes.error) throw routinesRes.error;
  if (trainerRes.error) throw trainerRes.error;

  const sessionsByClient = {};
  for (const s of sessionsRes.data || []) {
    if (!sessionsByClient[s.client_id]) sessionsByClient[s.client_id] = [];
    sessionsByClient[s.client_id].push({
      id: s.id,
      date: s.session_date,
      trainerMemo: s.trainer_memo || "",
      clientMemo: s.client_memo || "",
      quickCheck: !!s.quick_check,
      exercises: Array.isArray(s.exercises) ? s.exercises : [],
    });
  }

  const attendanceByClient = {};
  for (const a of attendanceRes.data || []) {
    if (!attendanceByClient[a.client_id]) attendanceByClient[a.client_id] = [];
    attendanceByClient[a.client_id].push({
      date: a.attendance_date,
      strength: a.strength || 0,
      cardio: a.cardio || 0,
    });
  }

  const inbodyByClient = {};
  for (const r of inbodyRes.data || []) {
    if (!inbodyByClient[r.client_id]) inbodyByClient[r.client_id] = [];
    inbodyByClient[r.client_id].push({
      id: r.id,
      date: r.record_date,
      height: r.height,
      weight: r.weight,
      muscle: r.muscle,
      fatPct: r.fat_pct,
      fatMass: r.fat_mass,
      bodyWater: r.body_water,
      protein: r.protein,
      bmr: r.bmr,
      visceralFat: r.visceral_fat,
      waist: r.waist,
      score: r.score,
    });
  }

  const clients = (clientsRes.data || []).map((c) => ({
    id: c.id,
    name: c.name || "",
    pin: c.pin || "",
    phone: c.phone || "",
    gender: c.gender || "",
    age: c.age || "",
    goals: {
      targetWeight: c.goal_target_weight || "",
      targetFatPct: c.goal_target_fat_pct || "",
      targetMuscle: c.goal_target_muscle || "",
    },
    notes: {
      injuries: c.injuries || "",
      surgery: c.surgery || "",
      conditions: c.conditions || "",
      experience: c.experience || "",
    },
    pt: {
      startDate: c.pt_start_date || "",
      endDate: c.pt_end_date || "",
      totalSessions: c.pt_total_sessions || 0,
      baseCompletedSessions: c.pt_base_completed_sessions || 0,
    },
    attendance: attendanceByClient[c.id] || [],
    inbodyHistory: inbodyByClient[c.id] || [],
    sessions: sessionsByClient[c.id] || [],
  }));

  return migrateData({
    trainer: trainerRes.data
      ? {
          username: trainerRes.data.username,
          password: trainerRes.data.password,
        }
      : EMPTY_DATA.trainer,
    presets: (presetsRes.data || []).map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      photo: p.photo || "",
      youtube: p.youtube || "",
    })),
    customRoutines: (routinesRes.data || []).map((r) => ({
      id: r.id,
      title: r.title,
      desc: r.description || "",
      days: r.days || [],
    })),
    clients,
  });
}

async function uploadLocalDataToSupabase(appData) {
  const safe = migrateData(appData);

  const clientRows = safe.clients.map((c) => ({
    id: c.id,
    name: c.name,
    pin: c.pin,
    phone: c.phone || "",
    gender: c.gender || "",
    age: c.age || null,
    goal_target_weight: c.goals?.targetWeight || null,
    goal_target_fat_pct: c.goals?.targetFatPct || null,
    goal_target_muscle: c.goals?.targetMuscle || null,
    injuries: c.notes?.injuries || "",
    surgery: c.notes?.surgery || "",
    conditions: c.notes?.conditions || "",
    experience: c.notes?.experience || "",
    pt_start_date: c.pt?.startDate || null,
    pt_end_date: c.pt?.endDate || null,
    pt_total_sessions: Number(c.pt?.totalSessions || 0),
    pt_base_completed_sessions: Number(c.pt?.baseCompletedSessions || 0),
  }));
  if (clientRows.length) {
    const { error } = await supabase.from("clients").upsert(clientRows, { onConflict: "id" });
    if (error) throw error;
  }

  const presetRows = safe.presets.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category || "기타",
    photo: p.photo || "",
    youtube: p.youtube || "",
  }));
  if (presetRows.length) {
    const { error } = await supabase.from("presets").upsert(presetRows, { onConflict: "id" });
    if (error) throw error;
  }

  const routineRows = safe.customRoutines.map((r) => ({
    id: r.id,
    title: r.title || "",
    description: r.desc || "",
    days: r.days || [],
  }));
  if (routineRows.length) {
    const { error } = await supabase.from("custom_routines").upsert(routineRows, { onConflict: "id" });
    if (error) throw error;
  }

  const { error: trainerError } = await supabase.from("trainer_settings").upsert(
    { id: 1, username: safe.trainer.username, password: safe.trainer.password },
    { onConflict: "id" }
  );
  if (trainerError) throw trainerError;

  const sessionRows = [];
  const attendanceRows = [];
  const inbodyRows = [];

  safe.clients.forEach((c) => {
    (c.sessions || []).forEach((s) => {
      sessionRows.push({
        id: s.id,
        client_id: c.id,
        session_date: s.date,
        trainer_memo: s.trainerMemo || "",
        client_memo: s.clientMemo || "",
        quick_check: !!s.quickCheck,
        exercises: s.exercises || [],
      });
    });
    (c.attendance || []).forEach((a) => {
      attendanceRows.push({
        client_id: c.id,
        attendance_date: a.date,
        strength: a.strength || 0,
        cardio: a.cardio || 0,
      });
    });
    (c.inbodyHistory || []).forEach((r) => {
      inbodyRows.push({
        id: r.id,
        client_id: c.id,
        record_date: r.date,
        height: r.height || null,
        weight: r.weight || null,
        muscle: r.muscle || null,
        fat_pct: r.fatPct || null,
        fat_mass: r.fatMass || null,
        body_water: r.bodyWater || null,
        protein: r.protein || null,
        bmr: r.bmr || null,
        visceral_fat: r.visceralFat || null,
        waist: r.waist || null,
        score: r.score || null,
      });
    });
  });

  if (sessionRows.length) {
    const { error } = await supabase.from("sessions").upsert(sessionRows, { onConflict: "id" });
    if (error) throw error;
  }
  if (attendanceRows.length) {
    const { error } = await supabase.from("attendance").upsert(attendanceRows, {
      onConflict: "client_id,attendance_date",
    });
    if (error) throw error;
  }
  if (inbodyRows.length) {
    const { error } = await supabase.from("inbody_records").upsert(inbodyRows, { onConflict: "id" });
    if (error) throw error;
  }
}

function getCompletedSessions(client) {
  const base = Number(client?.pt?.baseCompletedSessions || 0);
  const sessionCount = Array.isArray(client?.sessions) ? client.sessions.length : 0;
  return base + sessionCount;
}

function getRemainingSessions(client) {
  const total = Number(client?.pt?.totalSessions || 0);
  const completed = getCompletedSessions(client);
  return Math.max(0, total - completed);
}

function mergeClient(clients, clientId, patcher) {
  return clients.map((c) => (c.id === clientId ? patcher(c) : c));
}

function Login({ data, setData, onLogin }) {
  const [mode, setMode] = useState("select");
  const [pin, setPin] = useState("");
  const [trainerId, setTrainerId] = useState("");
  const [trainerPassword, setTrainerPassword] = useState("");
  const [err, setErr] = useState("");

  const trainer = data?.trainer || {};
  const now = Date.now();
  const locked = !!trainer.lockUntil && now < trainer.lockUntil;
  const remainMin = locked ? Math.ceil((trainer.lockUntil - now) / 60000) : 0;

  const failTrainerLogin = () => {
    const attempts = (trainer.failedAttempts || 0) + 1;
    const shouldLock = attempts >= 5;
    setData((prev) =>
      migrateData({
        ...prev,
        trainer: {
          ...prev.trainer,
          failedAttempts: shouldLock ? 0 : attempts,
          lockUntil: shouldLock ? Date.now() + 10 * 60 * 1000 : 0,
        },
      })
    );
    setErr(
      shouldLock
        ? "로그인 5회 실패로 10분간 잠겼습니다."
        : `아이디 또는 비밀번호가 올바르지 않습니다. (${attempts}/5)`
    );
  };

  const go = (type) => {
    if (type === "trainer") {
      if (locked) {
        setErr(`보안을 위해 ${remainMin}분 뒤 다시 시도해주세요.`);
        return;
      }
      if (
        trainerId.trim() === String(trainer.username || "") &&
        trainerPassword === String(trainer.password || "")
      ) {
        setData((prev) =>
          migrateData({
            ...prev,
            trainer: { ...prev.trainer, failedAttempts: 0, lockUntil: 0 },
          })
        );
        setErr("");
        onLogin({ type: "trainer" });
        return;
      }
      failTrainerLogin();
      return;
    }

    const clients = Array.isArray(data?.clients) ? data.clients : [];
    const c = clients.find((client) => String(client.pin) === String(pin));
    if (c) {
      setErr("");
      onLogin({ type: "client", clientId: c.id });
    } else {
      setErr("회원 PIN을 확인해주세요.");
    }
  };

  return (
    <div
      style={{
        fontFamily: "'Noto Sans KR',sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "20px",
        background: `linear-gradient(160deg,${C.bg},#12131A,${C.bg})`,
        color: C.text,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "radial-gradient(ellipse at 25% 15%,rgba(212,168,67,0.05) 0%,transparent 55%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          background: C.card,
          borderRadius: "20px",
          padding: "40px 32px",
          width: "100%",
          maxWidth: "350px",
          border: `1px solid ${C.border}`,
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "28px", fontWeight: 900, color: C.accent, letterSpacing: "-1px" }}>VangoFit</div>
          <div style={{ fontSize: "11px", color: C.td, marginTop: "4px", letterSpacing: "2px" }}>
            YOUR BODY, YOUR JOURNEY
          </div>
        </div>

        <div style={{ fontSize: "20px", fontWeight: 800, textAlign: "center", marginBottom: "24px" }}>
          {mode === "select" ? "로그인" : mode === "trainer" ? "트레이너" : "회원"}
        </div>

        {mode === "select" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <Btn onClick={() => { setMode("trainer"); setErr(""); }}>트레이너</Btn>
            <Btn variant="secondary" onClick={() => { setMode("client"); setErr(""); }}>회원</Btn>
          </div>
        ) : mode === "trainer" ? (
          <>
            <input
              style={{ ...bi, padding: "13px 16px", marginBottom: "10px" }}
              type="text"
              placeholder="트레이너 아이디"
              value={trainerId}
              onChange={(e) => { setTrainerId(e.target.value); setErr(""); }}
              onKeyDown={(e) => e.key === "Enter" && go("trainer")}
            />
            <input
              style={{ ...bi, padding: "13px 16px", marginBottom: "10px" }}
              type="password"
              placeholder="트레이너 비밀번호"
              value={trainerPassword}
              onChange={(e) => { setTrainerPassword(e.target.value); setErr(""); }}
              onKeyDown={(e) => e.key === "Enter" && go("trainer")}
            />
            {locked ? (
              <div style={{ color: C.warn, fontSize: "11px", marginBottom: "6px" }}>
                보안 잠금 상태입니다. {remainMin}분 뒤 다시 시도해주세요.
              </div>
            ) : null}
            {err ? <div style={{ color: C.danger, fontSize: "11px", marginBottom: "6px" }}>{err}</div> : null}
            <Btn onClick={() => go("trainer")} style={{ width: "100%", marginBottom: "8px" }}>로그인</Btn>
            <Btn
              variant="ghost"
              onClick={() => {
                setMode("select");
                setErr("");
                setTrainerId("");
                setTrainerPassword("");
              }}
              style={{ width: "100%" }}
            >
              ← 돌아가기
            </Btn>
          </>
        ) : (
          <>
            <input
              style={{ ...bi, padding: "13px 16px", marginBottom: "10px" }}
              type="password"
              placeholder="회원 PIN"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setErr(""); }}
              onKeyDown={(e) => e.key === "Enter" && go("client")}
            />
            {err ? <div style={{ color: C.danger, fontSize: "11px", marginBottom: "6px" }}>{err}</div> : null}
            <Btn onClick={() => go("client")} style={{ width: "100%", marginBottom: "8px" }}>로그인</Btn>
            <Btn
              variant="ghost"
              onClick={() => {
                setMode("select");
                setErr("");
                setPin("");
              }}
              style={{ width: "100%" }}
            >
              ← 돌아가기
            </Btn>
          </>
        )}
      </div>
      <div style={{ marginTop: "16px", fontSize: "10px", color: C.td }}>안동 · 형민 트레이너</div>
    </div>
  );
}

function AddCl({ onSave, onClose, pins }) {
  const [n, setN] = useState("");
  const [ph, setPh] = useState("");
  const [pin, setPin] = useState("");
  const dup = pin && pins.includes(pin);
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex",
        alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{ background: C.card, borderRadius: "20px", padding: "22px", width: "100%", maxWidth: "380px", border: `1px solid ${C.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: "16px", fontWeight: 800, marginBottom: "12px" }}>새 회원</div>
        <Fd label="이름"><input value={n} onChange={(e) => setN(e.target.value)} style={bi} /></Fd>
        <Fd label="연락처"><input value={ph} onChange={(e) => setPh(e.target.value)} style={bi} /></Fd>
        <Fd label="PIN(4자리)"><input value={pin} onChange={(e) => setPin(e.target.value)} style={bi} maxLength={4} /></Fd>
        {dup ? <div style={{ color: C.danger, fontSize: "10px", marginBottom: "4px" }}>이미 사용 중인 PIN</div> : null}
        <Btn
          onClick={() => {
            if (!n.trim() || !pin.trim() || dup) return;
            onSave({
              id: gid(),
              name: n.trim(),
              pin: pin.trim(),
              phone: ph.trim(),
              gender: "",
              age: "",
              goals: { targetWeight: "", targetFatPct: "", targetMuscle: "" },
              notes: { injuries: "", surgery: "", conditions: "", experience: "" },
              pt: { startDate: "", endDate: "", totalSessions: 0, baseCompletedSessions: 0 },
              attendance: [],
              inbodyHistory: [],
              sessions: [],
            });
          }}
          style={{ width: "100%" }}
        >
          등록
        </Btn>
      </div>
    </div>
  );
}

function TrainerSecurityModal({ trainer, onClose, onSave }) {
  const [username, setUsername] = useState(trainer?.username || "");
  const [password, setPassword] = useState(trainer?.password || "");
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex",
        alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{ background: C.card, borderRadius: "20px", padding: "24px", width: "100%", maxWidth: "400px", border: `1px solid ${C.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: "16px", fontWeight: 800, marginBottom: "14px" }}>보안 설정</div>
        <Fd label="트레이너 아이디"><input value={username} onChange={(e) => setUsername(e.target.value)} style={bi} /></Fd>
        <Fd label="트레이너 비밀번호"><input value={password} onChange={(e) => setPassword(e.target.value)} style={bi} /></Fd>
        <div style={{ display: "flex", gap: "8px" }}>
          <Btn onClick={() => onSave({ username, password })} style={{ flex: 1 }}>저장</Btn>
          <Btn variant="secondary" onClick={onClose}>취소</Btn>
        </div>
      </div>
    </div>
  );
}

function PresetMgr({ presets, onSave, onClose }) {
  const [list, setList] = useState([...(presets || [])]);
  const [draft, setDraft] = useState({ name: "", category: "하체", photo: "", youtube: "" });
  const [editId, setEditId] = useState(null);

  const submitDraft = () => {
    if (!draft.name.trim()) return;
    if (editId) {
      setList((prev) => prev.map((p) => (p.id === editId ? { ...p, ...draft, name: draft.name.trim() } : p)));
      setEditId(null);
    } else {
      setList((prev) => [...prev, { id: gid(), ...draft, name: draft.name.trim() }]);
    }
    setDraft({ name: "", category: "하체", photo: "", youtube: "" });
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex",
        alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: C.card, borderRadius: "20px", padding: "22px",
          width: "100%", maxWidth: "560px", maxHeight: "85vh", overflowY: "auto",
          border: `1px solid ${C.border}`
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
          <span style={{ fontSize: "16px", fontWeight: 800 }}>종목관리</span>
          <Btn variant="ghost" onClick={onClose}>✕</Btn>
        </div>

        <div style={{ background: C.bg, borderRadius: "10px", padding: "12px", marginBottom: "12px" }}>
          <Fd label="운동 이름"><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} style={bi} /></Fd>
          <Fd label="카테고리">
            <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} style={bi}>
              {["하체", "가슴", "등", "어깨", "팔", "복근", "기타"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </Fd>
          <Fd label="사진 링크"><input value={draft.photo} onChange={(e) => setDraft({ ...draft, photo: e.target.value })} style={bi} /></Fd>
          <Fd label="유튜브 링크"><input value={draft.youtube} onChange={(e) => setDraft({ ...draft, youtube: e.target.value })} style={bi} /></Fd>
          <div style={{ display: "flex", gap: "8px" }}>
            <Btn onClick={submitDraft} style={{ flex: 1 }}>{editId ? "수정 저장" : "새 종목 추가"}</Btn>
            {editId ? (
              <Btn
                variant="secondary"
                onClick={() => {
                  setEditId(null);
                  setDraft({ name: "", category: "하체", photo: "", youtube: "" });
                }}
              >
                취소
              </Btn>
            ) : null}
          </div>
        </div>

        {(list || []).map((p) => (
          <div
            key={p.id}
            style={{
              background: C.bg, borderRadius: "10px", padding: "10px 12px", marginBottom: "6px",
              display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px"
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "12px", fontWeight: 700 }}>{p.name}</div>
              <div style={{ fontSize: "10px", color: C.td }}>{p.category}</div>
            </div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <Btn
                variant="ghost"
                onClick={() => {
                  setEditId(p.id);
                  setDraft({
                    name: p.name || "",
                    category: p.category || "하체",
                    photo: p.photo || "",
                    youtube: p.youtube || "",
                  });
                }}
                style={{ padding: "6px 10px", fontSize: "11px" }}
              >
                수정
              </Btn>
              <Btn
                variant="danger"
                onClick={() => setList((prev) => prev.filter((x) => x.id !== p.id))}
                style={{ padding: "6px 10px", fontSize: "11px" }}
              >
                삭제
              </Btn>
            </div>
          </div>
        ))}

        <Btn onClick={() => onSave(list)} style={{ width: "100%", marginTop: "8px" }}>저장</Btn>
      </div>
    </div>
  );
}

function SesForm({ presets, session, onSave, onClose }) {
  const [date, setDate] = useState(session?.date || new Date().toISOString().split("T")[0]);
  const [trainerMemo, setTrainerMemo] = useState(session?.trainerMemo || "");
  const [clientMemo, setClientMemo] = useState(session?.clientMemo || "");
  const [exercises, setExercises] = useState(session?.exercises?.length ? session.exercises : [
    { name: "", sets: [{ weight: "", reps: "" }], equipNote: "" }
  ]);
  const [category, setCategory] = useState("하체");
  const candidates = presets.filter((p) => p.category === category);

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex",
        alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: C.card, borderRadius: "20px", padding: "22px",
          width: "100%", maxWidth: "620px", maxHeight: "85vh", overflowY: "auto",
          border: `1px solid ${C.border}`
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
          <span style={{ fontSize: "16px", fontWeight: 800 }}>{session ? "수업 기록 수정" : "새 수업 기록"}</span>
          <Btn variant="ghost" onClick={onClose}>✕</Btn>
        </div>
        <Fd label="날짜"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={bi} /></Fd>

        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
          {["하체", "가슴", "등", "어깨", "팔", "복근", "기타"].map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              style={{
                padding: "6px 12px",
                borderRadius: "16px",
                border: "none",
                cursor: "pointer",
                background: category === c ? C.ag : C.bg,
                color: category === c ? C.accent : C.td,
                fontFamily: "'Noto Sans KR', sans-serif",
                fontWeight: 600,
                fontSize: "11px",
              }}
            >
              {c}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
          {candidates.slice(0, 30).map((p) => (
            <button
              key={p.id}
              onClick={() =>
                setExercises((prev) => [...prev, { name: p.name, sets: [{ weight: "", reps: "" }], equipNote: "" }])
              }
              style={{
                padding: "6px 10px",
                borderRadius: "16px",
                border: `1px solid ${C.border}`,
                cursor: "pointer",
                background: C.bg,
                color: C.text,
                fontFamily: "'Noto Sans KR', sans-serif",
                fontSize: "11px",
              }}
            >
              {p.name}
            </button>
          ))}
        </div>

        {exercises.map((ex, i) => (
          <div key={i} style={{ background: C.bg, borderRadius: "10px", padding: "12px", marginBottom: "10px" }}>
            <div style={{ display: "flex", gap: "6px", marginBottom: "8px", alignItems: "center" }}>
              <input
                value={ex.name}
                onChange={(e) => {
                  const copy = [...exercises];
                  copy[i] = { ...copy[i], name: e.target.value };
                  setExercises(copy);
                }}
                placeholder="운동 이름"
                style={{ ...bi, flex: 1 }}
              />
              <Btn
                variant="danger"
                onClick={() => setExercises((prev) => prev.filter((_, idx) => idx !== i))}
                style={{ padding: "8px 10px", fontSize: "12px" }}
              >
                삭제
              </Btn>
            </div>

            <Fd label="장비 세팅">
              <input
                value={ex.equipNote || ""}
                onChange={(e) => {
                  const copy = [...exercises];
                  copy[i] = { ...copy[i], equipNote: e.target.value };
                  setExercises(copy);
                }}
                style={bi}
              />
            </Fd>

            {(ex.sets || []).map((s, j) => (
              <div key={j} style={{ display: "flex", gap: "6px", marginBottom: "6px", alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: C.td, width: "34px" }}>{j + 1}세트</span>
                <input
                  value={s.weight}
                  onChange={(e) => {
                    const copy = [...exercises];
                    copy[i].sets[j] = { ...copy[i].sets[j], weight: e.target.value };
                    setExercises(copy);
                  }}
                  placeholder="kg"
                  style={{ ...bi, flex: 1 }}
                />
                <input
                  value={s.reps}
                  onChange={(e) => {
                    const copy = [...exercises];
                    copy[i].sets[j] = { ...copy[i].sets[j], reps: e.target.value };
                    setExercises(copy);
                  }}
                  placeholder="회"
                  style={{ ...bi, flex: 1 }}
                />
                {(ex.sets || []).length > 1 ? (
                  <Btn
                    variant="danger"
                    onClick={() => {
                      const copy = [...exercises];
                      copy[i].sets = copy[i].sets.filter((_, idx) => idx !== j);
                      setExercises(copy);
                    }}
                    style={{ padding: "8px 10px", fontSize: "12px" }}
                  >
                    −
                  </Btn>
                ) : null}
              </div>
            ))}

            <Btn
              variant="ghost"
              onClick={() => {
                const copy = [...exercises];
                copy[i].sets = [...copy[i].sets, { weight: "", reps: "" }];
                setExercises(copy);
              }}
              style={{ padding: "6px 8px", fontSize: "11px" }}
            >
              + 세트 추가
            </Btn>
          </div>
        ))}

        <Btn
          variant="secondary"
          onClick={() => setExercises((prev) => [...prev, { name: "", sets: [{ weight: "", reps: "" }], equipNote: "" }])}
          style={{ width: "100%", borderStyle: "dashed", marginBottom: "12px" }}
        >
          + 운동 추가
        </Btn>

        <Fd label="트레이너 메모">
          <textarea value={trainerMemo} onChange={(e) => setTrainerMemo(e.target.value)} style={{ ...bi, minHeight: "60px", resize: "vertical" }} />
        </Fd>
        <Fd label="회원 메모">
          <textarea value={clientMemo} onChange={(e) => setClientMemo(e.target.value)} style={{ ...bi, minHeight: "60px", resize: "vertical" }} />
        </Fd>

        <Btn
          onClick={() =>
            onSave({
              id: session?.id || gid(),
              date,
              trainerMemo,
              clientMemo,
              quickCheck: !!session?.quickCheck,
              exercises: exercises
                .filter((ex) => ex.name.trim())
                .map((ex) => ({
                  ...ex,
                  sets: (ex.sets || []).map((s) => ({
                    weight: Number(s.weight || 0),
                    reps: Number(s.reps || 0),
                  })),
                })),
            })
          }
          style={{ width: "100%" }}
        >
          저장
        </Btn>
      </div>
    </div>
  );
}

function SesDet({ session, isClient, onSaveClientMemo }) {
  const [editing, setEditing] = useState(false);
  const [memo, setMemo] = useState(session.clientMemo || "");

  return (
    <div style={{ background: C.card, borderRadius: "12px", padding: "14px", marginBottom: "8px", border: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", alignItems: "center" }}>
        <span style={{ fontSize: "13px", fontWeight: 700 }}>{session.date}</span>
        {session.quickCheck ? <BG color={C.warn}>빠른 체크</BG> : <BG color={C.info}>{(session.exercises || []).length}종목</BG>}
      </div>

      {(session.exercises || []).length === 0 ? (
        <div style={{ fontSize: "11px", color: C.td, marginBottom: "6px" }}>운동 종목 없음</div>
      ) : (
        (session.exercises || []).map((ex, i) => (
          <div key={i} style={{ background: C.bg, borderRadius: "8px", padding: "8px", marginBottom: "4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", gap: "6px" }}>
              <span style={{ fontWeight: 700, fontSize: "12px" }}>{ex.name}</span>
              {ex.equipNote ? <span style={{ fontSize: "9px", color: C.accent }}>⚙ {ex.equipNote}</span> : null}
            </div>
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
              {(ex.sets || []).map((s, j) => (
                <span key={j} style={{ padding: "2px 7px", background: C.cardAlt, borderRadius: "4px", fontSize: "10px", color: C.tm }}>
                  {j + 1}세트 {s.weight}kg × {s.reps}회
                </span>
              ))}
            </div>
          </div>
        ))
      )}

      {session.trainerMemo ? (
        <div style={{ marginTop: "6px", padding: "6px 10px", background: C.ag, borderRadius: "6px", fontSize: "11px", color: C.tm }}>
          <div style={{ fontWeight: 700, color: C.accent, marginBottom: "2px" }}>트레이너 메모</div>
          <div>{session.trainerMemo}</div>
        </div>
      ) : null}

      <div style={{ marginTop: "8px" }}>
        {editing ? (
          <div style={{ background: C.bg, borderRadius: "8px", padding: "8px" }}>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              style={{ ...bi, minHeight: "50px", resize: "vertical", marginBottom: "8px" }}
            />
            <div style={{ display: "flex", gap: "6px" }}>
              <Btn
                onClick={() => {
                  onSaveClientMemo?.(session.id, memo);
                  setEditing(false);
                }}
                style={{ flex: 1, padding: "8px 10px", fontSize: "12px" }}
              >
                저장
              </Btn>
              <Btn variant="secondary" onClick={() => setEditing(false)} style={{ padding: "8px 10px", fontSize: "12px" }}>
                취소
              </Btn>
            </div>
          </div>
        ) : session.clientMemo ? (
          <div style={{ padding: "6px 10px", background: C.bg, borderRadius: "6px", fontSize: "11px", color: C.tm }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
              <span style={{ fontWeight: 700, color: C.info }}>회원 메모</span>
              {isClient ? (
                <button
                  onClick={() => setEditing(true)}
                  style={{ background: "none", border: "none", color: C.info, cursor: "pointer", fontSize: "10px", fontFamily: "'Noto Sans KR', sans-serif" }}
                >
                  수정
                </button>
              ) : null}
            </div>
            <div>{session.clientMemo}</div>
          </div>
        ) : isClient ? (
          <button
            onClick={() => setEditing(true)}
            style={{
              width: "100%", padding: "6px", background: C.bg, borderRadius: "6px",
              border: `1px dashed ${C.border}`, color: C.td, fontSize: "10px", cursor: "pointer",
              fontFamily: "'Noto Sans KR', sans-serif"
            }}
          >
            ✏️ 수업 후기 작성하기
          </button>
        ) : null}
      </div>
    </div>
  );
}

function AttendanceView({ client, isTrainer, onSave, onSavePT, lessonDates = [] }) {
  const att = client.attendance || [];
  const pt = client.pt || {};
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [showLog, setShowLog] = useState(false);
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [logStr, setLogStr] = useState("");
  const [logCard, setLogCard] = useState("");
  const [showPTEdit, setShowPTEdit] = useState(false);
  const [ptForm, setPtForm] = useState({
    startDate: pt.startDate || "",
    endDate: pt.endDate || "",
    totalSessions: pt.totalSessions || 0,
    baseCompletedSessions: pt.baseCompletedSessions || 0,
  });

  const totalDays = att.length;
  const earnedBadges = BADGES.filter((b) => totalDays >= b.days);
  const nextBadge = BADGES.find((b) => totalDays < b.days);

  const yr = Number(month.split("-")[0]);
  const mo = Number(month.split("-")[1]);
  const daysInMonth = new Date(yr, mo, 0).getDate();
  const firstDay = new Date(yr, mo - 1, 1).getDay();
  const calDays = [];
  for (let i = 0; i < firstDay; i++) calDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calDays.push(d);

  const monthDays = att.filter((a) => a.date.startsWith(month)).length;
  const monthRate = daysInMonth ? Math.round((monthDays / daysInMonth) * 100) : 0;
  const today = new Date().toISOString().split("T")[0];

  const attendanceSet = new Set(att.map((a) => a.date));
  const lessonSet = new Set(lessonDates || []);

  const getPointColor = (dateStr) => {
    const hasLesson = lessonSet.has(dateStr);
    const hasPersonal = attendanceSet.has(dateStr);
    if (hasLesson) return C.danger;
    if (hasPersonal) return C.success;
    return null;
  };

  return (
    <>
      <span style={{ fontSize: "18px", fontWeight: 800, display: "block", marginBottom: "14px" }}>출석 & 동기부여</span>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "6px", marginBottom: "12px" }}>
        {[
          [totalDays, "누적 운동일", C.accent],
          [monthDays, `${mo}월 운동일`, C.success],
          [`${monthRate}%`, `${mo}월 출석률`, C.info],
          [`${lessonDates.length}`, "수업기록", C.warn],
        ].map(([v, l, c], i) => (
          <div key={i} style={{ background: C.card, borderRadius: "10px", padding: "12px 8px", textAlign: "center", border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: "18px", fontWeight: 800, color: c }}>{v}</div>
            <div style={{ fontSize: "9px", color: C.td }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.card, borderRadius: "14px", padding: "16px", marginBottom: "12px", border: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <Btn variant="ghost" onClick={() => {
            const d = new Date(yr, mo - 2, 1);
            setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
          }}>◀</Btn>
          <span style={{ fontSize: "15px", fontWeight: 700 }}>{yr}년 {mo}월</span>
          <Btn variant="ghost" onClick={() => {
            const d = new Date(yr, mo, 1);
            setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
          }}>▶</Btn>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "2px", textAlign: "center", marginBottom: "4px" }}>
          {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
            <div key={d} style={{ fontSize: "10px", color: C.td, padding: "4px" }}>{d}</div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "2px" }}>
          {calDays.map((day, i) => {
            if (!day) return <div key={i} />;
            const ds = `${month}-${String(day).padStart(2, "0")}`;
            const point = getPointColor(ds);
            const isToday = ds === today;
            return (
              <div
                key={i}
                onClick={() => {
                  const a = att.find((x) => x.date === ds);
                  setLogDate(ds);
                  setLogStr(String(a?.strength || ""));
                  setLogCard(String(a?.cardio || ""));
                  setShowLog(true);
                }}
                style={{
                  textAlign: "center",
                  padding: "6px 2px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  background: attendanceSet.has(ds) ? C.ag : "transparent",
                  border: isToday ? `2px solid ${C.accent}` : "2px solid transparent",
                }}
              >
                <div style={{ fontSize: "13px", color: C.text }}>{day}</div>
                {point ? <div style={{ fontSize: "8px", color: point }}>●</div> : <div style={{ height: "8px" }} />}
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "10px", fontSize: "10px", color: C.td, flexWrap: "wrap" }}>
          <span><span style={{ color: C.danger }}>●</span> 수업한 날</span>
          <span><span style={{ color: C.success }}>●</span> 개인 운동한 날</span>
        </div>
      </div>

      <div style={{ background: C.card, borderRadius: "14px", padding: "16px", marginBottom: "12px", border: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: C.accent }}>PT 현황</span>
          {isTrainer ? <Btn variant="ghost" onClick={() => setShowPTEdit(true)}>수정</Btn> : null}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
          <div style={{ background: C.bg, borderRadius: "8px", padding: "10px", textAlign: "center" }}>
            <div style={{ fontSize: "18px", fontWeight: 800, color: C.accent }}>{pt.totalSessions || 0}</div>
            <div style={{ fontSize: "9px", color: C.td }}>전체 PT</div>
          </div>
          <div style={{ background: C.bg, borderRadius: "8px", padding: "10px", textAlign: "center" }}>
            <div style={{ fontSize: "18px", fontWeight: 800, color: C.info }}>{getCompletedSessions(client)}</div>
            <div style={{ fontSize: "9px", color: C.td }}>진행 횟수</div>
          </div>
          <div style={{ background: C.bg, borderRadius: "8px", padding: "10px", textAlign: "center" }}>
            <div style={{ fontSize: "18px", fontWeight: 800, color: C.warn }}>{getRemainingSessions(client)}</div>
            <div style={{ fontSize: "9px", color: C.td }}>남은 PT</div>
          </div>
        </div>
      </div>

      <div style={{ background: C.card, borderRadius: "14px", padding: "16px", border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: C.accent, marginBottom: "8px" }}>
          배지 ({earnedBadges.length}/{BADGES.length})
        </div>
        {earnedBadges.map((b) => (
          <div key={b.days} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "8px", background: C.bg, borderRadius: "8px", marginBottom: "4px" }}>
            <div style={{ fontSize: "24px" }}>{b.emoji}</div>
            <div>
              <div style={{ fontSize: "12px", fontWeight: 700 }}>{b.title} <span style={{ fontSize: "9px", color: C.td }}>({b.days}일)</span></div>
              <div style={{ fontSize: "10px", color: C.tm }}>{b.msg}</div>
            </div>
          </div>
        ))}
        {nextBadge ? (
          <div style={{ marginTop: "8px", padding: "8px 12px", background: C.bg, borderRadius: "8px", border: `1px dashed ${C.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px" }}>{nextBadge.emoji} {nextBadge.title}</span>
              <BG color={C.warn}>{nextBadge.days - totalDays}일 남음</BG>
            </div>
          </div>
        ) : null}
      </div>

      {showLog ? (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex",
            alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px",
          }}
          onClick={() => setShowLog(false)}
        >
          <div
            style={{ background: C.card, borderRadius: "20px", padding: "24px", width: "100%", maxWidth: "360px", border: `1px solid ${C.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: "16px", fontWeight: 800, marginBottom: "16px" }}>{logDate} 운동 기록</div>
            <Fd label="근력 운동 (분)"><input type="number" value={logStr} onChange={(e) => setLogStr(e.target.value)} style={bi} /></Fd>
            <Fd label="유산소 운동 (분)"><input type="number" value={logCard} onChange={(e) => setLogCard(e.target.value)} style={bi} /></Fd>
            <div style={{ display: "flex", gap: "8px" }}>
              <Btn
                onClick={() => {
                  const ex = att.find((a) => a.date === logDate);
                  const next = ex
                    ? att.map((a) => a.date === logDate ? { ...a, strength: Number(logStr || 0), cardio: Number(logCard || 0) } : a)
                    : [...att, { date: logDate, strength: Number(logStr || 0), cardio: Number(logCard || 0) }];
                  onSave(next);
                  setShowLog(false);
                }}
                style={{ flex: 1 }}
              >
                저장
              </Btn>
              {att.some((a) => a.date === logDate) ? (
                <Btn
                  variant="danger"
                  onClick={() => {
                    onSave(att.filter((a) => a.date !== logDate));
                    setShowLog(false);
                  }}
                >
                  삭제
                </Btn>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {showPTEdit ? (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex",
            alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px",
          }}
          onClick={() => setShowPTEdit(false)}
        >
          <div
            style={{ background: C.card, borderRadius: "20px", padding: "24px", width: "100%", maxWidth: "400px", border: `1px solid ${C.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: "16px", fontWeight: 800, marginBottom: "16px" }}>PT 정보 수정</div>
            <Fd label="시작일"><input type="date" value={ptForm.startDate} onChange={(e) => setPtForm({ ...ptForm, startDate: e.target.value })} style={bi} /></Fd>
            <Fd label="종료일"><input type="date" value={ptForm.endDate} onChange={(e) => setPtForm({ ...ptForm, endDate: e.target.value })} style={bi} /></Fd>
            <Fd label="전체 PT"><input type="number" value={ptForm.totalSessions} onChange={(e) => setPtForm({ ...ptForm, totalSessions: e.target.value })} style={bi} /></Fd>
            <Fd label="기존 완료 횟수"><input type="number" value={ptForm.baseCompletedSessions} onChange={(e) => setPtForm({ ...ptForm, baseCompletedSessions: e.target.value })} style={bi} /></Fd>
            <Btn
              onClick={() => {
                onSavePT({
                  startDate: ptForm.startDate,
                  endDate: ptForm.endDate,
                  totalSessions: Number(ptForm.totalSessions || 0),
                  baseCompletedSessions: Number(ptForm.baseCompletedSessions || 0),
                });
                setShowPTEdit(false);
              }}
              style={{ width: "100%" }}
            >
              저장
            </Btn>
          </div>
        </div>
      ) : null}
    </>
  );
}

function InbodyForm({ record, onSave, onClose, title = "인바디 기록" }) {
  const [d, setD] = useState(record || {
    id: gid(),
    date: new Date().toISOString().split("T")[0],
    height: "", weight: "", muscle: "", fatPct: "", fatMass: "",
    bodyWater: "", protein: "", bmr: "", visceralFat: "", waist: "", score: ""
  });
  const u = (k, v) => setD((prev) => ({ ...prev, [k]: v }));

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}
      onClick={onClose}
    >
      <div
        style={{ background: C.card, borderRadius: "20px", padding: "24px", width: "100%", maxWidth: "520px", maxHeight: "85vh", overflowY: "auto", border: `1px solid ${C.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
          <span style={{ fontSize: "17px", fontWeight: 800 }}>{title}</span>
          <Btn variant="ghost" onClick={onClose}>✕</Btn>
        </div>
        {[
          ["date", "측정일", "date"],
          ["height", "키(cm)", "number"],
          ["weight", "체중(kg)", "number"],
          ["muscle", "골격근량(kg)", "number"],
          ["fatPct", "체지방률(%)", "number"],
          ["fatMass", "체지방량(kg)", "number"],
          ["bodyWater", "체수분(L)", "number"],
          ["protein", "단백질(kg)", "number"],
          ["bmr", "기초대사량", "number"],
          ["visceralFat", "내장지방", "number"],
          ["waist", "허리둘레(cm)", "number"],
          ["score", "인바디 점수", "number"],
        ].map(([k, l, t]) => (
          <Fd key={k} label={l}>
            <input type={t} value={d[k] || ""} onChange={(e) => u(k, e.target.value)} style={bi} />
          </Fd>
        ))}
        <Btn
          onClick={() =>
            onSave({
              ...d,
              id: d.id || gid(),
            })
          }
          style={{ width: "100%" }}
        >
          저장
        </Btn>
      </div>
    </div>
  );
}

function GoalsForm({ client, onSave, onClose, isClient }) {
  const [gender, setGender] = useState(client.gender || "");
  const [age, setAge] = useState(client.age || "");
  const [goals, setGoals] = useState(client.goals || { targetWeight: "", targetFatPct: "", targetMuscle: "" });
  const [notes, setNotes] = useState(client.notes || { injuries: "", surgery: "", conditions: "", experience: "" });

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}
      onClick={onClose}
    >
      <div
        style={{ background: C.card, borderRadius: "20px", padding: "24px", width: "100%", maxWidth: "520px", maxHeight: "85vh", overflowY: "auto", border: `1px solid ${C.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
          <span style={{ fontSize: "17px", fontWeight: 800 }}>{isClient ? "내 정보 수정" : "회원 정보 수정"}</span>
          <Btn variant="ghost" onClick={onClose}>✕</Btn>
        </div>
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          {["male", "female"].map((g) => (
            <button
              key={g}
              onClick={() => setGender(g)}
              style={{
                flex: 1, padding: "10px", borderRadius: "10px", border: "none", cursor: "pointer",
                background: gender === g ? C.ag : C.bg, color: gender === g ? C.accent : C.td,
                fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 600
              }}
            >
              {g === "male" ? "남성" : "여성"}
            </button>
          ))}
        </div>
        <Fd label="나이"><input value={age} onChange={(e) => setAge(e.target.value)} style={bi} /></Fd>
        <Fd label="목표 체중"><input value={goals.targetWeight || ""} onChange={(e) => setGoals({ ...goals, targetWeight: e.target.value })} style={bi} /></Fd>
        <Fd label="목표 체지방률"><input value={goals.targetFatPct || ""} onChange={(e) => setGoals({ ...goals, targetFatPct: e.target.value })} style={bi} /></Fd>
        <Fd label="목표 골격근량"><input value={goals.targetMuscle || ""} onChange={(e) => setGoals({ ...goals, targetMuscle: e.target.value })} style={bi} /></Fd>
        <Fd label="부상"><textarea value={notes.injuries || ""} onChange={(e) => setNotes({ ...notes, injuries: e.target.value })} style={{ ...bi, minHeight: "50px" }} /></Fd>
        <Fd label="수술"><textarea value={notes.surgery || ""} onChange={(e) => setNotes({ ...notes, surgery: e.target.value })} style={{ ...bi, minHeight: "50px" }} /></Fd>
        <Fd label="기타"><textarea value={notes.conditions || ""} onChange={(e) => setNotes({ ...notes, conditions: e.target.value })} style={{ ...bi, minHeight: "50px" }} /></Fd>
        <Fd label="운동경력"><input value={notes.experience || ""} onChange={(e) => setNotes({ ...notes, experience: e.target.value })} style={bi} /></Fd>
        <Btn onClick={() => onSave(gender, Number(age || 0), goals, notes)} style={{ width: "100%" }}>저장</Btn>
      </div>
    </div>
  );
}

function InbodyView({ client, isTrainer, onEdit, onAddRecord }) {
  const hist = [...(client.inbodyHistory || [])].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const latest = hist[0];

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", gap: "8px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "17px", fontWeight: 800 }}>{isTrainer ? "인바디" : "내 건강"}</span>
        <div style={{ display: "flex", gap: "6px" }}>
          <Btn onClick={onAddRecord} style={{ padding: "8px 12px", fontSize: "11px" }}>+ 인바디</Btn>
          <Btn variant="secondary" onClick={onEdit} style={{ padding: "8px 12px", fontSize: "11px" }}>{isTrainer ? "정보수정" : "목표수정"}</Btn>
        </div>
      </div>

      {!latest ? (
        <div style={{ background: C.card, borderRadius: "12px", padding: "30px", textAlign: "center", color: C.td, border: `1px solid ${C.border}` }}>
          인바디 기록이 없습니다
        </div>
      ) : (
        <div style={{ background: C.card, borderRadius: "12px", padding: "14px", border: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: C.accent }}>최근 기록</span>
            <BG color={C.info}>{latest.date}</BG>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
            {[
              ["체중", latest.weight, "kg"],
              ["골격근", latest.muscle, "kg"],
              ["체지방률", latest.fatPct, "%"],
              ["체지방량", latest.fatMass, "kg"],
              ["체수분", latest.bodyWater, "L"],
              ["기초대사량", latest.bmr, ""],
              ["내장지방", latest.visceralFat, ""],
              ["허리둘레", latest.waist, "cm"],
              ["점수", latest.score, ""],
            ].map(([l, v, u]) => (
              <div key={l} style={{ background: C.bg, borderRadius: "8px", padding: "10px", textAlign: "center" }}>
                <div style={{ fontSize: "16px", fontWeight: 800, color: C.accent }}>{v || "-"}<span style={{ fontSize: "10px", color: C.td }}>{u}</span></div>
                <div style={{ fontSize: "9px", color: C.td }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function genAutoRoutine(client) {
  const map = {};
  (client.sessions || []).forEach((s) => {
    (s.exercises || []).forEach((ex) => {
      if (!map[ex.name]) map[ex.name] = { name: ex.name, count: 0, sets: ex.sets || [] };
      map[ex.name].count += 1;
      map[ex.name].sets = ex.sets || [];
    });
  });
  return Object.values(map)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((x) => ({
      name: x.name,
      rec: `${x.sets?.length || 3}세트 × ${x.sets?.[0]?.reps || 10}회`,
    }));
}

function RtView({ client, presets, customRoutines = [], isTrainer }) {
  const auto = genAutoRoutine(client);
  return (
    <>
      <span style={{ fontSize: "17px", fontWeight: 800, display: "block", marginBottom: "8px" }}>복습 루틴</span>
      {auto.length ? (
        <div style={{ background: C.card, borderRadius: "12px", padding: "14px", marginBottom: "10px", border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: C.accent, marginBottom: "8px" }}>자동 추천 루틴</div>
          {auto.map((ex, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 10px", background: C.bg, borderRadius: "6px", marginBottom: "4px" }}>
              <span style={{ fontWeight: 600, fontSize: "11px" }}>{ex.name}</span>
              <span style={{ fontSize: "10px", color: C.accent, fontWeight: 600 }}>{ex.rec}</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: C.card, borderRadius: "12px", padding: "24px", color: C.td, textAlign: "center", border: `1px solid ${C.border}` }}>
          수업 기록이 쌓이면 루틴이 자동 생성됩니다
        </div>
      )}

      {customRoutines.length ? (
        <div style={{ background: C.card, borderRadius: "12px", padding: "14px", border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: C.accent, marginBottom: "8px" }}>트레이너 커스텀 루틴</div>
          {customRoutines.map((r) => (
            <div key={r.id} style={{ background: C.bg, borderRadius: "8px", padding: "10px", marginBottom: "6px" }}>
              <div style={{ fontWeight: 700, fontSize: "12px", marginBottom: "4px" }}>{r.title}</div>
              {r.desc ? <div style={{ fontSize: "10px", color: C.td, marginBottom: "4px" }}>{r.desc}</div> : null}
              {(r.days || []).map((d, i) => (
                <div key={i} style={{ fontSize: "11px", color: C.tm, marginBottom: "2px" }}>
                  {d.title || `Day ${i + 1}`}
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}

const trTabs = [["sessions", "수업"], ["routine", "루틴"], ["info", "인바디"], ["attend", "출석"]];
const clTabs = [["sessions", "수업"], ["routine", "루틴"], ["info", "내 건강"], ["attend", "출석"]];

function Trainer({ data, setData, onLogout }) {
  const [sel, setSel] = useState(null);
  const [tab, setTab] = useState("sessions");
  const [showSF, setShowSF] = useState(false);
  const [editS, setEditS] = useState(null);
  const [showGF, setShowGF] = useState(false);
  const [showAC, setShowAC] = useState(false);
  const [showPM, setShowPM] = useState(false);
  const [showIBF, setShowIBF] = useState(false);
  const [showSec, setShowSec] = useState(false);

  const clients = Array.isArray(data?.clients) ? data.clients : [];
  const presets = Array.isArray(data?.presets) ? data.presets : [];
  const customRoutines = Array.isArray(data?.customRoutines) ? data.customRoutines : [];
  const cl = sel ? clients.find((c) => c.id === sel) : null;

  const sv = useCallback((next) => {
    const migrated = migrateData(next);
    setData(migrated);
    localStorage.setItem(SK, JSON.stringify(migrated));
  }, [setData]);

  if (!cl) {
    return (
      <div style={{ fontFamily: "'Noto Sans KR',sans-serif", background: C.bg, color: C.text, minHeight: "100vh" }}>
        <div
          style={{
            display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px",
            borderBottom: `1px solid ${C.border}`, background: C.card, flexWrap: "wrap", gap: "6px"
          }}
        >
          <div>
            <div style={{ fontSize: "10px", color: C.accent, letterSpacing: "2px", fontWeight: 600 }}>VANGOFIT</div>
            <div style={{ fontSize: "16px", fontWeight: 800 }}>회원 관리</div>
          </div>

          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <Btn
              variant="secondary"
              onClick={async () => {
                try {
                  await uploadLocalDataToSupabase(data);
                  alert("Supabase 업로드 완료! 이제 모바일에서도 확인해보세요.");
                } catch (e) {
                  console.error(e);
                  alert("업로드 실패: " + (e.message || "알 수 없는 오류"));
                }
              }}
              style={{ fontSize: "10px", padding: "6px 10px" }}
            >
              Supabase 업로드
            </Btn>
            <Btn variant="secondary" onClick={() => setShowPM(true)} style={{ fontSize: "10px", padding: "6px 10px" }}>종목관리</Btn>
            <Btn variant="secondary" onClick={() => setShowSec(true)} style={{ fontSize: "10px", padding: "6px 10px" }}>보안설정</Btn>
            <Btn variant="secondary" onClick={onLogout} style={{ fontSize: "10px", padding: "6px 10px" }}>로그아웃</Btn>
          </div>
        </div>

        <div style={{ padding: "20px", maxWidth: "700px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <span style={{ fontSize: "16px", fontWeight: 800 }}>전체 회원</span>
              <BG>{clients.length}명</BG>
            </div>
            <Btn onClick={() => setShowAC(true)} style={{ padding: "8px 14px", fontSize: "12px" }}>+ 새 회원</Btn>
          </div>

          {!clients.length ? (
            <div style={{ textAlign: "center", padding: "50px", color: C.td }}>회원 데이터가 없습니다</div>
          ) : (
            clients.map((c) => (
              <div
                key={c.id}
                style={{ background: C.card, borderRadius: "12px", padding: "12px", border: `1px solid ${C.border}`, cursor: "pointer", marginBottom: "6px" }}
                onClick={() => { setSel(c.id); setTab("sessions"); }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700 }}>{c.name}</div>
                    <div style={{ fontSize: "10px", color: C.td }}>{c.phone || "-"}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "14px", fontWeight: 800, color: C.accent }}>{(c.sessions || []).length}</div>
                      <div style={{ fontSize: "8px", color: C.td }}>수업</div>
                      <div style={{ fontSize: "13px", fontWeight: 800, color: C.warn, marginTop: "4px" }}>{getRemainingSessions(c)}</div>
                      <div style={{ fontSize: "8px", color: C.td }}>남은 PT</div>
                    </div>
                    <Btn
                      variant="danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("삭제할까요?")) {
                          sv({ ...data, clients: clients.filter((x) => x.id !== c.id) });
                        }
                      }}
                      style={{ padding: "3px 6px" }}
                    >
                      ✕
                    </Btn>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {showAC ? <AddCl onSave={(nc) => { sv({ ...data, clients: [...clients, nc] }); setShowAC(false); }} onClose={() => setShowAC(false)} pins={clients.map((c) => c.pin)} /> : null}
        {showPM ? <PresetMgr presets={presets} onSave={(p) => { sv({ ...data, presets: p }); setShowPM(false); }} onClose={() => setShowPM(false)} /> : null}
        {showSec ? <TrainerSecurityModal trainer={data.trainer} onClose={() => setShowSec(false)} onSave={(patch) => { sv({ ...data, trainer: { ...data.trainer, ...patch } }); setShowSec(false); }} /> : null}
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Noto Sans KR',sans-serif", background: C.bg, color: C.text, minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: `1px solid ${C.border}`, background: C.card }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Btn variant="secondary" onClick={() => setSel(null)} style={{ padding: "5px 8px" }}>←</Btn>
          <div>
            <div style={{ fontSize: "9px", color: C.accent, letterSpacing: "2px", fontWeight: 600 }}>VANGOFIT</div>
            <div style={{ fontSize: "15px", fontWeight: 800 }}>{cl.name}</div>
          </div>
        </div>
        <Btn variant="secondary" onClick={onLogout} style={{ fontSize: "10px", padding: "6px 10px" }}>로그아웃</Btn>
      </div>

      <div style={{ display: "flex", gap: "2px", padding: "10px 20px", background: C.card, borderBottom: `1px solid ${C.border}`, overflowX: "auto" }}>
        {trTabs.map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              padding: "7px 12px",
              borderRadius: "10px",
              border: "none",
              fontSize: "11px",
              fontWeight: tab === k ? 700 : 500,
              cursor: "pointer",
              fontFamily: "'Noto Sans KR', sans-serif",
              whiteSpace: "nowrap",
              background: tab === k ? C.ag : "transparent",
              color: tab === k ? C.accent : C.td,
            }}
          >
            {l}
          </button>
        ))}
      </div>

      <div style={{ padding: "20px", maxWidth: "700px", margin: "0 auto" }}>
        {tab === "sessions" ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "16px", fontWeight: 800 }}>수업 기록</span>
              <div style={{ display: "flex", gap: "6px" }}>
                <Btn
                  variant="secondary"
                  onClick={() => {
                    const today = new Date().toISOString().split("T")[0];
                    const quickSession = {
                      id: gid(),
                      date: today,
                      quickCheck: true,
                      trainerMemo: "빠른 PT 출석 체크",
                      clientMemo: "",
                      exercises: [],
                    };
                    sv({
                      ...data,
                      clients: mergeClient(clients, sel, (c) => ({ ...c, sessions: [quickSession, ...(c.sessions || [])] })),
                    });
                  }}
                  style={{ padding: "8px 12px", fontSize: "12px" }}
                >
                  빠른 출석 체크
                </Btn>
                <Btn onClick={() => { setEditS(null); setShowSF(true); }} style={{ padding: "8px 12px", fontSize: "12px" }}>+ 새 기록</Btn>
              </div>
            </div>

            {!cl.sessions.length ? (
              <div style={{ textAlign: "center", padding: "50px", color: C.td }}>수업 기록이 없습니다</div>
            ) : (
              [...cl.sessions]
                .sort((a, b) => String(b.date).localeCompare(String(a.date)))
                .map((s) => (
                  <div key={s.id}>
                    <SesDet
                      session={s}
                      onSaveClientMemo={(sid, memo) =>
                        sv({
                          ...data,
                          clients: mergeClient(clients, sel, (c) => ({
                            ...c,
                            sessions: (c.sessions || []).map((x) => x.id === sid ? { ...x, clientMemo: memo } : x),
                          })),
                        })
                      }
                    />
                    <div style={{ display: "flex", gap: "4px", marginTop: "-4px", marginBottom: "6px" }}>
                      <Btn variant="ghost" onClick={() => { setEditS(s); setShowSF(true); }}>수정</Btn>
                      <Btn
                        variant="danger"
                        onClick={() => {
                          if (confirm("삭제할까요?")) {
                            sv({
                              ...data,
                              clients: mergeClient(clients, sel, (c) => ({
                                ...c,
                                sessions: (c.sessions || []).filter((x) => x.id !== s.id),
                              })),
                            });
                          }
                        }}
                      >
                        삭제
                      </Btn>
                    </div>
                  </div>
                ))
            )}
          </>
        ) : null}

        {tab === "routine" ? <RtView client={cl} presets={presets} customRoutines={customRoutines} isTrainer /> : null}
        {tab === "info" ? <InbodyView client={cl} isTrainer onEdit={() => setShowGF(true)} onAddRecord={() => setShowIBF(true)} /> : null}
        {tab === "attend" ? (
          <AttendanceView
            client={cl}
            isTrainer
            lessonDates={(cl.sessions || []).map((s) => s.date)}
            onSave={(att) =>
              sv({
                ...data,
                clients: mergeClient(clients, sel, (c) => ({ ...c, attendance: att })),
              })
            }
            onSavePT={(pt) =>
              sv({
                ...data,
                clients: mergeClient(clients, sel, (c) => ({ ...c, pt: { ...c.pt, ...pt } })),
              })
            }
          />
        ) : null}
      </div>

      {showSF ? (
        <SesForm
          presets={presets}
          session={editS}
          onSave={(s) => {
            sv({
              ...data,
              clients: mergeClient(clients, sel, (c) => ({
                ...c,
                sessions: (c.sessions || []).find((x) => x.id === s.id)
                  ? (c.sessions || []).map((x) => x.id === s.id ? s : x)
                  : [s, ...(c.sessions || [])],
              })),
            });
            setShowSF(false);
            setEditS(null);
          }}
          onClose={() => { setShowSF(false); setEditS(null); }}
        />
      ) : null}

      {showGF ? (
        <GoalsForm
          client={cl}
          onSave={(g, a, go, n) => {
            sv({
              ...data,
              clients: mergeClient(clients, sel, (c) => ({ ...c, gender: g, age: a, goals: go, notes: n })),
            });
            setShowGF(false);
          }}
          onClose={() => setShowGF(false)}
        />
      ) : null}

      {showIBF ? (
        <InbodyForm
          onSave={(rec) => {
            sv({
              ...data,
              clients: mergeClient(clients, sel, (c) => ({
                ...c,
                inbodyHistory: [rec, ...(c.inbodyHistory || []).filter((x) => x.id !== rec.id)],
              })),
            });
            setShowIBF(false);
          }}
          onClose={() => setShowIBF(false)}
          title="인바디 기록"
        />
      ) : null}
    </div>
  );
}

function Client({ data, setData, clientId, onLogout }) {
  const clients = Array.isArray(data?.clients) ? data.clients : [];
  const presets = Array.isArray(data?.presets) ? data.presets : [];
  const customRoutines = Array.isArray(data?.customRoutines) ? data.customRoutines : [];
  const cl = clients.find((c) => c.id === clientId);
  const [tab, setTab] = useState("sessions");
  const [showIBF, setShowIBF] = useState(false);
  const [showGF, setShowGF] = useState(false);

  const sv = (next) => {
    const migrated = migrateData(next);
    setData(migrated);
    localStorage.setItem(SK, JSON.stringify(migrated));
  };

  if (!cl) return <div style={{ padding: "40px", textAlign: "center", color: C.td }}>회원 정보 없음</div>;

  return (
    <div style={{ fontFamily: "'Noto Sans KR',sans-serif", background: C.bg, color: C.text, minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: `1px solid ${C.border}`, background: C.card }}>
        <div>
          <div style={{ fontSize: "9px", color: C.accent, letterSpacing: "2px", fontWeight: 600 }}>VANGOFIT</div>
          <div style={{ fontSize: "15px", fontWeight: 800 }}>{cl.name}님</div>
        </div>
        <Btn variant="secondary" onClick={onLogout} style={{ fontSize: "10px", padding: "6px 10px" }}>로그아웃</Btn>
      </div>

      <div style={{ display: "flex", gap: "2px", padding: "10px 20px", background: C.card, borderBottom: `1px solid ${C.border}`, overflowX: "auto" }}>
        {clTabs.map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              padding: "7px 12px",
              borderRadius: "10px",
              border: "none",
              fontSize: "11px",
              fontWeight: tab === k ? 700 : 500,
              cursor: "pointer",
              fontFamily: "'Noto Sans KR', sans-serif",
              whiteSpace: "nowrap",
              background: tab === k ? C.ag : "transparent",
              color: tab === k ? C.accent : C.td,
            }}
          >
            {l}
          </button>
        ))}
      </div>

      <div style={{ padding: "20px", maxWidth: "500px", margin: "0 auto" }}>
        {tab === "sessions" ? (
          <>
            <span style={{ fontSize: "16px", fontWeight: 800, display: "block", marginBottom: "10px" }}>수업 기록</span>
            {!cl.sessions.length ? (
              <div style={{ textAlign: "center", padding: "50px", color: C.td }}>수업 기록이 없습니다</div>
            ) : (
              [...cl.sessions]
                .sort((a, b) => String(b.date).localeCompare(String(a.date)))
                .map((s) => (
                  <SesDet
                    key={s.id}
                    session={s}
                    isClient
                    onSaveClientMemo={(sid, memo) =>
                      sv({
                        ...data,
                        clients: mergeClient(clients, clientId, (c) => ({
                          ...c,
                          sessions: (c.sessions || []).map((x) => x.id === sid ? { ...x, clientMemo: memo } : x),
                        })),
                      })
                    }
                  />
                ))
            )}
          </>
        ) : null}

        {tab === "routine" ? <RtView client={cl} presets={presets} customRoutines={customRoutines} /> : null}
        {tab === "info" ? <InbodyView client={cl} onEdit={() => setShowGF(true)} onAddRecord={() => setShowIBF(true)} /> : null}
        {tab === "attend" ? (
          <AttendanceView
            client={cl}
            lessonDates={(cl.sessions || []).map((s) => s.date)}
            onSave={(att) =>
              sv({
                ...data,
                clients: mergeClient(clients, clientId, (c) => ({ ...c, attendance: att })),
              })
            }
            onSavePT={() => {}}
          />
        ) : null}
      </div>

      {showIBF ? (
        <InbodyForm
          onSave={(rec) => {
            sv({
              ...data,
              clients: mergeClient(clients, clientId, (c) => ({
                ...c,
                inbodyHistory: [rec, ...(c.inbodyHistory || []).filter((x) => x.id !== rec.id)],
              })),
            });
            setShowIBF(false);
          }}
          onClose={() => setShowIBF(false)}
          title="인바디 기록"
        />
      ) : null}

      {showGF ? (
        <GoalsForm
          client={cl}
          isClient
          onSave={(g, a, go, n) => {
            sv({
              ...data,
              clients: mergeClient(clients, clientId, (c) => ({ ...c, gender: g, age: a, goals: go, notes: n })),
            });
            setShowGF(false);
          }}
          onClose={() => setShowGF(false)}
        />
      ) : null}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState(migrateData(EMPTY_DATA));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        const loaded = await loadAppDataFromSupabase();
        if (mounted) {
          setData(migrateData(loaded));
          localStorage.setItem(SK, JSON.stringify(migrateData(loaded)));
        }
      } catch (e) {
        const local = localStorage.getItem(SK);
        const parsed = local ? JSON.parse(local) : EMPTY_DATA;
        if (mounted) setData(migrateData(parsed));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    init();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
          background: C.bg, color: C.text, fontFamily: "'Noto Sans KR', sans-serif", flexDirection: "column", gap: "10px"
        }}
      >
        <div style={{ fontSize: "22px", fontWeight: 800, color: C.accent }}>VangoFit</div>
        <div style={{ fontSize: "14px", color: C.tm }}>데이터 불러오는 중...</div>
      </div>
    );
  }

  if (!user) return <Login data={data} setData={setData} onLogin={setUser} />;
  if (user.type === "trainer") return <Trainer data={data} setData={setData} onLogout={() => setUser(null)} />;
  return <Client data={data} setData={setData} clientId={user.clientId} onLogout={() => setUser(null)} />;
}
