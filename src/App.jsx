
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase";
import { importedClients } from "./imported_clients_from_excel_module";

const SK = "pt-manager-data";
const gid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// ─── 운동 DB ───
const EXERCISE_DB = {
  "하체": [
    "Sissy Hack Squat","FITNESS - Prone Leg Curl","FREE MOTION - Calf Raise","ARSENAL - Reloaded Glute Bridge",
    "GYMLECO - Pit Shark","CYBEX - Kneeling Leg Curl","PRECOR - Hack Slide","GYMLECO - Squat Press",
    "NAUTILUS - Adduction","PRECOR - Prone Leg Curl","Cybex - Hip Thrust","Gym80 - Leg Press",
    "Universal - Leg Press","GYMLECO - V Squat"
  ],
  "가슴": [
    "NAUTILUS LEVERAGE - Chest Press","BODY MASTER - Bench Press","LIFE FITNESS - Assisted Dip",
    "BODY MASTER - Incline Bench Press","BODY MASTER - Pec Dec","HAMMER STRENGTH - Iso-Lateral Bench Press",
    "Universal - Incline Chest Press","CYBEX - Fly","BODY MASTER - Chest Press","LIFE FITNESS - Pectoral Fly",
    "ARSENAL STRENGTH - Incline Chest Press","Technogym - WCP","CNK - Incline Chest Press"
  ],
  "등": [
    "Hoist - Lat Pulldown","Cybex - Low Row","FITNESS - Pull Down Machine","HAMMER STRENGTH - Iso-Lateral High Row",
    "HAMMER STRENGTH - Iso-Lateral D.Y. Row","PRIME - Seated Row","LIFE FITNESS - Pull Over","TECHNOGYM - T-Bar Row",
    "HAMMER STRENGTH - Iso Pull Down","UNIVERSAL - Lat Pull Down"
  ],
  "어깨": [
    "Cybex - Overhead Press","Cybex - Lateral Raise","Dynamic - Shoulder Press","CYBEX - Smith Machine Shoulder Press",
    "BODY MASTER - Shoulder Press","ADVANCE - Bentover Lateral Raise","원암 사이드 레터럴 레이즈"
  ],
  "팔": [
    "MAXPUMP - Standing Arms Curl","원암 덤벨 오버헤드 익스텐션","원암 덤벨 컬","HAMMER STRENGTH - Seated Dip",
    "케이블 푸시다운 - 로프","Nautilus - Multi Biceps","BodyMaster - Overhead Tricep Extension"
  ],
  "복근": [
    "레그 레이즈","러시안 트위스트","플랭크","복근 에어 바이크","크런치","행잉 레그 레이즈","힐 터치"
  ],
  "기타": [
    "원암 케이블 푸시 다운","케이블 해머 컬","케이블 오버헤드 익스텐션","리버스 케이블 컬",
    "리버스 덤벨 컬","인클라인 덤벨 컬","벤치 딥스"
  ]
};

function buildDefaultPresets() {
  let count = 1;
  return Object.entries(EXERCISE_DB).flatMap(([category, exercises]) =>
    exercises.map((name) => ({
      id: `p${count++}`,
      name,
      category,
      photo: "",
      youtube: "",
    }))
  );
}

const defPresets = buildDefaultPresets();

function mergePresetsWithDB(existingPresets = []) {
  const dbPresets = buildDefaultPresets();
  const keyOf = (p) => `${p.category}__${p.name}`.trim().toLowerCase();

  const existingMap = new Map((existingPresets || []).map((p) => [
    keyOf(p),
    { photo: "", youtube: "", ...p }
  ]));

  const merged = dbPresets.map((dbPreset) => {
    const found = existingMap.get(keyOf(dbPreset));
    return found ? { ...dbPreset, ...found, id: found.id || dbPreset.id } : dbPreset;
  });

  const dbKeySet = new Set(dbPresets.map((p) => keyOf(p)));
  const customOnly = (existingPresets || []).filter((p) => !dbKeySet.has(keyOf(p)));

  return [...merged, ...customOnly];
}

// ─── 평균값 ───
const AVG={male:{muscle:{"155":26,"160":27.5,"165":29,"170":30.5,"175":32,"180":33.5,"185":35,"190":36.5},fatPct:{"155":19,"160":18,"165":18,"170":17,"175":17,"180":16,"185":16,"190":15},weight:{"155":58,"160":62,"165":66,"170":70,"175":74,"180":78,"185":82,"190":86},bodyWater:{"155":33,"160":35,"165":37,"170":39,"175":41,"180":43,"185":45,"190":47},bmr:{"155":1380,"160":1420,"165":1480,"170":1540,"175":1590,"180":1650,"185":1710,"190":1770}},female:{muscle:{"145":18.5,"150":19.5,"155":20.5,"160":21.5,"165":22.5,"170":23.5,"175":24.5,"180":25.5},fatPct:{"145":27,"150":26,"155":26,"160":25,"165":25,"170":24,"175":24,"180":23},weight:{"145":46,"150":49,"155":52,"160":55,"165":58,"170":61,"175":64,"180":67},bodyWater:{"145":24,"150":26,"155":27,"160":29,"165":30,"170":32,"175":33,"180":35},bmr:{"145":1100,"150":1140,"155":1180,"160":1220,"165":1260,"170":1300,"175":1340,"180":1380}}};
function getA(g,h,f){if(!g||!h)return null;const d=AVG[g];if(!d?.[f])return null;return d[f][String(Math.max(145,Math.min(190,Math.round(Number(h)/5)*5)))]||null;}
function cmpV(c,a,u,hb){if(c==null||c===""||a==null||a==="")return null;const d=Number(c)-Number(a),ad=Math.abs(d).toFixed(1);if(Math.abs(d)<0.5)return{text:"평균",color:"#60A5FA"};if(hb)return d>0?{text:`+${ad}${u}`,color:"#4ADE80"}:{text:`-${ad}${u}`,color:"#F87171"};return d<0?{text:`-${ad}${u}`,color:"#4ADE80"}:{text:`+${ad}${u}`,color:"#F87171"};}
function waistB(v,g){if(v==null||v===""||!g)return null;return Number(v)<(g==="male"?90:85)?{text:"정상",color:"#4ADE80"}:{text:"복부비만 주의",color:"#F87171"};}
function vfB(v){if(v==null||v==="")return null;const n=Number(v);return n<=9?{text:"정상",color:"#4ADE80"}:n<=14?{text:"주의",color:"#FBBF24"}:{text:"위험",color:"#F87171"};}
function calcBMI(w,h){if(!w||!h)return null;return Math.round(Number(w)/((Number(h)/100)**2)*10)/10;}
function bmiB(b){if(!b)return null;return b<18.5?{text:"저체중",color:"#60A5FA"}:b<23?{text:"정상",color:"#4ADE80"}:b<25?{text:"과체중",color:"#FBBF24"}:b<30?{text:"비만",color:"#F87171"}:{text:"고도비만",color:"#E85454"};}

const BADGES=[
  {days:1,emoji:"👟",title:"첫 출석",msg:"좋은 변화는 첫 걸음에서 시작됩니다. 오늘이 시작이에요!"},
  {days:2,emoji:"🌿",title:"워밍업 완료",msg:"몸이 운동 리듬을 기억하기 시작했어요."},
  {days:3,emoji:"🔥",title:"3일 점화",msg:"처음의 의지가 행동으로 바뀌고 있어요."},
  {days:5,emoji:"💪",title:"기초 체력단",msg:"벌써 5일! 꾸준함이 근육보다 먼저 자랍니다."},
  {days:7,emoji:"🌱",title:"첫 주 완주",msg:"일주일 달성! 운동 습관의 씨앗이 심어졌어요."},
  {days:10,emoji:"⚡",title:"10일 스파크",msg:"지금부터는 몸이 '운동하는 사람'으로 바뀌기 시작합니다."},
  {days:12,emoji:"🏃",title:"리듬 탑승",msg:"출석 리듬이 생겼어요. 흐름을 놓치지 마세요."},
  {days:14,emoji:"🧩",title:"습관 조립",msg:"2주 달성! 운동이 생활 속 퍼즐처럼 맞춰지고 있어요."},
  {days:17,emoji:"🎯",title:"집중 모드",msg:"이제 실행형 회원님!"},
  {days:20,emoji:"🛡️",title:"20일 방패",msg:"몸을 지키는 가장 좋은 보험은 꾸준한 운동입니다."},
  {days:21,emoji:"🔁",title:"습관 루프",msg:"3주 달성! 행동이 반복되면 정체성이 됩니다."},
  {days:25,emoji:"🚀",title:"상승 기류",msg:"몸과 자신감이 함께 올라가고 있어요."},
  {days:30,emoji:"🏅",title:"한 달 완주",msg:"이제 운동은 이벤트가 아니라 생활입니다."},
  {days:35,emoji:"🧠",title:"의지 컨트롤러",msg:"운동은 집중력과 자기조절에도 도움이 됩니다."},
  {days:40,emoji:"🌊",title:"흐름의 사람",msg:"출석 흐름이 아주 좋습니다."},
  {days:45,emoji:"🏋️",title:"철근 회원",msg:"근력도, 습관도 같이 올라가는 중입니다."},
  {days:50,emoji:"❤️",title:"심장 수호자",msg:"꾸준한 운동은 심혈관 건강을 지키는 강력한 습관입니다."},
  {days:60,emoji:"💎",title:"60일 크리스탈",msg:"남들이 꾸준하다고 느끼는 구간이에요."},
  {days:70,emoji:"🌞",title:"에너지 충전기",msg:"몸의 컨디션과 하루 에너지가 달라질 거예요."},
  {days:75,emoji:"🧬",title:"뇌 건강 지킴이",msg:"운동은 기억력과 기분 조절에도 긍정적입니다."},
  {days:90,emoji:"👑",title:"90일 클래스",msg:"몸이 정말로 바뀌기 시작하는 시점입니다."},
  {days:100,emoji:"⭐",title:"100일 전사",msg:"100일은 아무나 못 갑니다."},
  {days:120,emoji:"🏛️",title:"기초 체력 건축가",msg:"몸의 기초 공사를 아주 잘 쌓고 있어요."},
  {days:150,emoji:"🏆",title:"반년의 약속",msg:"운동이 삶의 일부가 됩니다."},
  {days:180,emoji:"⛰️",title:"하프 이어 등반가",msg:"체력과 자신감이 완전히 달라질 수 있는 구간입니다."},
  {days:200,emoji:"🔥",title:"200일 철인",msg:"대단합니다. 운동이 몸을 끌고 가는 단계에 들어섰어요."},
  {days:240,emoji:"🦾",title:"강철 루틴",msg:"하루를 운동 중심으로 설계할 수 있는 사람입니다."},
  {days:270,emoji:"🌌",title:"꾸준함의 궤도",msg:"멈추는 게 더 어색한 단계예요."},
  {days:300,emoji:"🐯",title:"300일 맹수",msg:"체력, 습관, 자신감이 함께 진화하고 있어요."},
  {days:365,emoji:"🎖️",title:"1년 마스터",msg:"몸도 마음도 완전히 다른 사람이 된 레벨입니다."},
];

const catKw = {
  "가슴": ["Chest","Bench","Pec","Fly","Dip","WCP","체스트","벤치","딥스"],
  "등": ["Lat","Row","Pull","Pulldown","T-Bar","Pull Over","랫","로우","풀다운"],
  "어깨": ["Shoulder","Lateral","Overhead","Bentover","숄더","래터럴","사이드"],
  "하체": ["Squat","Leg","Glute","Hip Thrust","Hack","Calf","Adduction","스쿼트","레그","런지","데드리프트","힙"],
  "팔": ["Curl","Tricep","Biceps","Pushdown","Extension","Dip","컬","푸시다운","익스텐션"],
  "복근": ["Crunch","Plank","Twist","Leg Raise","Air Bike","크런치","플랭크","레그 레이즈","러시안"],
  "기타": ["기타"]
};
function catEx(n,pr){const p=pr?.find(x=>x.name===n);if(p?.category)return p.category;for(const[c,kw]of Object.entries(catKw))if(kw.some(k=>n.includes(k)))return c;return"기타";}
function genRt(cl,pr){
  if(!cl.sessions?.length)return null;
  const em={};
  cl.sessions.filter(s=>!s.quickCheck).forEach(s=>s.exercises.forEach(e=>{
    const c=catEx(e.name,pr);
    if(!em[e.name])em[e.name]={name:e.name,category:c,lastSets:e.sets,count:0};
    em[e.name].count++;
    em[e.name].lastSets=e.sets;
  }));
  const ex=Object.values(em).sort((a,b)=>b.count-a.count);
  if(!ex.length) return null;
  const rc=e=>{const s=e.lastSets?.[0];const w=s?.weight?`${Math.round(s.weight*0.8)}kg`:"";return`${e.lastSets?.length||3}세트×${s?.reps||10}회${w?` (${w})`:""}`;};
  return [
    {type:"fullbody",title:"전신",desc:"상하체 골고루",days:[{title:"전신 운동",exercises:[...ex.filter(e=>["가슴","등"].includes(e.category)).slice(0,2),...ex.filter(e=>["어깨","팔"].includes(e.category)).slice(0,1),...ex.filter(e=>e.category==="하체").slice(0,2)].map(e=>({...e,rec:rc(e)}))}]},
    {type:"ul",title:"상하체 분할",desc:"상체/하체 2분할",days:[{title:"상체의 날",exercises:ex.filter(e=>["가슴","등","어깨","팔"].includes(e.category)).slice(0,5).map(e=>({...e,rec:rc(e)}))},{title:"하체의 날",exercises:ex.filter(e=>e.category==="하체").slice(0,5).map(e=>({...e,rec:rc(e)}))}]},
    {type:"ppl",title:"PPL",desc:"Push/Pull/Legs",days:[{title:"Push",exercises:ex.filter(e=>["가슴","어깨"].includes(e.category)).slice(0,3).map(e=>({...e,rec:rc(e)}))},{title:"Pull",exercises:ex.filter(e=>e.category==="등").slice(0,3).map(e=>({...e,rec:rc(e)}))},{title:"Legs",exercises:ex.filter(e=>e.category==="하체").slice(0,5).map(e=>({...e,rec:rc(e)}))}]}].filter(r=>r.days.some(d=>d.exercises.length>0));
}

// ─── colors/ui ───
const C={bg:"#0C0D11",card:"#16181F",cardAlt:"#1C1E27",accent:"#D4A843",ag:"rgba(212,168,67,0.12)",text:"#EDEAE3",td:"#7A786F",tm:"#B5B2A8",border:"#26282F",danger:"#E85454",success:"#4ADE80",info:"#60A5FA",warn:"#FBBF24"};
const bi={width:"100%",padding:"12px 16px",borderRadius:"10px",border:`1px solid ${C.border}`,background:C.bg,color:C.text,fontSize:"14px",outline:"none",boxSizing:"border-box",fontFamily:"'Noto Sans KR',sans-serif"};
function Btn({children,variant="primary",style,...p}){const base={padding:"11px 20px",borderRadius:"10px",border:"none",fontSize:"14px",fontWeight:600,cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif",transition:"all 0.15s",...style};const v={primary:{background:C.accent,color:C.bg},secondary:{background:"transparent",border:`1px solid ${C.border}`,color:C.tm},danger:{background:"rgba(232,84,84,0.12)",color:C.danger,fontSize:"12px",padding:"7px 14px"},ghost:{background:"transparent",color:C.td,padding:"7px 14px",fontSize:"13px"}};return <button style={{...base,...v[variant]}} {...p}>{children}</button>;}
function BG({children,color=C.accent}){return <span style={{display:"inline-block",padding:"3px 10px",borderRadius:"6px",fontSize:"11px",fontWeight:600,background:`${color}20`,color}}>{children}</span>;}
function Fd({label,children}){return <div style={{marginBottom:"12px"}}><div style={{fontSize:"11px",fontWeight:600,color:C.td,marginBottom:"5px",letterSpacing:"1px"}}>{label}</div>{children}</div>;}
function Stat({label,value,unit,comparison,badge}){return <div style={{textAlign:"center",padding:"12px 6px",background:C.bg,borderRadius:"10px",minWidth:0}}><div style={{fontSize:"18px",fontWeight:800,color:C.accent}}>{value||"-"}<span style={{fontSize:"10px",color:C.td}}>{unit}</span></div><div style={{fontSize:"9px",color:C.td,marginTop:"2px"}}>{label}</div>{comparison&&<div style={{fontSize:"8px",color:comparison.color,marginTop:"2px",fontWeight:600}}>{comparison.text}</div>}{badge&&<div style={{fontSize:"8px",color:badge.color,marginTop:"2px",fontWeight:600}}>{badge.text}</div>}</div>;}
function MiniTrend({data,field,label,color=C.accent}){const vals=data.map(d=>Number(d[field])).filter(v=>!Number.isNaN(v)&&v!==0);if(vals.length<2)return null;const mn=Math.min(...vals),mx=Math.max(...vals),rg=mx-mn||1,w=120,h=40;const pts=vals.map((v,i)=>`${(i/(vals.length-1))*w},${h-((v-mn)/rg)*(h-8)-4}`).join(" ");const df=vals[vals.length-1]-vals[0];return <div style={{display:"flex",alignItems:"center",gap:"10px",padding:"8px 12px",background:C.bg,borderRadius:"8px",marginBottom:"4px"}}><div style={{flex:1}}><div style={{fontSize:"11px",color:C.td}}>{label}</div><div style={{fontSize:"15px",fontWeight:700,color:C.text}}>{vals[vals.length-1]}</div></div><svg width={w} height={h} style={{flexShrink:0}}><polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg><div style={{fontSize:"11px",fontWeight:700,color:df>0?C.success:df<0?C.danger:C.td,minWidth:"40px",textAlign:"right"}}>{df>0?"+":""}{df.toFixed(1)}</div></div>;}

// helpers
function getCompletedSessions(client){return (client?.pt?.baseCompletedSessions||0)+(client?.sessions?.length||0);}
function getRemainingSessions(client){return Math.max(0,(client?.pt?.totalSessions||0)-getCompletedSessions(client));}
const WG=`배꼽 바로 위를 줄자로 수평하게 감아 측정합니다.\n숨을 편하게 내쉰 상태에서 측정하세요.\n\n복부비만 기준: 남성 90cm / 여성 85cm 이상`;

function migrateData(raw){
  const safe=raw||{};
  const trainer={loginId:"hyungmin",password:"VangoFit!2026#",pin:"1234",failedAttempts:0,lockUntil:0,...(safe.trainer||(safe.trainerPin?{pin:safe.trainerPin}:{}))};
  const presets=mergePresetsWithDB((safe.presets||[]).map(p=>({photo:"",youtube:"",...p})));
  const customRoutines=Array.isArray(safe.customRoutines)?safe.customRoutines:[];
  const sourceClients=(safe.clients&&safe.clients.length?safe.clients:importedClients)||[];
  const clients=sourceClients.map((c,idx)=>({
    id:c.id||`c${idx+1}`,
    name:c.name||"",
    pin:c.pin||"",
    phone:c.phone||"",
    gender:c.gender||"",
    age:c.age||"",
    goals:{targetWeight:"",targetFatPct:"",targetMuscle:"",...(c.goals||{})},
    notes:{injuries:"",surgery:"",conditions:"",experience:"",...(c.notes||{})},
    pt:{
      startDate:"",
      endDate:"",
      totalSessions:0,
      baseCompletedSessions:c?.pt?.baseCompletedSessions??c?.pt?.legacyCompletedSessions??c?.pt?.completedSessions??0,
      ...(c.pt||{})
    },
    attendance:Array.isArray(c.attendance)?dedupeAttendance(c.attendance):[],
    inbodyHistory:Array.isArray(c.inbodyHistory)?c.inbodyHistory:[],
    customRoutines:Array.isArray(c.customRoutines)?c.customRoutines:[],
    sessions:Array.isArray(c.sessions)?c.sessions.map(s=>({exercises:[],trainerMemo:"",clientMemo:"",...s})):[],
  }));
  return {trainer,presets,customRoutines,clients};
}
function dedupeAttendance(att){
  const map=new Map();
  att.forEach(a=>{if(a?.date) map.set(a.date,{date:a.date,strength:Number(a.strength)||0,cardio:Number(a.cardio)||0});});
  return Array.from(map.values()).sort((a,b)=>a.date.localeCompare(b.date));
}

function ExDetailModal({preset,onClose}) {
  if(!preset) return null;
  return <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1200,padding:"20px"}} onClick={onClose}>
    <div style={{background:C.card,borderRadius:"20px",padding:"24px",width:"100%",maxWidth:"440px",maxHeight:"80vh",overflowY:"auto",border:`1px solid ${C.border}`}} onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}><span style={{fontSize:"16px",fontWeight:800}}>{preset.name}</span><Btn variant="ghost" onClick={onClose}>✕</Btn></div>
      <BG color={C.info}>{preset.category}</BG>
      {preset.photo?<div style={{marginTop:"14px"}}><img src={preset.photo} alt={preset.name} style={{width:"100%",borderRadius:"12px",objectFit:"cover",maxHeight:"300px"}} /></div>:<div style={{marginTop:"14px",background:C.bg,borderRadius:"12px",padding:"40px",textAlign:"center",color:C.td,fontSize:"13px"}}>📷 사진이 등록되지 않았습니다</div>}
      {preset.youtube?<a href={preset.youtube} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:"10px",marginTop:"14px",padding:"14px",background:C.bg,borderRadius:"12px",textDecoration:"none",color:C.text,border:`1px solid ${C.border}`}}><span style={{fontSize:"28px"}}>▶️</span><div><div style={{fontSize:"13px",fontWeight:700}}>운동 영상 보기</div><div style={{fontSize:"11px",color:C.td}}>YouTube에서 올바른 자세를 확인하세요</div></div></a>:<div style={{marginTop:"14px",padding:"12px",background:C.bg,borderRadius:"10px",fontSize:"12px",color:C.td,textAlign:"center"}}>영상 링크가 등록되지 않았습니다</div>}
    </div>
  </div>;
}

function AttendanceView({client,isTrainer,onSave,onSavePT}){
  const att=dedupeAttendance(client.attendance||[]);const pt=client.pt||{};const today=new Date().toISOString().split("T")[0];
  const [month,setMonth]=useState(()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;});
  const [showLog,setShowLog]=useState(false);const [logDate,setLogDate]=useState(today);const [logStr,setLogStr]=useState("");const [logCard,setLogCard]=useState("");
  const [showPTEdit,setShowPTEdit]=useState(false);
  const [ptForm,setPtForm]=useState({startDate:pt.startDate||"",endDate:pt.endDate||"",totalSessions:pt.totalSessions||"",baseCompletedSessions:pt.baseCompletedSessions||0});
  const totalDays=att.length;const yr=Number(month.split("-")[0]),mo=Number(month.split("-")[1]);
  const yearDays=att.filter(a=>a.date.startsWith(String(yr))).length;
  const monthDays=att.filter(a=>a.date.startsWith(month)).length;
  const daysInMonth=new Date(yr,mo,0).getDate();const monthRate=daysInMonth>0?Math.round((monthDays/daysInMonth)*100):0;
  const earnedBadges=BADGES.filter(b=>totalDays>=b.days);const nextBadge=BADGES.find(b=>totalDays<b.days);
  const firstDay=new Date(yr,mo-1,1).getDay();const calDays=[];for(let i=0;i<firstDay;i++)calDays.push(null);for(let i=1;i<=daysInMonth;i++)calDays.push(i);
  const hasWorkout=d=>d&&att.some(a=>a.date===`${month}-${String(d).padStart(2,"0")}`);
  const hasLesson=d=>d&&((client.sessions||[]).some(s=>s.date===`${month}-${String(d).padStart(2,"0")}`));
  const getAtt=d=>att.find(a=>a.date===`${month}-${String(d).padStart(2,"0")}`);
  const totalMin=att.reduce((s,a)=>s+(a.strength||0)+(a.cardio||0),0);
  const completed=getCompletedSessions(client);
  const remaining=getRemainingSessions(client);
  return <>
    <span style={{fontSize:"18px",fontWeight:800,display:"block",marginBottom:"14px"}}>출석 & 동기부여</span>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"6px",marginBottom:"12px"}}>{[
      [totalDays,"누적 운동일",C.accent],[yearDays,`${yr}년`,C.success],[monthRate+"%",`${mo}월 출석률`,C.info],[Math.round(totalMin/60)+"h","총 운동시간",C.warn]
    ].map(([v,l,c],i)=><div key={i} style={{background:C.card,borderRadius:"10px",padding:"12px 6px",textAlign:"center",border:`1px solid ${C.border}`}}><div style={{fontSize:"18px",fontWeight:800,color:c}}>{v}</div><div style={{fontSize:"8px",color:C.td}}>{l}</div></div>)}</div>

    {(pt.totalSessions||isTrainer)&&<div style={{background:C.card,borderRadius:"14px",padding:"14px",marginBottom:"12px",border:`1px solid ${C.border}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}><span style={{fontSize:"13px",fontWeight:700,color:C.accent}}>PT 현황</span>{isTrainer&&<Btn variant="ghost" onClick={()=>setShowPTEdit(true)} style={{fontSize:"10px"}}>수정</Btn>}</div>
      {pt.totalSessions ? <>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px",fontSize:"11px"}}><span style={{color:C.td}}>기간</span><span style={{color:C.text}}>{pt.startDate||"-"} ~ {pt.endDate||"-"}</span></div>
        <div style={{display:"flex",gap:"6px",marginBottom:"6px"}}>
          <div style={{flex:1,background:C.bg,borderRadius:"8px",padding:"10px",textAlign:"center"}}><div style={{fontSize:"18px",fontWeight:800,color:C.accent}}>{completed}/{pt.totalSessions}</div><div style={{fontSize:"8px",color:C.td}}>진행/전체</div></div>
          <div style={{flex:1,background:C.bg,borderRadius:"8px",padding:"10px",textAlign:"center"}}><div style={{fontSize:"18px",fontWeight:800,color:C.warn}}>{remaining}</div><div style={{fontSize:"8px",color:C.td}}>남은 횟수</div></div>
        </div>
        <div style={{background:C.bg,borderRadius:"4px",height:"6px",overflow:"hidden"}}><div style={{height:"100%",background:C.accent,borderRadius:"4px",width:`${Math.min(100,Math.round((completed/pt.totalSessions)*100))}%`}}/></div>
      </> : <div style={{fontSize:"11px",color:C.td,textAlign:"center",padding:"8px"}}>PT 정보 없음</div>}
    </div>}

    <div style={{background:C.card,borderRadius:"14px",padding:"14px",marginBottom:"12px",border:`1px solid ${C.border}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}><Btn variant="ghost" onClick={()=>{const d=new Date(yr,mo-2,1);setMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);}} style={{padding:"3px 8px"}}>◀</Btn><span style={{fontSize:"14px",fontWeight:700}}>{yr}년 {mo}월</span><Btn variant="ghost" onClick={()=>{const d=new Date(yr,mo,1);setMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);}} style={{padding:"3px 8px"}}>▶</Btn></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"2px",textAlign:"center",marginBottom:"3px"}}>{["일","월","화","수","목","금","토"].map(d=><div key={d} style={{fontSize:"9px",color:C.td,padding:"3px"}}>{d}</div>)}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"2px"}}>{calDays.map((day,i)=>{if(!day)return <div key={i}/>;const workout=hasWorkout(day);const lesson=hasLesson(day);const isT=`${month}-${String(day).padStart(2,"0")}`===today;
        return <div key={i} onClick={()=>{const ds=`${month}-${String(day).padStart(2,"0")}`;setLogDate(ds);const a=getAtt(day);setLogStr(a?String(a.strength||""):"");setLogCard(a?String(a.cardio||""):"");setShowLog(true);}} style={{textAlign:"center",padding:"5px 2px",borderRadius:"8px",cursor:"pointer",background:workout?C.ag:"transparent",border:isT?`2px solid ${C.accent}`:"2px solid transparent"}}><div style={{fontSize:"12px",fontWeight:(workout||lesson)?700:400,color:(workout||lesson)?C.accent:C.text}}>{day}</div><div style={{display:"flex",justifyContent:"center",gap:"3px",marginTop:"1px",minHeight:"8px"}}>{lesson&&<span style={{width:"6px",height:"6px",borderRadius:"50%",background:C.danger,display:"inline-block"}} />} {workout&&<span style={{width:"6px",height:"6px",borderRadius:"50%",background:C.success,display:"inline-block"}} />}</div></div>;})}</div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:"8px",fontSize:"10px",color:C.td}}><span>{monthDays}일 운동</span><span>근력 {att.filter(a=>a.date.startsWith(month)).reduce((s,a)=>s+(a.strength||0),0)}분 · 유산소 {att.filter(a=>a.date.startsWith(month)).reduce((s,a)=>s+(a.cardio||0),0)}분</span></div><div style={{display:"flex",gap:"12px",marginTop:"8px",fontSize:"10px",color:C.td,flexWrap:"wrap"}}><span style={{display:"flex",alignItems:"center",gap:"5px"}}><span style={{width:"8px",height:"8px",borderRadius:"50%",background:C.danger,display:"inline-block"}} /> 레슨한 날</span><span style={{display:"flex",alignItems:"center",gap:"5px"}}><span style={{width:"8px",height:"8px",borderRadius:"50%",background:C.success,display:"inline-block"}} /> 개인 운동한 날</span></div>
    </div>

    {!att.some(a=>a.date===today)&&<Btn onClick={()=>{setLogDate(today);setLogStr("");setLogCard("");setShowLog(true);}} style={{width:"100%",marginBottom:"12px",padding:"14px",fontSize:"15px"}}>오늘 운동 기록하기 💪</Btn>}

    <div style={{background:C.card,borderRadius:"14px",padding:"14px",marginBottom:"12px",border:`1px solid ${C.border}`}}>
      <span style={{fontSize:"13px",fontWeight:700,color:C.accent,display:"block",marginBottom:"8px"}}>배지 ({earnedBadges.length}/{BADGES.length})</span>
      {earnedBadges.length===0&&<div style={{fontSize:"11px",color:C.td,textAlign:"center",padding:"12px"}}>첫 배지까지 {BADGES[0].days-totalDays}일 남았어요! 오늘 바로 시작해볼까요? 💪</div>}
      {earnedBadges.map(b=><div key={b.days} style={{display:"flex",gap:"10px",alignItems:"flex-start",padding:"8px",background:C.bg,borderRadius:"8px",marginBottom:"4px"}}><div style={{fontSize:"24px",flexShrink:0}}>{b.emoji}</div><div><div style={{fontSize:"12px",fontWeight:700}}>{b.title} <span style={{fontSize:"9px",color:C.td}}>({b.days}일)</span></div><div style={{fontSize:"10px",color:C.tm,marginTop:"1px",lineHeight:1.3}}>{b.msg}</div></div></div>)}
      {nextBadge&&<div style={{marginTop:"6px",padding:"8px 12px",background:C.bg,borderRadius:"8px",border:`1px dashed ${C.border}`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:"12px"}}>{nextBadge.emoji} {nextBadge.title}</span><BG color={C.warn}>{nextBadge.days-totalDays}일 남음</BG></div><div style={{background:C.card,borderRadius:"3px",height:"5px",marginTop:"5px",overflow:"hidden"}}><div style={{height:"100%",background:C.accent,borderRadius:"3px",width:`${Math.round((totalDays/nextBadge.days)*100)}%`}}/></div></div>}
    </div>

    {showLog&&<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"20px"}} onClick={()=>setShowLog(false)}><div style={{background:C.card,borderRadius:"20px",padding:"24px",width:"100%",maxWidth:"360px",border:`1px solid ${C.border}`}} onClick={e=>e.stopPropagation()}><div style={{fontSize:"16px",fontWeight:800,marginBottom:"14px"}}>{logDate} 운동 기록</div><Fd label="근력 운동 (분)"><input type="number" value={logStr} onChange={e=>setLogStr(e.target.value)} style={bi} placeholder="예: 60"/></Fd><Fd label="유산소 운동 (분)"><input type="number" value={logCard} onChange={e=>setLogCard(e.target.value)} style={bi} placeholder="예: 30"/></Fd><div style={{display:"flex",gap:"8px"}}><Btn onClick={()=>{const ex=att.find(a=>a.date===logDate);onSave(ex?att.map(a=>a.date===logDate?{...a,strength:Number(logStr)||0,cardio:Number(logCard)||0}:a):[...att,{date:logDate,strength:Number(logStr)||0,cardio:Number(logCard)||0}]);setShowLog(false);}} style={{flex:1}}>저장</Btn>{att.some(a=>a.date===logDate)&&<Btn variant="danger" onClick={()=>{onSave(att.filter(a=>a.date!==logDate));setShowLog(false);}}>삭제</Btn>}</div></div></div>}

    {showPTEdit&&<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"20px"}} onClick={()=>setShowPTEdit(false)}><div style={{background:C.card,borderRadius:"20px",padding:"24px",width:"100%",maxWidth:"400px",border:`1px solid ${C.border}`}} onClick={e=>e.stopPropagation()}><div style={{fontSize:"16px",fontWeight:800,marginBottom:"14px"}}>PT 정보 수정</div><Fd label="시작일"><input type="date" value={ptForm.startDate} onChange={e=>setPtForm({...ptForm,startDate:e.target.value})} style={bi}/></Fd><Fd label="종료일"><input type="date" value={ptForm.endDate} onChange={e=>setPtForm({...ptForm,endDate:e.target.value})} style={bi}/></Fd><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}><Fd label="전체 PT"><input type="number" value={ptForm.totalSessions} onChange={e=>setPtForm({...ptForm,totalSessions:e.target.value})} style={bi}/></Fd><Fd label="기존 완료 횟수"><input type="number" value={ptForm.baseCompletedSessions} onChange={e=>setPtForm({...ptForm,baseCompletedSessions:e.target.value})} style={bi}/></Fd></div><Btn onClick={()=>{onSavePT({startDate:ptForm.startDate,endDate:ptForm.endDate,totalSessions:Number(ptForm.totalSessions)||0,baseCompletedSessions:Number(ptForm.baseCompletedSessions)||0});setShowPTEdit(false);}} style={{width:"100%"}}>저장</Btn></div></div>}
  </>;
}

function InbodyForm({record,onSave,onClose,title}){const[d,setD]=useState(record||{id:"",date:new Date().toISOString().split("T")[0],height:"",weight:"",muscle:"",fatPct:"",fatMass:"",bodyWater:"",protein:"",bmr:"",visceralFat:"",waist:"",score:""});const u=(k,v)=>setD({...d,[k]:v});const[wg,setWg]=useState(false);const ib=[["date","측정일","date"],["height","키(cm)","number"],["weight","체중(kg)","number"],["muscle","골격근량(kg)","number"],["fatPct","체지방률(%)","number"],["fatMass","체지방량(kg)","number"],["bodyWater","체수분(L)","number"],["protein","단백질(kg)","number"],["bmr","기초대사량(kcal)","number"],["visceralFat","내장지방 레벨","number"],["score","인바디 점수","number"]];
return <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"16px"}} onClick={onClose}><div style={{background:C.card,borderRadius:"20px",padding:"24px",width:"100%",maxWidth:"500px",maxHeight:"85vh",overflowY:"auto",border:`1px solid ${C.border}`}} onClick={e=>e.stopPropagation()}><div style={{display:"flex",justifyContent:"space-between",marginBottom:"12px"}}><span style={{fontSize:"17px",fontWeight:800}}>{title}</span><Btn variant="ghost" onClick={onClose}>✕</Btn></div><div style={{fontSize:"11px",color:C.td,marginBottom:"12px",padding:"8px 12px",background:C.bg,borderRadius:"8px"}}>인바디 결과지 항목만 입력하세요</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px"}}>{ib.map(([k,l,t])=><Fd key={k} label={l}><input type={t} value={d[k]||""} onChange={e=>u(k,e.target.value)} style={bi}/></Fd>)}</div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"10px 0 4px"}}><span style={{fontSize:"12px",fontWeight:700,color:C.accent}}>허리둘레(직접측정)</span><button onClick={()=>setWg(!wg)} style={{background:"none",border:"none",color:C.info,fontSize:"10px",cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif",textDecoration:"underline"}}>{wg?"닫기":"측정법"}</button></div>{wg&&<div style={{background:C.bg,borderRadius:"8px",padding:"10px",marginBottom:"8px",fontSize:"11px",color:C.tm,lineHeight:1.5,whiteSpace:"pre-line"}}>{WG}</div>}<Fd label="허리둘레(cm)"><input type="number" value={d.waist||""} onChange={e=>u("waist",e.target.value)} style={bi}/></Fd><Btn onClick={()=>onSave({...d,id:d.id||gid()})} style={{width:"100%"}}>저장</Btn></div></div>;}

function GoalsForm({client,onSave,onClose,isClient}){const[g,setG]=useState(client.gender||"");const[age,setAge]=useState(client.age||"");const[go,setGo]=useState(client.goals||{targetWeight:"",targetFatPct:"",targetMuscle:""});const[n,setN]=useState(client.notes||{injuries:"",surgery:"",conditions:"",experience:""});
return <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"16px"}} onClick={onClose}><div style={{background:C.card,borderRadius:"20px",padding:"24px",width:"100%",maxWidth:"500px",maxHeight:"85vh",overflowY:"auto",border:`1px solid ${C.border}`}} onClick={e=>e.stopPropagation()}><div style={{display:"flex",justifyContent:"space-between",marginBottom:"12px"}}><span style={{fontSize:"17px",fontWeight:800}}>{isClient?"내 정보 수정":"회원 정보 수정"}</span><Btn variant="ghost" onClick={onClose}>✕</Btn></div>
<div style={{fontSize:"12px",fontWeight:700,color:C.accent,marginBottom:"8px"}}>기본 정보</div><div style={{display:"flex",gap:"8px",marginBottom:"10px"}}>{[["male","남성"],["female","여성"]].map(([v,l])=><button key={v} onClick={()=>setG(v)} style={{flex:1,padding:"10px",borderRadius:"10px",border:"none",fontSize:"14px",fontWeight:600,cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif",background:g===v?C.ag:C.bg,color:g===v?C.accent:C.td}}>{l}</button>)}</div><Fd label="나이"><input value={age} type="number" onChange={e=>setAge(e.target.value)} style={bi}/></Fd>
<div style={{fontSize:"12px",fontWeight:700,color:C.accent,margin:"12px 0 8px"}}>목표</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"6px"}}><Fd label="체중(kg)"><input value={go.targetWeight} type="number" onChange={e=>setGo({...go,targetWeight:e.target.value})} style={bi}/></Fd><Fd label="체지방(%)"><input value={go.targetFatPct} type="number" onChange={e=>setGo({...go,targetFatPct:e.target.value})} style={bi}/></Fd><Fd label="골격근(kg)"><input value={go.targetMuscle} type="number" onChange={e=>setGo({...go,targetMuscle:e.target.value})} style={bi}/></Fd></div>
<div style={{fontSize:"12px",fontWeight:700,color:C.accent,margin:"12px 0 8px"}}>특이사항</div><Fd label="부상/아픈곳"><textarea value={n.injuries} onChange={e=>setN({...n,injuries:e.target.value})} style={{...bi,minHeight:"40px",resize:"vertical"}}/></Fd><Fd label="수술이력"><textarea value={n.surgery} onChange={e=>setN({...n,surgery:e.target.value})} style={{...bi,minHeight:"36px",resize:"vertical"}}/></Fd><Fd label="기타"><textarea value={n.conditions} onChange={e=>setN({...n,conditions:e.target.value})} style={{...bi,minHeight:"36px",resize:"vertical"}}/></Fd><Fd label="운동경력"><input value={n.experience} onChange={e=>setN({...n,experience:e.target.value})} style={bi}/></Fd>
<Btn onClick={()=>onSave(g,Number(age)||"",go,n)} style={{width:"100%"}}>저장</Btn></div></div>;}

function InbodyView({client,isTrainer,onEdit,onAddRecord}){const hist=(client.inbodyHistory||[]).sort((a,b)=>a.date.localeCompare(b.date));const lat=hist.length?hist[hist.length-1]:null;const go=client.goals||{};const gd=client.gender;const ht=lat?Number(lat.height):0;const[sh,setSh]=useState(false);
const gi=(l,t,c,u,hb)=>{if(!t||!c)return null;const tn=Number(t),cn=Number(c),done=hb?cn>=tn:cn<=tn;const rm=hb?(tn>cn?`+${(tn-cn).toFixed(1)}${u}`:"달성!"):(tn<cn?`-${(cn-tn).toFixed(1)}${u}`:"달성!");return <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 10px",background:C.bg,borderRadius:"7px",marginBottom:"3px"}}><div><div style={{fontSize:"9px",color:C.td}}>{l}</div><div style={{fontSize:"12px",fontWeight:700}}>현재{c}{u}→목표{t}{u}</div></div><BG color={done?C.success:C.warn}>{rm}</BG></div>;};
return <><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px",flexWrap:"wrap",gap:"6px"}}><span style={{fontSize:"17px",fontWeight:800}}>{isTrainer?"인바디":"내 건강"}</span><div style={{display:"flex",gap:"6px"}}><Btn onClick={onAddRecord} style={{padding:"8px 12px",fontSize:"11px"}}>+인바디</Btn><Btn variant="secondary" onClick={onEdit} style={{padding:"8px 12px",fontSize:"11px"}}>{isTrainer?"정보수정":"목표수정"}</Btn></div></div>
{(go.targetWeight||go.targetFatPct||go.targetMuscle)&&lat&&<div style={{background:C.card,borderRadius:"12px",padding:"14px",marginBottom:"8px",border:`1px solid ${C.border}`}}><div style={{fontSize:"12px",fontWeight:700,color:C.accent,marginBottom:"6px"}}>목표 달성</div>{gi("체중",go.targetWeight,lat.weight,"kg",false)}{gi("체지방률",go.targetFatPct,lat.fatPct,"%",false)}{gi("골격근량",go.targetMuscle,lat.muscle,"kg",true)}</div>}
{lat?<div style={{background:C.card,borderRadius:"12px",padding:"14px",marginBottom:"8px",border:`1px solid ${C.border}`}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:"8px"}}><span style={{fontSize:"12px",fontWeight:700,color:C.accent}}>최근 인바디</span><div style={{display:"flex",gap:"6px"}}>{lat.score&&<BG color={C.info}>점수{lat.score}</BG>}<span style={{fontSize:"10px",color:C.td}}>{lat.date}</span></div></div>
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(70px,1fr))",gap:"4px"}}><Stat label="키" value={lat.height} unit="cm"/><Stat label="체중" value={lat.weight} unit="kg" comparison={cmpV(Number(lat.weight),getA(gd,ht,"weight"),"kg",false)}/><Stat label="골격근" value={lat.muscle} unit="kg" comparison={cmpV(Number(lat.muscle),getA(gd,ht,"muscle"),"kg",true)}/><Stat label="체지방률" value={lat.fatPct} unit="%" comparison={cmpV(Number(lat.fatPct),getA(gd,ht,"fatPct"),"%",false)}/><Stat label="체지방량" value={lat.fatMass} unit="kg"/><Stat label="체수분" value={lat.bodyWater} unit="L"/></div>
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(70px,1fr))",gap:"4px",marginTop:"4px"}}><Stat label="BMI" value={calcBMI(lat.weight,lat.height)} unit="" badge={bmiB(calcBMI(lat.weight,lat.height))}/><Stat label="단백질" value={lat.protein} unit="kg"/><Stat label="기초대사량" value={lat.bmr} unit="kcal"/><Stat label="내장지방" value={lat.visceralFat} unit="lv" badge={vfB(lat.visceralFat)}/><Stat label="허리둘레" value={lat.waist} unit="cm" badge={waistB(lat.waist,gd)}/></div>
</div>:<div style={{background:C.card,borderRadius:"12px",padding:"30px",textAlign:"center",color:C.td,marginBottom:"8px",border:`1px solid ${C.border}`}}>인바디 기록이 없습니다</div>}
{hist.length>=2&&(()=>{const hb=hist.map(r=>({...r,bmi:calcBMI(r.weight,r.height)||0}));return <div style={{background:C.card,borderRadius:"12px",padding:"14px",marginBottom:"8px",border:`1px solid ${C.border}`}}><div style={{fontSize:"12px",fontWeight:700,color:C.accent,marginBottom:"6px"}}>변화 추이</div><MiniTrend data={hist} field="weight" label="체중" color={C.warn}/><MiniTrend data={hist} field="muscle" label="골격근" color={C.success}/><MiniTrend data={hist} field="fatPct" label="체지방률" color={C.danger}/><MiniTrend data={hist} field="fatMass" label="체지방량" color="#FB7185"/><MiniTrend data={hb} field="bmi" label="BMI" color="#A78BFA"/><MiniTrend data={hist} field="waist" label="허리둘레" color="#FB923C"/></div>;})()}
{hist.length>1&&<div style={{background:C.card,borderRadius:"12px",padding:"10px 14px",marginBottom:"8px",border:`1px solid ${C.border}`}}><div style={{display:"flex",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setSh(!sh)}><span style={{fontSize:"11px",fontWeight:700,color:C.tm}}>측정이력({hist.length})</span><span style={{fontSize:"10px",color:C.td}}>{sh?"▲":"▼"}</span></div>{sh&&<div style={{marginTop:"6px"}}>{[...hist].reverse().map((r,i)=><div key={r.id} style={{display:"flex",gap:"6px",padding:"4px",background:i%2===0?C.bg:"transparent",borderRadius:"4px",fontSize:"10px",flexWrap:"wrap"}}><span style={{fontWeight:700,color:C.accent}}>{r.date}</span><span style={{color:C.tm}}>체중{r.weight}kg</span><span style={{color:C.tm}}>골격근{r.muscle}kg</span><span style={{color:C.tm}}>체지방{r.fatPct}%</span></div>)}</div>}</div>}
{client.notes&&<div style={{background:C.card,borderRadius:"12px",padding:"14px",border:`1px solid ${C.border}`}}><div style={{fontSize:"12px",fontWeight:700,color:C.accent,marginBottom:"8px"}}>특이사항</div>{[["부상",client.notes.injuries],["수술",client.notes.surgery],["컨디션",client.notes.conditions],["경력",client.notes.experience]].map(([l,v],i)=><div key={i} style={{marginBottom:"6px"}}><div style={{fontSize:"9px",fontWeight:600,color:C.td}}>{l}</div><div style={{fontSize:"11px",color:C.text}}>{v||"-"}</div></div>)}</div>}
</>;}

function ExPk({presets,onSelect,onClose,onNew}) {
  const [s,setS]=useState("");const [cat,setCat]=useState("하체");const [detail,setDetail]=useState(null);
  const cats=["하체","가슴","등","어깨","팔","복근","기타"];
  const f=presets.filter(p=>(cat==="전체"||p.category===cat)&&(!s||p.name.toLowerCase().includes(s.toLowerCase())));
  return <><div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:1100}} onClick={onClose}><div style={{background:C.card,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:"600px",maxHeight:"75vh",display:"flex",flexDirection:"column",border:`1px solid ${C.border}`}} onClick={e=>e.stopPropagation()}>
  <div style={{padding:"12px 18px 8px",borderBottom:`1px solid ${C.border}`}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}><span style={{fontSize:"15px",fontWeight:800}}>운동 선택</span><Btn variant="ghost" onClick={onClose}>✕</Btn></div><input placeholder="검색" value={s} onChange={e=>setS(e.target.value)} style={{...bi,marginBottom:"6px"}}/><div style={{display:"flex",gap:"3px",flexWrap:"wrap"}}>{cats.map(c=><button key={c} onClick={()=>setCat(c)} style={{padding:"4px 10px",borderRadius:"14px",border:"none",fontSize:"10px",fontWeight:600,cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif",background:cat===c?C.ag:C.bg,color:cat===c?C.accent:C.td}}>{c}</button>)}</div></div>
  <div style={{overflowY:"auto",flex:1,padding:"8px 18px"}}>{f.map(p=><div key={p.id} style={{display:"flex",alignItems:"center",gap:"8px",padding:"8px",borderRadius:"8px",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background=C.cardAlt} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
    <div onClick={()=>onSelect(p)} style={{display:"flex",alignItems:"center",gap:"8px",flex:1}}>
      {p.photo?<img src={p.photo} alt="" style={{width:36,height:36,borderRadius:"5px",objectFit:"cover"}}/>:<div style={{width:36,height:36,borderRadius:"5px",background:C.ag,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px"}}>🏋️</div>}
      <div><div style={{fontSize:"12px",fontWeight:600}}>{p.name}</div><div style={{fontSize:"9px",color:C.td}}>{p.category}</div></div>
    </div>
    {(p.photo||p.youtube)&&<button onClick={(e)=>{e.stopPropagation();setDetail(p);}} style={{background:"none",border:"none",color:C.info,fontSize:"10px",cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif"}}>상세</button>}
  </div>)}</div>
  <div style={{padding:"8px 18px 14px",borderTop:`1px solid ${C.border}`}}><Btn variant="secondary" style={{width:"100%",borderStyle:"dashed"}} onClick={onNew}>+ 직접 입력</Btn></div>
  </div></div>{detail&&<ExDetailModal preset={detail} onClose={()=>setDetail(null)}/>}</>;
}

function SesDet({session,presets,isClient,onSaveClientMemo}){
  const [editing,setEditing]=useState(false);const [memo,setMemo]=useState(session.clientMemo||"");const [detail,setDetail]=useState(null);
  const getP=ex=>presets?.find(pr=>pr.id===ex.presetId)||presets?.find(pr=>pr.name===ex.name);
  return <div style={{background:C.card,borderRadius:"12px",padding:"14px",marginBottom:"8px",border:`1px solid ${C.border}`}}>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:"8px"}}><span style={{fontSize:"13px",fontWeight:700}}>{session.date}</span><div style={{display:"flex",gap:"6px"}}>{session.quickCheck&&<BG color={C.warn}>빠른체크</BG>}<BG color={C.info}>{session.exercises.length}종목</BG></div></div>
    {session.exercises.length===0&&session.quickCheck&&<div style={{background:C.bg,borderRadius:"8px",padding:"10px",fontSize:"11px",color:C.td,marginBottom:"4px"}}>운동 상세 입력 없이 PT 출석만 빠르게 기록한 항목입니다.</div>}
    {session.exercises.map((ex,i)=>{const p=getP(ex);return <div key={i} style={{background:C.bg,borderRadius:"8px",padding:"8px",marginBottom:"4px"}}>
      <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"4px"}}>
        {p?.photo?<img src={p.photo} alt="" style={{width:24,height:24,borderRadius:"4px",objectFit:"cover",cursor:"pointer"}} onClick={()=>setDetail(p)}/>:null}
        <span style={{fontWeight:700,fontSize:"12px",flex:1,cursor:p?"pointer":"default"}} onClick={()=>p&&setDetail(p)}>{ex.name}</span>
        {ex.equipNote&&<span style={{fontSize:"8px",color:C.accent,background:C.ag,padding:"1px 6px",borderRadius:"4px"}}>⚙{ex.equipNote}</span>}
      </div>
      <div style={{display:"flex",gap:"3px",flexWrap:"wrap"}}>{ex.sets.map((s,j)=><span key={j} style={{padding:"2px 6px",background:C.card,borderRadius:"4px",fontSize:"10px",color:C.tm}}>{j+1}세트 {s.weight}kg×{s.reps}회</span>)}</div>
    </div>;})}
    {session.trainerMemo&&<div style={{marginTop:"6px",padding:"6px 10px",background:C.ag,borderRadius:"6px",fontSize:"11px",color:C.tm,borderLeft:`3px solid ${C.accent}`}}><span style={{fontWeight:600,color:C.accent,fontSize:"9px"}}>트레이너 메모</span><div style={{marginTop:"1px"}}>{session.trainerMemo}</div></div>}
    <div style={{marginTop:"6px"}}>
      {editing ? (
        <div style={{background:C.bg,borderRadius:"8px",padding:"8px"}}>
          <textarea value={memo} onChange={e=>setMemo(e.target.value)} style={{...bi,minHeight:"40px",resize:"vertical",fontSize:"12px"}} placeholder="수업 후기나 느낀 점을 적어보세요"/>
          <div style={{display:"flex",gap:"6px",marginTop:"6px"}}><Btn onClick={()=>{onSaveClientMemo&&onSaveClientMemo(session.id,memo);setEditing(false);}} style={{flex:1,padding:"7px",fontSize:"11px"}}>저장</Btn><Btn variant="secondary" onClick={()=>setEditing(false)} style={{padding:"7px",fontSize:"11px"}}>취소</Btn></div>
        </div>
      ) : session.clientMemo ? (
        <div style={{padding:"6px 10px",background:C.bg,borderRadius:"6px",fontSize:"11px",color:C.tm,borderLeft:`3px solid ${C.info}`}}>
          <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:600,color:C.info,fontSize:"9px"}}>회원 메모</span>{isClient&&<button onClick={(e)=>{e.stopPropagation();setEditing(true);}} style={{background:"none",border:"none",color:C.info,fontSize:"9px",cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif"}}>수정</button>}</div>
          <div style={{marginTop:"1px"}}>{session.clientMemo}</div>
        </div>
      ) : (isClient||onSaveClientMemo) ? (
        <button onClick={()=>setEditing(true)} style={{width:"100%",padding:"6px",background:C.bg,borderRadius:"6px",border:`1px dashed ${C.border}`,color:C.td,fontSize:"10px",cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif"}}>
          ✏️ 수업 후기 작성하기
        </button>
      ) : null}
    </div>
    {detail&&<ExDetailModal preset={detail} onClose={()=>setDetail(null)}/>}
  </div>;
}

function SesForm({presets,session,onSave,onClose}){
  const [date,setDate]=useState(session?.date||new Date().toISOString().split("T")[0]);
  const [exs,setExs]=useState(session?.exercises?.map(e=>({...e}))||[]);
  const [memo,setMemo]=useState(session?.trainerMemo||"");
  const [sp,setSp]=useState(false);const [man,setMan]=useState(false);const [mn,setMn]=useState("");
  const [currentCategory,setCurrentCategory]=useState("하체");
  return <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"16px"}} onClick={onClose}><div style={{background:C.card,borderRadius:"20px",padding:"22px",width:"100%",maxWidth:"600px",maxHeight:"85vh",overflowY:"auto",border:`1px solid ${C.border}`}} onClick={e=>e.stopPropagation()}>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:"12px"}}><span style={{fontSize:"15px",fontWeight:800}}>{session?"수정":"새 수업 기록"}</span><Btn variant="ghost" onClick={onClose}>✕</Btn></div>
    <Fd label="날짜"><input type="date" value={date} onChange={e=>setDate(e.target.value)} style={bi}/></Fd>

    <div style={{ marginBottom: "12px" }}>
      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "8px" }}>
        {Object.keys(EXERCISE_DB).map((cat) => (
          <button key={cat} onClick={() => setCurrentCategory(cat)} style={{padding:"5px 12px",borderRadius:"16px",border:"none",fontSize:"10px",fontWeight:600,cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif",background:currentCategory===cat?C.ag:C.bg,color:currentCategory===cat?C.accent:C.td}}>
            {cat}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
        {(EXERCISE_DB[currentCategory] || []).map((ex) => (
          <button key={ex} onClick={() => { setExs([...exs,{name:ex,presetId:presets.find(p=>p.name===ex)?.id||"",sets:[{weight:"",reps:""}],equipNote:""}]); }} style={{padding:"4px 10px",borderRadius:"14px",border:`1px solid ${C.border}`,fontSize:"10px",background:C.card,color:C.text,cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif"}}>
            {ex}
          </button>
        ))}
      </div>
    </div>

    {exs.map((ex,i)=><div key={i} style={{background:C.bg,borderRadius:"10px",padding:"10px",marginBottom:"6px"}}><div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"6px"}}><span style={{flex:1,fontWeight:700,fontSize:"12px"}}>{ex.name}</span><Btn variant="danger" onClick={()=>setExs(exs.filter((_,j)=>j!==i))} style={{padding:"3px 6px"}}>삭제</Btn></div><Fd label="장비 세팅"><input placeholder="의자 높이 등" value={ex.equipNote} onChange={e=>{const c=[...exs];c[i]={...c[i],equipNote:e.target.value};setExs(c);}} style={bi}/></Fd><div style={{fontSize:"9px",fontWeight:600,color:C.td,marginBottom:"3px"}}>세트</div>{ex.sets.map((s,j)=><div key={j} style={{display:"flex",gap:"4px",marginBottom:"3px",alignItems:"center"}}><span style={{fontSize:"10px",color:C.td,width:"18px"}}>{j+1}</span><input placeholder="kg" value={s.weight} type="number" onChange={e=>{const c=[...exs];c[i].sets=[...c[i].sets];c[i].sets[j]={...c[i].sets[j],weight:e.target.value};setExs(c);}} style={{...bi,padding:"8px",flex:1}}/><input placeholder="회" value={s.reps} type="number" onChange={e=>{const c=[...exs];c[i].sets=[...c[i].sets];c[i].sets[j]={...c[i].sets[j],reps:e.target.value};setExs(c);}} style={{...bi,padding:"8px",flex:1}}/>{ex.sets.length>1&&<Btn variant="danger" onClick={()=>{const c=[...exs];c[i].sets=c[i].sets.filter((_,k)=>k!==j);setExs(c);}} style={{padding:"3px 5px"}}>−</Btn>}</div>)}<Btn variant="ghost" onClick={()=>{const c=[...exs];c[i].sets=[...c[i].sets,{weight:"",reps:""}];setExs(c);}} style={{fontSize:"10px"}}>+세트</Btn></div>)}

    <Btn variant="secondary" style={{width:"100%",marginBottom:"10px",borderStyle:"dashed"}} onClick={()=>setSp(true)}>+ 운동 추가</Btn>
    <Fd label="트레이너 메모"><textarea value={memo} onChange={e=>setMemo(e.target.value)} style={{...bi,resize:"vertical",minHeight:"50px"}}/></Fd>
    <Btn onClick={()=>{onSave({id:session?.id||gid(),date,exercises:exs.filter(e=>e.name.trim()).map(e=>({...e,sets:e.sets.map(s=>({weight:Number(s.weight)||0,reps:Number(s.reps)||0}))})),trainerMemo:memo,clientMemo:session?.clientMemo||"",quickCheck:session?.quickCheck||false});}} style={{width:"100%"}}>저장</Btn>

    {sp&&!man&&<ExPk presets={presets||[]} onSelect={p=>{setExs([...exs,{name:p.name,presetId:p.id,sets:[{weight:"",reps:""}],equipNote:""}]);setSp(false);}} onClose={()=>setSp(false)} onNew={()=>setMan(true)}/>}
    {man&&<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1200,padding:"20px"}} onClick={()=>setMan(false)}><div style={{background:C.card,borderRadius:"14px",padding:"18px",width:"100%",maxWidth:"340px",border:`1px solid ${C.border}`}} onClick={e=>e.stopPropagation()}><span style={{fontSize:"14px",fontWeight:700}}>직접 입력</span><input value={mn} onChange={e=>setMn(e.target.value)} placeholder="운동 이름" style={{...bi,marginTop:"8px"}} onKeyDown={e=>{if(e.key==="Enter"&&mn.trim()){setExs([...exs,{name:mn.trim(),sets:[{weight:"",reps:""}],equipNote:""}]);setMn("");setMan(false);setSp(false);}}}/><div style={{display:"flex",gap:"6px",marginTop:"8px"}}><Btn onClick={()=>{if(mn.trim()){setExs([...exs,{name:mn.trim(),sets:[{weight:"",reps:""}],equipNote:""}]);setMn("");setMan(false);setSp(false);}}} style={{flex:1}}>추가</Btn><Btn variant="secondary" onClick={()=>setMan(false)}>취소</Btn></div></div></div>}
  </div></div>;
}

function AddCl({onSave,onClose,pins}){const[n,setN]=useState("");const[ph,setPh]=useState("");const[pin,setPin]=useState("");const dup=pin&&pins.includes(pin);
return <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"20px"}} onClick={onClose}><div style={{background:C.card,borderRadius:"20px",padding:"22px",width:"100%",maxWidth:"380px",border:`1px solid ${C.border}`}} onClick={e=>e.stopPropagation()}><div style={{fontSize:"16px",fontWeight:800,marginBottom:"12px"}}>새 회원</div><Fd label="이름"><input value={n} onChange={e=>setN(e.target.value)} style={bi}/></Fd><Fd label="연락처"><input value={ph} onChange={e=>setPh(e.target.value)} style={bi} placeholder="010-0000-0000"/></Fd><Fd label="PIN(4자리)"><input value={pin} onChange={e=>setPin(e.target.value)} style={bi} maxLength={4}/></Fd>{dup&&<div style={{color:C.danger,fontSize:"10px",marginBottom:"4px"}}>이미 사용 중</div>}<Btn onClick={()=>{if(n.trim()&&pin.length===4&&!dup)onSave({id:gid(),name:n.trim(),phone:ph,pin,gender:"",age:"",goals:{targetWeight:"",targetFatPct:"",targetMuscle:""},notes:{injuries:"",surgery:"",conditions:"",experience:""},pt:{startDate:"",endDate:"",totalSessions:0,baseCompletedSessions:0},attendance:[],inbodyHistory:[],customRoutines:[],sessions:[]});}} style={{width:"100%"}}>등록</Btn></div></div>;}

function PresetMgr({presets,onSave,onClose}){
  const [list,setList]=useState(mergePresetsWithDB(presets||[]));
  const [sa,setSa]=useState(false);
  const [editId,setEditId]=useState(null);
  const [nn,setNn]=useState("");
  const [nc,setNc]=useState("하체");
  const [np,setNp]=useState("");
  const [ny,setNy]=useState("");
  const fr=useRef(null);
  const [detail,setDetail]=useState(null);

  const resetForm = () => {
    setEditId(null);
    setNn("");
    setNc("하체");
    setNp("");
    setNy("");
    setSa(false);
  };

  const startEdit = (preset) => {
    setEditId(preset.id);
    setNn(preset.name || "");
    setNc(preset.category || "하체");
    setNp(preset.photo || "");
    setNy(preset.youtube || "");
    setSa(false);
  };

  const savePreset = () => {
    if(!nn.trim()) return;
    if(editId){
      setList(list.map(x=>x.id===editId?{...x,name:nn.trim(),category:nc,photo:np,youtube:ny}:x));
    } else {
      setList([...list,{id:gid(),name:nn.trim(),category:nc,photo:np,youtube:ny}]);
    }
    resetForm();
  };

  const renderEditor = () => (
    <div style={{background:C.cardAlt,borderRadius:"8px",padding:"12px",margin:"4px 0 8px 34px",border:`1px solid ${C.border}`}}>
      <Fd label="운동 이름"><input value={nn} onChange={e=>setNn(e.target.value)} style={bi}/></Fd>
      <Fd label="추천 운동 빠른 선택"><div style={{display:"flex",gap:"4px",flexWrap:"wrap"}}>{(EXERCISE_DB[nc]||[]).map(ex=><button key={ex} onClick={()=>setNn(ex)} style={{padding:"4px 10px",borderRadius:"14px",border:`1px solid ${C.border}`,fontSize:"10px",background:nn===ex?C.ag:C.card,color:nn===ex?C.accent:C.text,cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif"}}>{ex}</button>)}</div></Fd>
      <Fd label="카테고리"><div style={{display:"flex",gap:"3px",flexWrap:"wrap"}}>{["하체","가슴","등","어깨","팔","복근","기타"].map(c=><button key={c} onClick={()=>setNc(c)} style={{padding:"4px 10px",borderRadius:"14px",border:"none",fontSize:"10px",fontWeight:600,cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif",background:nc===c?C.ag:C.card,color:nc===c?C.accent:C.td}}>{c}</button>)}</div></Fd>
      <Fd label="기구 사진 (선택)"><div style={{display:"flex",gap:"6px",alignItems:"center",flexWrap:"wrap"}}>{np&&<img src={np} alt="" style={{width:36,height:36,borderRadius:"5px",objectFit:"cover"}}/>}<input type="file" accept="image/*" ref={fr} onChange={e=>{const f=e.target.files?.[0];if(f){const r=new FileReader();r.onload=ev=>setNp(ev.target.result);r.readAsDataURL(f);}}} style={{display:"none"}}/><Btn variant="secondary" onClick={()=>fr.current?.click()} style={{fontSize:"10px",padding:"5px 10px"}}>{np?"변경":"사진 추가"}</Btn>{np&&<Btn variant="ghost" onClick={()=>setNp("")} style={{fontSize:"10px",padding:"5px 8px"}}>제거</Btn>}</div></Fd>
      <Fd label="유튜브 링크 (선택)"><input value={ny} onChange={e=>setNy(e.target.value)} style={bi} placeholder="https://youtube.com/..."/></Fd>
      <div style={{display:"flex",gap:"6px"}}><Btn onClick={savePreset} style={{flex:1}}>{editId?"수정 저장":"추가"}</Btn><Btn variant="secondary" onClick={resetForm}>취소</Btn></div>
    </div>
  );

  return <>
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"16px"}} onClick={onClose}>
      <div style={{background:C.card,borderRadius:"20px",padding:"22px",width:"100%",maxWidth:"560px",maxHeight:"85vh",overflowY:"auto",border:`1px solid ${C.border}`}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:"10px"}}><span style={{fontSize:"15px",fontWeight:800}}>종목 관리</span><Btn variant="ghost" onClick={onClose}>✕</Btn></div>
        <div style={{fontSize:"10px",color:C.td,marginBottom:"10px"}}>기구 사진과 유튜브 영상 링크를 등록하면 회원님들이 확인할 수 있어요</div>

        {list.map(p=><div key={p.id}>
          <div style={{display:"flex",alignItems:"center",gap:"6px",padding:"6px",background:C.bg,borderRadius:"6px",marginBottom:"3px"}}>
            {p.photo?<img src={p.photo} alt="" style={{width:28,height:28,borderRadius:"4px",objectFit:"cover",cursor:"pointer"}} onClick={()=>setDetail(p)}/>:<div style={{width:28,height:28,borderRadius:"4px",background:C.ag,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px"}}>🏋️</div>}
            <div style={{flex:1,cursor:"pointer"}} onClick={()=>setDetail(p)}><div style={{fontSize:"11px",fontWeight:600}}>{p.name}</div><div style={{fontSize:"8px",color:C.td}}>{p.category}{p.youtube?" · 📹":""}</div></div>
            <Btn variant="ghost" onClick={()=>editId===p.id?resetForm():startEdit(p)} style={{padding:"3px 6px",fontSize:"10px",color:C.info}}>{editId===p.id?"닫기":"수정"}</Btn>
            <Btn variant="danger" onClick={()=>{setList(list.filter(x=>x.id!==p.id)); if(editId===p.id) resetForm();}} style={{padding:"3px 6px"}}>삭제</Btn>
          </div>
          {editId===p.id && renderEditor()}
        </div>)}

        {sa ? renderEditor() : <Btn variant="secondary" style={{width:"100%",marginTop:"8px",borderStyle:"dashed"}} onClick={()=>{resetForm();setSa(true);}}>+ 새 운동</Btn>}

        <Btn onClick={()=>onSave(mergePresetsWithDB(list))} style={{width:"100%",marginTop:"12px"}}>저장</Btn>
      </div>
    </div>
    {detail && <ExDetailModal preset={detail} onClose={() => setDetail(null)} />}
  </>;
}

function RtView({client,presets,isTrainer,onSaveCustom,onDeleteCustom}){
  const auto=genRt(client,presets)||[];
  const custom=client.customRoutines||[];
  const [at,setAt]=useState(auto[0]?.type || (custom[0]?`custom-${custom[0].id}`:""));
  const [showCR,setShowCR]=useState(false);const [editCR,setEditCR]=useState(null);
  const allR=[...auto,...custom.map(r=>({...r,type:`custom-${r.id}`}))];
  const active=allR.find(r=>r.type===(at||allR[0]?.type))||allR[0];
  if(!allR.length&&!isTrainer) return <div style={{textAlign:"center",padding:"50px",color:C.td}}><div style={{fontSize:"40px",marginBottom:"10px"}}>📝</div>수업 기록이 쌓이면 루틴이 생성됩니다</div>;
  return <>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"}}><span style={{fontSize:"17px",fontWeight:800}}>복습 루틴</span>{isTrainer&&<Btn onClick={()=>{setEditCR(null);setShowCR(true);}} style={{padding:"7px 12px",fontSize:"11px"}}>+루틴 만들기</Btn>}</div>
    <div style={{fontSize:"10px",color:C.td,marginBottom:"10px"}}>자동 생성 루틴은 수업 시 80% 무게 추천</div>
    {allR.length>0&&<>
      <div style={{display:"flex",gap:"3px",marginBottom:"10px",flexWrap:"wrap"}}>{allR.map(r=><button key={r.type} onClick={()=>setAt(r.type)} style={{padding:"6px 12px",borderRadius:"16px",border:"none",fontSize:"10px",fontWeight:600,cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif",background:(at||allR[0]?.type)===r.type?C.ag:C.bg,color:(at||allR[0]?.type)===r.type?C.accent:C.td}}>{r.title}</button>)}</div>
      {active&&<>
        {active.desc&&<div style={{fontSize:"10px",color:C.td,marginBottom:"8px"}}>{active.desc}</div>}
        {active.days.map((d,i)=><div key={i} style={{background:C.card,borderRadius:"12px",padding:"12px",marginBottom:"6px",border:`1px solid ${C.border}`}}><div style={{fontSize:"12px",fontWeight:700,color:C.accent,marginBottom:"6px"}}>{d.title}</div>{d.exercises.map((ex,j)=><div key={j} style={{display:"flex",justifyContent:"space-between",padding:"6px 8px",background:C.bg,borderRadius:"6px",marginBottom:"3px"}}><span style={{fontWeight:600,fontSize:"11px"}}>{ex.name}</span><span style={{fontSize:"10px",color:C.accent,fontWeight:600}}>{ex.rec||`${ex.sets}세트×${ex.reps}회`}{ex.note?` (${ex.note})`:""}</span></div>)}</div>)}
        {isTrainer&&active.type?.startsWith("custom-")&&<div style={{display:"flex",gap:"6px",marginTop:"4px"}}><Btn variant="ghost" onClick={()=>{const cr=custom.find(r=>`custom-${r.id}`===active.type);setEditCR(cr);setShowCR(true);}}>수정</Btn><Btn variant="danger" onClick={()=>{const crId=active.type.replace("custom-","");onDeleteCustom(crId);setAt(auto[0]?.type||"");}}>삭제</Btn></div>}
      </>}
    </>}
    {showCR&&<CustomRoutineForm routine={editCR} onSave={r=>{onSaveCustom(r);setShowCR(false);setAt(`custom-${r.id}`);}} onClose={()=>setShowCR(false)}/>}
  </>;
}

const trTabs=[["sessions","수업"],["routine","루틴"],["info","인바디"],["attend","출석"]];
const clTabs=[["sessions","수업"],["routine","루틴"],["info","내 건강"],["attend","출석"]];

function TrainerSecurityModal({trainer,onSave,onClose}){
  const [loginId,setLoginId]=useState(trainer?.loginId||"hyungmin");
  const [password,setPassword]=useState(trainer?.password||"");
  const [confirmPassword,setConfirmPassword]=useState(trainer?.password||"");
  const [err,setErr]=useState("");
  const validate = () => {
    if(!loginId.trim()) return "아이디를 입력해주세요.";
    if(password.length < 10) return "비밀번호는 10자 이상으로 설정해주세요.";
    if(!/[A-Za-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) return "영문, 숫자, 특수문자를 모두 포함해주세요.";
    if(password !== confirmPassword) return "비밀번호 확인이 일치하지 않습니다.";
    return "";
  };
  return <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1200,padding:"20px"}} onClick={onClose}>
    <div style={{background:C.card,borderRadius:"20px",padding:"24px",width:"100%",maxWidth:"420px",border:`1px solid ${C.border}`}} onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}}><span style={{fontSize:"16px",fontWeight:800}}>트레이너 보안 설정</span><Btn variant="ghost" onClick={onClose}>✕</Btn></div>
      <div style={{fontSize:"11px",color:C.td,marginBottom:"12px",lineHeight:1.5}}>로컬 저장 방식이라 완전한 보안은 아닙니다. 그래도 PIN보다 훨씬 강한 로그인 방식으로 보호할 수 있어요.</div>
      <Fd label="트레이너 아이디"><input value={loginId} onChange={e=>setLoginId(e.target.value)} style={bi} placeholder="예: hyungmin.vangofit" /></Fd>
      <Fd label="새 비밀번호"><input type="password" value={password} onChange={e=>setPassword(e.target.value)} style={bi} placeholder="영문+숫자+특수문자 포함 10자 이상" /></Fd>
      <Fd label="비밀번호 확인"><input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} style={bi} /></Fd>
      {err&&<div style={{color:C.danger,fontSize:"11px",marginBottom:"10px"}}>{err}</div>}
      <Btn onClick={()=>{const msg=validate(); if(msg){setErr(msg); return;} onSave({loginId:loginId.trim(),password,failedAttempts:0,lockUntil:0});}} style={{width:"100%"}}>저장</Btn>
    </div>
  </div>;
}

function Trainer({data,setData,onLogout,syncStatus}){
  const [sel,setSel]=useState(null);const [tab,setTab]=useState("sessions");
  const [showSF,setShowSF]=useState(false);const [editS,setEditS]=useState(null);
  const [showGF,setShowGF]=useState(false);const [showAC,setShowAC]=useState(false);const [showPM,setShowPM]=useState(false);const [showIBF,setShowIBF]=useState(false);const [showSec,setShowSec]=useState(false);
  const clients = Array.isArray(data?.clients) ? data.clients : [];
  const presets = Array.isArray(data?.presets) ? data.presets : [];
  const cl=sel?clients.find(c=>c.id===sel):null;
  const sv=useCallback(d=>{const migrated=migrateData(d);setData(migrated);localStorage.setItem(SK,JSON.stringify(migrated));},[setData]);

  if(!cl) return <div style={{fontFamily:"'Noto Sans KR',sans-serif",background:C.bg,color:C.text,minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 20px",borderBottom:`1px solid ${C.border}`,background:C.card,flexWrap:"wrap",gap:"6px"}}><div><div style={{fontSize:"10px",color:C.accent,letterSpacing:"2px",fontWeight:600}}>VANGOFIT</div><div style={{fontSize:"16px",fontWeight:800}}>회원 관리</div></div><div style={{display:"flex",gap:"6px",flexWrap:"wrap",alignItems:"center"}}><BG color={syncStatus==="saved"?C.success:syncStatus==="error"?C.danger:syncStatus==="syncing"?C.info:C.warn}>{syncStatus==="saved"?"자동 저장됨":syncStatus==="error"?"저장 실패":syncStatus==="syncing"?"저장 중...":"변경 감지"}</BG><Btn variant="secondary" onClick={async()=>{try{await uploadLocalDataToSupabase(data);alert("Supabase 업로드 완료");}catch(e){console.error(e);alert("업로드 실패: "+(e.message||"알 수 없는 오류"));}}} style={{fontSize:"10px",padding:"6px 10px"}}>Supabase 업로드</Btn><Btn variant="secondary" onClick={()=>setShowPM(true)} style={{fontSize:"10px",padding:"6px 10px"}}>종목관리</Btn><Btn variant="secondary" onClick={()=>setShowSec(true)} style={{fontSize:"10px",padding:"6px 10px"}}>보안설정</Btn><Btn variant="secondary" onClick={onLogout} style={{fontSize:"10px",padding:"6px 10px"}}>로그아웃</Btn></div></div>
    <div style={{padding:"20px",maxWidth:"700px",margin:"0 auto"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:"12px"}}><div style={{display:"flex",gap:"6px",alignItems:"center"}}><span style={{fontSize:"16px",fontWeight:800}}>전체 회원</span><BG>{clients.length}명</BG></div><Btn onClick={()=>setShowAC(true)} style={{padding:"8px 14px",fontSize:"12px"}}>+ 새 회원</Btn></div>
      {clients.map(c=>{const completed=getCompletedSessions(c);const remaining=getRemainingSessions(c);return <div key={c.id} style={{background:C.card,borderRadius:"12px",padding:"12px",border:`1px solid ${C.border}`,cursor:"pointer",marginBottom:"6px"}} onClick={()=>{setSel(c.id);setTab("sessions");}} onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:"13px",fontWeight:700}}>{c.name}</div><div style={{fontSize:"10px",color:C.td}}>{c.phone||"-"}</div></div><div style={{display:"flex",alignItems:"center",gap:"10px"}}><div style={{textAlign:"right"}}><div style={{fontSize:"12px",fontWeight:700,color:C.accent}}>{completed}/{c.pt?.totalSessions||0}</div><div style={{fontSize:"8px",color:C.td}}>PT 진행</div></div><div style={{textAlign:"right"}}><div style={{fontSize:"12px",fontWeight:700,color:C.warn}}>{remaining}</div><div style={{fontSize:"8px",color:C.td}}>남은 횟수</div></div><Btn variant="danger" onClick={e=>{e.stopPropagation();if(confirm("삭제?"))sv({...data,clients:data.clients.filter(x=>x.id!==c.id)});}} style={{padding:"3px 6px"}}>✕</Btn></div></div></div>;})}
    </div>
    {showAC&&<AddCl onSave={nc=>{sv({...data,clients:[...data.clients,nc]});setShowAC(false);}} onClose={()=>setShowAC(false)} pins={clients.map(c=>c.pin)}/>}
    {showPM&&<PresetMgr presets={presets} onSave={p=>{sv({...data,presets:p});setShowPM(false);}} onClose={()=>setShowPM(false)}/>}
    {showSec&&<TrainerSecurityModal trainer={data.trainer} onSave={(trainerPatch)=>{sv({...data,trainer:{...data.trainer,...trainerPatch}});setShowSec(false);}} onClose={()=>setShowSec(false)}/>}
  </div>;

  return <div style={{fontFamily:"'Noto Sans KR',sans-serif",background:C.bg,color:C.text,minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 20px",borderBottom:`1px solid ${C.border}`,background:C.card}}><div style={{display:"flex",alignItems:"center",gap:"10px"}}><Btn variant="secondary" onClick={()=>setSel(null)} style={{padding:"5px 8px"}}>←</Btn><div><div style={{fontSize:"9px",color:C.accent,letterSpacing:"2px",fontWeight:600}}>VANGOFIT</div><div style={{fontSize:"15px",fontWeight:800}}>{cl.name}</div></div></div><Btn variant="secondary" onClick={onLogout} style={{fontSize:"10px",padding:"6px 10px"}}>로그아웃</Btn></div>
    <div style={{display:"flex",gap:"2px",padding:"10px 20px",background:C.card,borderBottom:`1px solid ${C.border}`,overflowX:"auto"}}>{trTabs.map(([k,l])=><button key={k} onClick={()=>setTab(k)} style={{padding:"7px 12px",borderRadius:"10px",border:"none",fontSize:"11px",fontWeight:tab===k?700:500,cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif",whiteSpace:"nowrap",background:tab===k?C.ag:"transparent",color:tab===k?C.accent:C.td}}>{l}</button>)}</div>
    <div style={{padding:"20px",maxWidth:"700px",margin:"0 auto"}}>
      {tab==="sessions"&&<>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px",gap:"8px",flexWrap:"wrap"}}>
          <span style={{fontSize:"16px",fontWeight:800}}>수업 기록</span>
          <div style={{display:"flex",gap:"6px"}}>
            <Btn variant="secondary" onClick={() => {
              const quickSession = {id: gid(),date: new Date().toISOString().split("T")[0],exercises: [],trainerMemo: "빠른 PT 출석 체크",clientMemo: "",quickCheck: true};
              sv({...data,clients:clients.map(c=>c.id!==sel?c:{...c,sessions:[quickSession,...(c.sessions||[])]})});
            }} style={{padding:"8px 12px",fontSize:"12px"}}>빠른 출석 체크</Btn>
            <Btn onClick={()=>{setEditS(null);setShowSF(true);}} style={{padding:"8px 12px",fontSize:"12px"}}>+ 새 기록</Btn>
          </div>
        </div>
        {!cl.sessions.length?<div style={{textAlign:"center",padding:"50px",color:C.td}}>수업 기록이 없습니다</div>:[...cl.sessions].sort((a,b)=>b.date.localeCompare(a.date)).map(s=><div key={s.id}><SesDet session={s} presets={presets} onSaveClientMemo={(sid,m)=>sv({...data,clients:clients.map(c=>c.id!==sel?c:{...c,sessions:c.sessions.map(x=>x.id===sid?{...x,clientMemo:m}:x)})})} /><div style={{display:"flex",gap:"4px",marginTop:"-4px",marginBottom:"6px"}}><Btn variant="ghost" onClick={()=>{setEditS(s);setShowSF(true);}}>수정</Btn><Btn variant="danger" onClick={()=>{if(confirm("삭제?"))sv({...data,clients:clients.map(c=>c.id!==sel?c:{...c,sessions:c.sessions.filter(x=>x.id!==s.id)})});}}>삭제</Btn></div></div>)}
      </>}
      {tab==="routine"&&<RtView client={cl} presets={presets} isTrainer onSaveCustom={r=>sv({...data,clients:clients.map(c=>c.id!==sel?c:{...c,customRoutines:(c.customRoutines||[]).some(x=>x.id===r.id)?(c.customRoutines||[]).map(x=>x.id===r.id?r:x):[...(c.customRoutines||[]),r]})})} onDeleteCustom={id=>sv({...data,clients:clients.map(c=>c.id!==sel?c:{...c,customRoutines:(c.customRoutines||[]).filter(x=>x.id!==id)})})} />}
      {tab==="info"&&<InbodyView client={cl} isTrainer onEdit={()=>setShowGF(true)} onAddRecord={()=>setShowIBF(true)}/>}
      {tab==="attend"&&<AttendanceView client={cl} isTrainer onSave={att=>sv({...data,clients:clients.map(c=>c.id!==sel?c:{...c,attendance:att})})} onSavePT={pt=>sv({...data,clients:clients.map(c=>c.id!==sel?c:{...c,pt})})}/>}
    </div>
    {showSF&&<SesForm presets={presets} session={editS} onSave={s=>{sv({...data,clients:clients.map(c=>c.id!==sel?c:{...c,sessions:c.sessions.find(x=>x.id===s.id)?c.sessions.map(x=>x.id===s.id?s:x):[s,...c.sessions]})});setShowSF(false);setEditS(null);}} onClose={()=>{setShowSF(false);setEditS(null);}}/>}
    {showGF&&<GoalsForm client={cl} onSave={(g,a,go,n)=>{sv({...data,clients:clients.map(c=>c.id!==sel?c:{...c,gender:g,age:a,goals:go,notes:n})});setShowGF(false);}} onClose={()=>setShowGF(false)}/>}
    {showIBF&&<InbodyForm onSave={rec=>{sv({...data,clients:clients.map(c=>c.id!==sel?c:{...c,inbodyHistory:[...(c.inbodyHistory||[]).filter(x=>x.id!==rec.id),rec]})});setShowIBF(false);}} onClose={()=>setShowIBF(false)} title="인바디 기록"/>}
  </div>;
}

function Client({data,setData,clientId,onLogout,syncStatus}){
  const clients = Array.isArray(data?.clients) ? data.clients : [];
  const presets = Array.isArray(data?.presets) ? data.presets : [];
  const cl=clients.find(c=>c.id===clientId);const [tab,setTab]=useState("sessions");const [showIBF,setShowIBF]=useState(false);const [showGF,setShowGF]=useState(false);
  if(!cl) return <div style={{padding:"40px",textAlign:"center",color:C.td}}>회원 정보 없음</div>;
  const sv=d=>{const migrated=migrateData(d);setData(migrated);localStorage.setItem(SK,JSON.stringify(migrated));};
  return <div style={{fontFamily:"'Noto Sans KR',sans-serif",background:C.bg,color:C.text,minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 20px",borderBottom:`1px solid ${C.border}`,background:C.card,gap:"8px",flexWrap:"wrap"}}><div><div style={{fontSize:"9px",color:C.accent,letterSpacing:"2px",fontWeight:600}}>VANGOFIT</div><div style={{fontSize:"15px",fontWeight:800}}>{cl.name}님</div></div><div style={{display:"flex",gap:"6px",alignItems:"center"}}><BG color={syncStatus==="saved"?C.success:syncStatus==="error"?C.danger:syncStatus==="syncing"?C.info:C.warn}>{syncStatus==="saved"?"자동 저장됨":syncStatus==="error"?"저장 실패":syncStatus==="syncing"?"저장 중...":"변경 감지"}</BG><Btn variant="secondary" onClick={onLogout} style={{fontSize:"10px",padding:"6px 10px"}}>로그아웃</Btn></div></div>
    <div style={{display:"flex",gap:"2px",padding:"10px 20px",background:C.card,borderBottom:`1px solid ${C.border}`,overflowX:"auto"}}>{clTabs.map(([k,l])=><button key={k} onClick={()=>setTab(k)} style={{padding:"7px 12px",borderRadius:"10px",border:"none",fontSize:"11px",fontWeight:tab===k?700:500,cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif",whiteSpace:"nowrap",background:tab===k?C.ag:"transparent",color:tab===k?C.accent:C.td}}>{l}</button>)}</div>
    <div style={{padding:"20px",maxWidth:"500px",margin:"0 auto"}}>
      {tab==="sessions"&&<><span style={{fontSize:"16px",fontWeight:800,display:"block",marginBottom:"10px"}}>수업 기록</span>{!cl.sessions.length?<div style={{textAlign:"center",padding:"50px",color:C.td}}>수업 기록이 없습니다</div>:[...cl.sessions].sort((a,b)=>b.date.localeCompare(a.date)).map(s=><SesDet key={s.id} session={s} presets={presets} isClient onSaveClientMemo={(sid,m)=>sv({...data,clients:clients.map(c=>c.id!==clientId?c:{...c,sessions:c.sessions.map(x=>x.id===sid?{...x,clientMemo:m}:x)})})}/>)}</>}
      {tab==="routine"&&<RtView client={cl} presets={presets} />}
      {tab==="info"&&<InbodyView client={cl} onEdit={()=>setShowGF(true)} onAddRecord={()=>setShowIBF(true)}/>}
      {tab==="attend"&&<AttendanceView client={cl} onSave={att=>sv({...data,clients:clients.map(c=>c.id!==clientId?c:{...c,attendance:att})})} onSavePT={()=>{}}/>}
    </div>
    {showIBF&&<InbodyForm onSave={rec=>{sv({...data,clients:clients.map(c=>c.id!==clientId?c:{...c,inbodyHistory:[...(c.inbodyHistory||[]).filter(x=>x.id!==rec.id),rec]})});setShowIBF(false);}} onClose={()=>setShowIBF(false)} title="인바디 기록"/>}
    {showGF&&<GoalsForm client={cl} isClient onSave={(g,a,go,n)=>{sv({...data,clients:clients.map(c=>c.id!==clientId?c:{...c,gender:g,age:a,goals:go,notes:n})});setShowGF(false);}} onClose={()=>setShowGF(false)}/>}
  </div>;
}

function Login({onLogin,data,setData}){
  const [mode,setMode]=useState("select");
  const [pin,setPin]=useState("");
  const [trainerId,setTrainerId]=useState("");
  const [trainerPassword,setTrainerPassword]=useState("");
  const [err,setErr]=useState("");
  const trainer=(data && data.trainer && data.trainer.loginId && data.trainer.password) ? data.trainer : defData.trainer;
  const now=Date.now();
  const locked=!!trainer.lockUntil && now<trainer.lockUntil;
  const remainMin=locked?Math.ceil((trainer.lockUntil-now)/60000):0;

  const failTrainerLogin=()=>{
    const attempts=(trainer.failedAttempts||0)+1;
    const shouldLock=attempts>=5;
    setData(prev=>migrateData({...prev,trainer:{...prev.trainer,failedAttempts:shouldLock?0:attempts,lockUntil:shouldLock?Date.now()+10*60*1000:0}}));
    setErr(shouldLock?"로그인 5회 실패로 10분간 잠겼습니다.":`아이디 또는 비밀번호가 올바르지 않습니다. (${attempts}/5)`);
  };

  const go=t=>{
    if(t==="trainer") {
      if(locked){setErr(`보안을 위해 ${remainMin}분 뒤 다시 시도해주세요.`); return;}
      if(trainerId.trim()===String(trainer.loginId||"") && trainerPassword===String(trainer.password||"")){
        setData(prev=>migrateData({...prev,trainer:{...prev.trainer,failedAttempts:0,lockUntil:0}}));
        onLogin({type:"trainer"});
      } else {
        failTrainerLogin();
      }
    } else {
      const clients = Array.isArray(data?.clients) ? data.clients : [];
      const c=clients.find(c=>String(c.pin)===String(pin));
      if(c) onLogin({type:"client",clientId:c.id});
      else setErr("회원 PIN을 확인해주세요.");
    }
  };

  return <div style={{fontFamily:"'Noto Sans KR',sans-serif",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:"20px",background:`linear-gradient(160deg,${C.bg},#12131A,${C.bg})`,color:C.text}}>
    <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"radial-gradient(ellipse at 25% 15%,rgba(212,168,67,0.05) 0%,transparent 55%)",pointerEvents:"none"}}/>
    <div style={{background:C.card,borderRadius:"20px",padding:"40px 32px",width:"100%",maxWidth:"360px",border:`1px solid ${C.border}`,boxShadow:"0 20px 60px rgba(0,0,0,0.5)"}}>
      <div style={{textAlign:"center",marginBottom:"24px"}}><div style={{fontSize:"28px",fontWeight:900,color:C.accent,letterSpacing:"-1px"}}>VangoFit</div><div style={{fontSize:"11px",color:C.td,marginTop:"4px",letterSpacing:"2px"}}>YOUR BODY, YOUR JOURNEY</div></div>
      <div style={{fontSize:"20px",fontWeight:800,textAlign:"center",marginBottom:"24px"}}>{mode==="select"?"로그인":mode==="trainer"?"트레이너":"회원"}</div>
      {mode==="select"?
        <div style={{display:"flex",flexDirection:"column",gap:"10px"}}><Btn onClick={()=>{setMode("trainer");setErr("");}} style={{width:"100%",padding:"13px"}}>트레이너</Btn><Btn variant="secondary" onClick={()=>{setMode("client");setErr("");}} style={{width:"100%",padding:"13px"}}>회원</Btn></div>
      : mode==="trainer" ? <>
        <input style={{...bi,padding:"13px 16px",marginBottom:"10px"}} value={trainerId} placeholder="트레이너 아이디" onChange={e=>{setTrainerId(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&go("trainer")} />
        <input style={{...bi,padding:"13px 16px",marginBottom:"10px"}} type="password" value={trainerPassword} placeholder="트레이너 비밀번호" onChange={e=>{setTrainerPassword(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&go("trainer")} />
        {locked ? <div style={{color:C.warn,fontSize:"11px",marginBottom:"8px"}}>보안 잠금 상태입니다. {remainMin}분 뒤 다시 시도해주세요.</div> : null}
        {err&&<div style={{color:C.danger,fontSize:"11px",marginBottom:"6px"}}>{err}</div>}
        <Btn onClick={()=>go("trainer")} style={{width:"100%",marginBottom:"8px"}}>로그인</Btn><Btn variant="ghost" onClick={()=>{setMode("select");setErr("");setTrainerId("");setTrainerPassword("");}} style={{width:"100%"}}>← 돌아가기</Btn>
      </> : <>
        <input style={{...bi,padding:"13px 16px",marginBottom:"10px"}} type="password" placeholder="회원 PIN" value={pin} onChange={e=>{setPin(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&go("client")} />
        {err&&<div style={{color:C.danger,fontSize:"11px",marginBottom:"6px"}}>{err}</div>}
        <Btn onClick={()=>go("client")} style={{width:"100%",marginBottom:"8px"}}>로그인</Btn><Btn variant="ghost" onClick={()=>{setMode("select");setErr("");setPin("");}} style={{width:"100%"}}>← 돌아가기</Btn>
      </>}
    </div>
    <div style={{marginTop:"16px",fontSize:"10px",color:C.td}}>안동 · 형민 트레이너</div>
  </div>;
}


async function loadAppDataFromSupabase(){
  const [clientsRes,presetsRes,sessionsRes,attendanceRes,inbodyRes,routinesRes,trainerRes] = await Promise.all([
    supabase.from("clients").select("*").order("created_at",{ascending:true}),
    supabase.from("presets").select("*").order("category",{ascending:true}),
    supabase.from("sessions").select("*").order("session_date",{ascending:false}),
    supabase.from("attendance").select("*").order("attendance_date",{ascending:false}),
    supabase.from("inbody_records").select("*").order("record_date",{ascending:false}),
    supabase.from("custom_routines").select("*").order("created_at",{ascending:false}),
    supabase.from("trainer_settings").select("*").eq("id",1).maybeSingle(),
  ]);
  if(clientsRes.error) throw clientsRes.error;
  if(presetsRes.error) throw presetsRes.error;
  if(sessionsRes.error) throw sessionsRes.error;
  if(attendanceRes.error) throw attendanceRes.error;
  if(inbodyRes.error) throw inbodyRes.error;
  if(routinesRes.error) throw routinesRes.error;
  if(trainerRes.error) throw trainerRes.error;

  const sessionsByClient={};
  (sessionsRes.data||[]).forEach(s=>{
    if(!sessionsByClient[s.client_id]) sessionsByClient[s.client_id]=[];
    sessionsByClient[s.client_id].push({
      id:s.id,date:s.session_date,trainerMemo:s.trainer_memo||"",clientMemo:s.client_memo||"",quickCheck:!!s.quick_check,exercises:Array.isArray(s.exercises)?s.exercises:[]
    });
  });
  const attendanceByClient={};
  (attendanceRes.data||[]).forEach(a=>{
    if(!attendanceByClient[a.client_id]) attendanceByClient[a.client_id]=[];
    attendanceByClient[a.client_id].push({date:a.attendance_date,strength:a.strength||0,cardio:a.cardio||0});
  });
  const inbodyByClient={};
  (inbodyRes.data||[]).forEach(r=>{
    if(!inbodyByClient[r.client_id]) inbodyByClient[r.client_id]=[];
    inbodyByClient[r.client_id].push({id:r.id,date:r.record_date,height:r.height,weight:r.weight,muscle:r.muscle,fatPct:r.fat_pct,fatMass:r.fat_mass,bodyWater:r.body_water,protein:r.protein,bmr:r.bmr,visceralFat:r.visceral_fat,waist:r.waist,score:r.score});
  });

  return migrateData({
    trainer: trainerRes.data ? {loginId: trainerRes.data.username, password: trainerRes.data.password} : undefined,
    presets: (presetsRes.data||[]).map(p=>({id:p.id,name:p.name,category:p.category,photo:p.photo||"",youtube:p.youtube||""})),
    customRoutines: (routinesRes.data||[]).map(r=>({id:r.id,title:r.title,desc:r.description||"",days:r.days||[]})),
    clients: (clientsRes.data||[]).map(c=>({
      id:c.id,name:c.name||"",pin:c.pin||"",phone:c.phone||"",gender:c.gender||"",age:c.age||"",
      goals:{targetWeight:c.goal_target_weight||"",targetFatPct:c.goal_target_fat_pct||"",targetMuscle:c.goal_target_muscle||""},
      notes:{injuries:c.injuries||"",surgery:c.surgery||"",conditions:c.conditions||"",experience:c.experience||""},
      pt:{startDate:c.pt_start_date||"",endDate:c.pt_end_date||"",totalSessions:c.pt_total_sessions||0,baseCompletedSessions:c.pt_base_completed_sessions||0},
      attendance:attendanceByClient[c.id]||[],
      inbodyHistory:inbodyByClient[c.id]||[],
      sessions:sessionsByClient[c.id]||[]
    }))
  });
}

async function uploadLocalDataToSupabase(appData){
  const safe=migrateData(appData);
  const { error: trainerError } = await supabase
    .from("trainer_settings")
    .upsert({id:1,username:safe.trainer.loginId,password:safe.trainer.password},{onConflict:"id"});
  if(trainerError) throw trainerError;

  const clientRows=safe.clients.map(c=>({
    id:c.id,name:c.name,pin:String(c.pin||""),phone:c.phone||"",gender:c.gender||"",age:c.age||null,
    goal_target_weight:c.goals?.targetWeight||null,goal_target_fat_pct:c.goals?.targetFatPct||null,goal_target_muscle:c.goals?.targetMuscle||null,
    injuries:c.notes?.injuries||"",surgery:c.notes?.surgery||"",conditions:c.notes?.conditions||"",experience:c.notes?.experience||"",
    pt_start_date:c.pt?.startDate||null,pt_end_date:c.pt?.endDate||null,
    pt_total_sessions:Number(c.pt?.totalSessions||0),
    pt_base_completed_sessions:Number(c.pt?.baseCompletedSessions||0)
  }));
  if(clientRows.length){
    const {error}=await supabase.from("clients").upsert(clientRows,{onConflict:"id"});
    if(error) throw error;
  }

  const presetRows=(safe.presets||[]).map(p=>({
    id:p.id,name:p.name,category:p.category||"기타",photo:p.photo||"",youtube:p.youtube||""
  }));
  if(presetRows.length){
    const {error}=await supabase.from("presets").upsert(presetRows,{onConflict:"id"});
    if(error) throw error;
  }

  const routineRows=(safe.customRoutines||[]).map(r=>({
    id:r.id,title:r.title||"",description:r.desc||"",days:r.days||[]
  }));
  if(routineRows.length){
    const {error}=await supabase.from("custom_routines").upsert(routineRows,{onConflict:"id"});
    if(error) throw error;
  }

  const clientIds = safe.clients.map(c=>c.id).filter(Boolean);
  const sessionRows=[]; const attendanceRows=[]; const inbodyRows=[];
  safe.clients.forEach(c=>{
    (c.sessions||[]).forEach(s=>sessionRows.push({
      id:s.id,client_id:c.id,session_date:s.date,trainer_memo:s.trainerMemo||"",
      client_memo:s.clientMemo||"",quick_check:!!s.quickCheck,exercises:s.exercises||[]
    }));
    (c.attendance||[]).forEach(a=>attendanceRows.push({
      client_id:c.id,attendance_date:a.date,strength:a.strength||0,cardio:a.cardio||0
    }));
    (c.inbodyHistory||[]).forEach(r=>inbodyRows.push({
      id:r.id,client_id:c.id,record_date:r.date,height:r.height||null,weight:r.weight||null,
      muscle:r.muscle||null,fat_pct:r.fatPct||null,fat_mass:r.fatMass||null,body_water:r.bodyWater||null,
      protein:r.protein||null,bmr:r.bmr||null,visceral_fat:r.visceralFat||null,waist:r.waist||null,score:r.score||null
    }));
  });

  if(clientIds.length){
    const del1=await supabase.from("sessions").delete().in("client_id", clientIds);
    if(del1.error) throw del1.error;
    const del2=await supabase.from("attendance").delete().in("client_id", clientIds);
    if(del2.error) throw del2.error;
    const del3=await supabase.from("inbody_records").delete().in("client_id", clientIds);
    if(del3.error) throw del3.error;
  }

  if(sessionRows.length){
    const {error}=await supabase.from("sessions").insert(sessionRows);
    if(error) throw error;
  }
  if(attendanceRows.length){
    const {error}=await supabase.from("attendance").insert(attendanceRows);
    if(error) throw error;
  }
  if(inbodyRows.length){
    const {error}=await supabase.from("inbody_records").insert(inbodyRows);
    if(error) throw error;
  }
}

const defData = {
  trainer: { loginId: "hyungmin", password: "VangoFit!2026#", pin: "1234", failedAttempts: 0, lockUntil: 0 },
  presets: mergePresetsWithDB([]),
  customRoutines: [],
  clients: importedClients
};

export default function App(){
  const [user,setUser]=useState(null);
  const [data,setData]=useState(()=>{try{const s=localStorage.getItem(SK);return migrateData(s?JSON.parse(s):defData);}catch{return migrateData(defData);}});
  const [loading,setLoading]=useState(true);
  const [syncStatus,setSyncStatus]=useState("idle");
  const firstSyncSkipRef = useRef(true);
  const syncTimerRef = useRef(null);

  useEffect(()=>{let mounted=true;(async()=>{try{
      const loaded=await loadAppDataFromSupabase();
      if(mounted){
        const finalData=(loaded?.clients&&loaded.clients.length)?loaded:migrateData(defData);
        setData(finalData);
        localStorage.setItem(SK,JSON.stringify(finalData));
      }
    }catch{
      try{
        const s=localStorage.getItem(SK);
        const fallback=migrateData(s?JSON.parse(s):defData);
        if(mounted) setData(fallback);
      }catch{
        if(mounted) setData(migrateData(defData));
      }
    }finally{
      if(mounted) setLoading(false);
    }})(); return ()=>{mounted=false;};},[]);

  useEffect(()=>{
    if(loading) return;
    try{localStorage.setItem(SK,JSON.stringify(migrateData(data)));}catch{}
  },[data,loading]);

  useEffect(()=>{
    if(loading) return;
    if(firstSyncSkipRef.current){
      firstSyncSkipRef.current = false;
      return;
    }
    if(syncTimerRef.current) clearTimeout(syncTimerRef.current);
    setSyncStatus("pending");
    syncTimerRef.current = setTimeout(async ()=>{
      try{
        setSyncStatus("syncing");
        await uploadLocalDataToSupabase(data);
        setSyncStatus("saved");
      }catch(e){
        console.error("자동 동기화 실패", e);
        setSyncStatus("error");
      }
    }, 900);
    return ()=>{ if(syncTimerRef.current) clearTimeout(syncTimerRef.current); };
  },[data,loading]);

  if(loading) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg,color:C.text,fontFamily:"'Noto Sans KR',sans-serif"}}>데이터 불러오는 중...</div>;
  if(!user) return <Login onLogin={setUser} data={data} setData={setData}/>;
  if(user.type==="trainer") return <Trainer data={data} setData={setData} onLogout={()=>setUser(null)} syncStatus={syncStatus}/>;
  return <Client data={data} setData={setData} clientId={user.clientId} onLogout={()=>setUser(null)} syncStatus={syncStatus}/>;
}
