import { useState, useEffect, useCallback, useRef } from "react";

const SK = "pt-manager-data";
const gid = () => Math.random().toString(36).substr(2, 9);

// ─── AVERAGES (InBody Report 2023-2024) ───
const AVG={male:{muscle:{"155":26,"160":27.5,"165":29,"170":30.5,"175":32,"180":33.5,"185":35,"190":36.5},fatPct:{"155":19,"160":18,"165":18,"170":17,"175":17,"180":16,"185":16,"190":15},weight:{"155":58,"160":62,"165":66,"170":70,"175":74,"180":78,"185":82,"190":86},bodyWater:{"155":33,"160":35,"165":37,"170":39,"175":41,"180":43,"185":45,"190":47},bmr:{"155":1380,"160":1420,"165":1480,"170":1540,"175":1590,"180":1650,"185":1710,"190":1770}},female:{muscle:{"145":18.5,"150":19.5,"155":20.5,"160":21.5,"165":22.5,"170":23.5,"175":24.5,"180":25.5},fatPct:{"145":27,"150":26,"155":26,"160":25,"165":25,"170":24,"175":24,"180":23},weight:{"145":46,"150":49,"155":52,"160":55,"165":58,"170":61,"175":64,"180":67},bodyWater:{"145":24,"150":26,"155":27,"160":29,"165":30,"170":32,"175":33,"180":35},bmr:{"145":1100,"150":1140,"155":1180,"160":1220,"165":1260,"170":1300,"175":1340,"180":1380}}};
function getA(g,h,f){if(!g||!h)return null;const d=AVG[g];if(!d?.[f])return null;return d[f][String(Math.max(145,Math.min(190,Math.round(Number(h)/5)*5)))]||null;}
function cmpV(c,a,u,hb){if(!c||!a)return null;const d=c-a,ad=Math.abs(d).toFixed(1);if(Math.abs(d)<0.5)return{text:"평균",color:"#60A5FA"};if(hb)return d>0?{text:`+${ad}${u}`,color:"#4ADE80"}:{text:`-${ad}${u}`,color:"#F87171"};return d<0?{text:`-${ad}${u}`,color:"#4ADE80"}:{text:`+${ad}${u}`,color:"#F87171"};}
function waistB(v,g){if(!v||!g)return null;return Number(v)<(g==="male"?90:85)?{text:"정상",color:"#4ADE80"}:{text:"복부비만 주의",color:"#F87171"};}
function vfB(v){if(!v&&v!==0)return null;const n=Number(v);return n<=9?{text:"정상",color:"#4ADE80"}:n<=14?{text:"주의",color:"#FBBF24"}:{text:"위험",color:"#F87171"};}
function calcBMI(w,h){if(!w||!h)return null;return Math.round(Number(w)/((Number(h)/100)**2)*10)/10;}
function bmiB(b){if(!b)return null;return b<18.5?{text:"저체중",color:"#60A5FA"}:b<23?{text:"정상",color:"#4ADE80"}:b<25?{text:"과체중",color:"#FBBF24"}:b<30?{text:"비만",color:"#F87171"}:{text:"고도비만",color:"#E85454"};}

// ─── BADGES (30개) ───
const BADGES=[
  {days:1,emoji:"👟",title:"첫 출석",msg:"좋은 변화는 첫 걸음에서 시작됩니다. 오늘이 시작이에요!"},
  {days:2,emoji:"🌿",title:"워밍업 완료",msg:"몸이 운동 리듬을 기억하기 시작했어요."},
  {days:3,emoji:"🔥",title:"3일 점화",msg:"처음의 의지가 행동으로 바뀌고 있어요."},
  {days:5,emoji:"💪",title:"기초 체력단",msg:"벌써 5일! 꾸준함이 근육보다 먼저 자랍니다."},
  {days:7,emoji:"🌱",title:"첫 주 완주",msg:"일주일 달성! 운동 습관의 씨앗이 심어졌어요."},
  {days:10,emoji:"⚡",title:"10일 스파크",msg:"지금부터는 몸이 '운동하는 사람'으로 바뀌기 시작합니다."},
  {days:12,emoji:"🏃",title:"리듬 탑승",msg:"출석 리듬이 생겼어요. 흐름을 놓치지 마세요."},
  {days:14,emoji:"🧩",title:"습관 조립",msg:"2주 달성! 운동이 생활 속 퍼즐처럼 맞춰지고 있어요."},
  {days:17,emoji:"🎯",title:"집중 모드",msg:"마음만 먹는 단계는 지났어요. 이제 실행형 회원님!"},
  {days:20,emoji:"🛡️",title:"20일 방패",msg:"몸을 지키는 가장 좋은 보험은 꾸준한 운동입니다."},
  {days:21,emoji:"🔁",title:"습관 루프",msg:"3주 달성! 행동이 반복되면 정체성이 됩니다."},
  {days:25,emoji:"🚀",title:"상승 기류",msg:"25일 출석! 몸과 자신감이 함께 올라가고 있어요."},
  {days:30,emoji:"🏅",title:"한 달 완주",msg:"한 달 달성! 이제 운동은 이벤트가 아니라 생활입니다."},
  {days:35,emoji:"🧠",title:"의지 컨트롤러",msg:"운동은 몸뿐 아니라 집중력과 자기조절에도 도움이 됩니다."},
  {days:40,emoji:"🌊",title:"흐름의 사람",msg:"출석 흐름이 아주 좋습니다. 이 페이스를 유지해보세요."},
  {days:45,emoji:"🏋️",title:"철근 회원",msg:"근력도, 습관도 같이 올라가는 중입니다."},
  {days:50,emoji:"❤️",title:"심장 수호자",msg:"꾸준한 운동은 심혈관 건강을 지키는 강력한 습관입니다."},
  {days:60,emoji:"💎",title:"60일 크리스탈",msg:"지금부터는 남들이 '꾸준하다'고 느끼는 구간이에요."},
  {days:70,emoji:"🌞",title:"에너지 충전기",msg:"몸의 컨디션과 하루의 에너지가 달라지고 있을 거예요."},
  {days:75,emoji:"🧬",title:"뇌 건강 지킴이",msg:"운동은 기억력, 집중력, 기분 조절에도 긍정적인 영향을 줍니다."},
  {days:90,emoji:"👑",title:"90일 클래스",msg:"3개월 달성! 몸이 정말로 바뀌기 시작하는 시점입니다."},
  {days:100,emoji:"⭐",title:"100일 전사",msg:"100일은 아무나 못 갑니다. 이미 상위권 꾸준함이에요."},
  {days:120,emoji:"🏛️",title:"기초 체력 건축가",msg:"몸의 기초 공사를 아주 잘 쌓고 있어요."},
  {days:150,emoji:"🏆",title:"반년의 약속",msg:"여기까지 오면 운동은 의지가 아니라 삶의 일부입니다."},
  {days:180,emoji:"⛰️",title:"하프 이어 등반가",msg:"6개월 출석! 체력과 자신감이 완전히 달라질 수 있는 구간입니다."},
  {days:200,emoji:"🔥",title:"200일 철인",msg:"대단합니다. 운동이 몸을 끌고 가는 단계에 들어섰어요."},
  {days:240,emoji:"🦾",title:"강철 루틴",msg:"이 정도면 하루를 운동 중심으로 설계할 수 있는 사람입니다."},
  {days:270,emoji:"🌌",title:"꾸준함의 궤도",msg:"이제는 멈추는 게 더 어색한 단계예요."},
  {days:300,emoji:"🐯",title:"300일 맹수",msg:"300일 달성! 체력, 습관, 자신감이 함께 진화하고 있어요."},
  {days:365,emoji:"🎖️",title:"1년 마스터",msg:"1년 출석 달성. 몸도 마음도 완전히 다른 사람이 된 레벨입니다."},
];

// ─── PRESETS (with youtube links) ───
const defPresets=[
  {id:"p1",name:"라이프피트니스 랫풀다운",category:"등",photo:"",youtube:""},
  {id:"p2",name:"라이프피트니스 체스트프레스",category:"가슴",photo:"",youtube:""},
  {id:"p3",name:"라이프피트니스 숄더프레스",category:"어깨",photo:"",youtube:""},
  {id:"p4",name:"라이프피트니스 레그프레스",category:"하체",photo:"",youtube:""},
  {id:"p5",name:"라이프피트니스 시티드 로우",category:"등",photo:"",youtube:""},
  {id:"p6",name:"라이프피트니스 레그컬",category:"하체",photo:"",youtube:""},
  {id:"p7",name:"라이프피트니스 레그익스텐션",category:"하체",photo:"",youtube:""},
  {id:"p8",name:"바벨 스쿼트",category:"하체",photo:"",youtube:""},
  {id:"p9",name:"루마니안 데드리프트",category:"하체",photo:"",youtube:""},
  {id:"p10",name:"덤벨 플라이",category:"가슴",photo:"",youtube:""},
  {id:"p11",name:"케이블 로우",category:"등",photo:"",youtube:""},
  {id:"p12",name:"바이셉스 컬",category:"팔",photo:"",youtube:""},
  {id:"p13",name:"트라이셉스 익스텐션",category:"팔",photo:"",youtube:""},
  {id:"p14",name:"페이스풀",category:"어깨",photo:"",youtube:""},
  {id:"p15",name:"힙쓰러스트",category:"하체",photo:"",youtube:""},
  {id:"p16",name:"런지",category:"하체",photo:"",youtube:""},
  {id:"p17",name:"케이블 푸시다운",category:"팔",photo:"",youtube:""},
  {id:"p18",name:"펙덱 플라이",category:"가슴",photo:"",youtube:""},
];

const defData={trainer:{pin:"1234"},presets:defPresets,customRoutines:[],clients:[
{id:"c1",name:"김민수",pin:"0001",phone:"010-1234-5678",gender:"male",age:32,
  goals:{targetWeight:73,targetFatPct:15,targetMuscle:36},
  notes:{injuries:"오른쪽 어깨 회전근개 부분파열 (2024)",surgery:"없음",conditions:"장시간 앉아서 근무",experience:"운동 경력 6개월"},
  pt:{startDate:"2026-01-01",endDate:"2026-06-30",totalSessions:48,completedSessions:24},
  attendance:[{date:"2026-03-01",strength:60,cardio:20},{date:"2026-03-03",strength:50,cardio:30},{date:"2026-03-05",strength:60,cardio:0},{date:"2026-03-07",strength:60,cardio:20},{date:"2026-03-08",strength:45,cardio:30},{date:"2026-03-10",strength:60,cardio:0},{date:"2026-02-28",strength:60,cardio:20},{date:"2026-02-26",strength:50,cardio:0},{date:"2026-02-24",strength:60,cardio:30},{date:"2026-02-20",strength:60,cardio:0},{date:"2026-02-18",strength:50,cardio:20},{date:"2026-02-15",strength:60,cardio:0},{date:"2026-02-12",strength:45,cardio:30},{date:"2026-02-10",strength:60,cardio:20},{date:"2026-02-07",strength:60,cardio:0},{date:"2026-02-05",strength:50,cardio:30},{date:"2026-02-03",strength:60,cardio:0},{date:"2026-02-01",strength:45,cardio:20},{date:"2026-01-30",strength:60,cardio:0},{date:"2026-01-28",strength:50,cardio:30},{date:"2026-01-25",strength:60,cardio:20},{date:"2026-01-22",strength:60,cardio:0},{date:"2026-01-20",strength:45,cardio:30},{date:"2026-01-18",strength:60,cardio:0},{date:"2026-01-15",strength:50,cardio:20},{date:"2026-01-12",strength:60,cardio:0},{date:"2026-01-10",strength:45,cardio:30},{date:"2026-01-07",strength:60,cardio:20},{date:"2026-01-05",strength:60,cardio:0},{date:"2026-01-03",strength:50,cardio:30}],
  inbodyHistory:[
    {id:"ib1",date:"2026-01-15",height:175,weight:82,muscle:33.0,fatPct:21.5,fatMass:17.6,bodyWater:39.5,protein:11.2,bmr:1580,visceralFat:8,waist:86,score:74},
    {id:"ib2",date:"2026-02-15",height:175,weight:80,muscle:33.8,fatPct:19.8,fatMass:15.8,bodyWater:40.2,protein:11.5,bmr:1600,visceralFat:7,waist:84,score:77},
    {id:"ib3",date:"2026-03-07",height:175,weight:78,muscle:34.2,fatPct:18.5,fatMass:14.4,bodyWater:40.8,protein:11.8,bmr:1610,visceralFat:6,waist:82,score:80},
  ],
  sessions:[
    {id:"s1",date:"2026-03-07",exercises:[{name:"라이프피트니스 랫풀다운",presetId:"p1",sets:[{weight:40,reps:12},{weight:45,reps:10},{weight:45,reps:10}],equipNote:"시트 높이 3칸"},{name:"라이프피트니스 체스트프레스",presetId:"p2",sets:[{weight:30,reps:12},{weight:35,reps:10},{weight:35,reps:8}],equipNote:"벤치 각도 30°"}],trainerMemo:"상체 위주.",clientMemo:""},
    {id:"s2",date:"2026-03-05",exercises:[{name:"바벨 스쿼트",presetId:"p8",sets:[{weight:40,reps:12},{weight:50,reps:10},{weight:50,reps:10}],equipNote:""},{name:"루마니안 데드리프트",presetId:"p9",sets:[{weight:40,reps:12},{weight:50,reps:10}],equipNote:""}],trainerMemo:"하체 집중.",clientMemo:""},
  ]},
{id:"c2",name:"이서연",pin:"0002",phone:"010-9876-5432",gender:"female",age:28,
  goals:{targetWeight:55,targetFatPct:23,targetMuscle:24},
  notes:{injuries:"없음",surgery:"왼쪽 무릎 반월판 수술 (2023)",conditions:"무릎 과신전 주의",experience:"운동 경력 1년"},
  pt:{startDate:"2026-02-01",endDate:"2026-07-31",totalSessions:36,completedSessions:8},
  attendance:[{date:"2026-03-06",strength:40,cardio:20},{date:"2026-03-04",strength:45,cardio:0},{date:"2026-03-01",strength:40,cardio:30},{date:"2026-02-27",strength:40,cardio:20},{date:"2026-02-24",strength:45,cardio:0},{date:"2026-02-20",strength:40,cardio:30},{date:"2026-02-17",strength:40,cardio:0},{date:"2026-02-14",strength:45,cardio:20}],
  inbodyHistory:[{id:"ib4",date:"2026-02-20",height:163,weight:58,muscle:22.1,fatPct:26.3,fatMass:15.3,bodyWater:29.5,protein:8.2,bmr:1210,visceralFat:4,waist:72,score:72}],
  sessions:[{id:"s3",date:"2026-03-06",exercises:[{name:"라이프피트니스 시티드 로우",presetId:"p5",sets:[{weight:20,reps:15},{weight:25,reps:12}],equipNote:"가슴패드 2칸"}],trainerMemo:"상체 당기기.",clientMemo:""}]},
]};

// ─── AUTO ROUTINES ───
const catKw={"가슴":["체스트","플라이","벤치프레스","펙덱"],"등":["랫풀","로우","풀업","풀다운"],"어깨":["숄더","프레스","페이스풀"],"하체":["스쿼트","레그","런지","데드리프트","힙쓰러스트"],"팔":["바이셉","트라이셉","컬","익스텐션","푸시다운"]};
function catEx(n,pr){const p=pr?.find(x=>x.name===n);if(p?.category)return p.category;for(const[c,kw]of Object.entries(catKw))if(kw.some(k=>n.includes(k)))return c;return"기타";}
function genRt(cl,pr){if(!cl.sessions?.length)return null;const em={};cl.sessions.forEach(s=>s.exercises.forEach(e=>{const c=catEx(e.name,pr);if(!em[e.name])em[e.name]={name:e.name,category:c,lastSets:e.sets,count:0};em[e.name].count++;em[e.name].lastSets=e.sets;}));const ex=Object.values(em).sort((a,b)=>b.count-a.count);const rc=e=>{const s=e.lastSets[0];const w=s?.weight?`${Math.round(s.weight*0.8)}kg`:"";return`${e.lastSets.length}세트×${s?.reps||10}회${w?` (${w})`:""}`;};
return[{type:"fullbody",title:"전신",desc:"상하체 골고루",days:[{title:"전신 운동",exercises:[...ex.filter(e=>["가슴","등"].includes(e.category)).slice(0,2),...ex.filter(e=>["어깨","팔"].includes(e.category)).slice(0,1),...ex.filter(e=>e.category==="하체").slice(0,2)].map(e=>({...e,rec:rc(e)}))}]},{type:"ul",title:"상하체 분할",desc:"상체/하체 2분할",days:[{title:"상체의 날",exercises:ex.filter(e=>["가슴","등","어깨","팔"].includes(e.category)).slice(0,5).map(e=>({...e,rec:rc(e)}))},{title:"하체의 날",exercises:ex.filter(e=>e.category==="하체").slice(0,5).map(e=>({...e,rec:rc(e)}))}]},{type:"ppl",title:"PPL",desc:"Push/Pull/Legs",days:[{title:"Push",exercises:[...ex.filter(e=>["가슴","어깨"].includes(e.category)).slice(0,3)].map(e=>({...e,rec:rc(e)}))},{title:"Pull",exercises:[...ex.filter(e=>e.category==="등").slice(0,3)].map(e=>({...e,rec:rc(e)}))},{title:"Legs",exercises:ex.filter(e=>e.category==="하체").slice(0,5).map(e=>({...e,rec:rc(e)}))}]}].filter(r=>r.days.some(d=>d.exercises.length>0));}

// ─── COLORS & UI ───
const C={bg:"#0C0D11",card:"#16181F",cardAlt:"#1C1E27",accent:"#D4A843",ag:"rgba(212,168,67,0.12)",text:"#EDEAE3",td:"#7A786F",tm:"#B5B2A8",border:"#26282F",danger:"#E85454",success:"#4ADE80",info:"#60A5FA",warn:"#FBBF24"};
const bi={width:"100%",padding:"12px 16px",borderRadius:"10px",border:`1px solid ${C.border}`,background:C.bg,color:C.text,fontSize:"14px",outline:"none",boxSizing:"border-box",fontFamily:"'Noto Sans KR',sans-serif"};
function Btn({children,variant="primary",style,...p}){const base={padding:"11px 20px",borderRadius:"10px",border:"none",fontSize:"14px",fontWeight:600,cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif",transition:"all 0.15s",...style};const v={primary:{background:C.accent,color:C.bg},secondary:{background:"transparent",border:`1px solid ${C.border}`,color:C.tm},danger:{background:"rgba(232,84,84,0.12)",color:C.danger,fontSize:"12px",padding:"7px 14px"},ghost:{background:"transparent",color:C.td,padding:"7px 14px",fontSize:"13px"}};return <button style={{...base,...v[variant]}} {...p}>{children}</button>;}
function BG({children,color=C.accent}){return <span style={{display:"inline-block",padding:"3px 10px",borderRadius:"6px",fontSize:"11px",fontWeight:600,background:`${color}20`,color}}>{children}</span>;}
function Fd({label,children}){return <div style={{marginBottom:"12px"}}><div style={{fontSize:"11px",fontWeight:600,color:C.td,marginBottom:"5px",letterSpacing:"1px"}}>{label}</div>{children}</div>;}
function Stat({label,value,unit,comparison,badge}){return <div style={{textAlign:"center",padding:"12px 6px",background:C.bg,borderRadius:"10px",minWidth:0}}><div style={{fontSize:"18px",fontWeight:800,color:C.accent}}>{value||"-"}<span style={{fontSize:"10px",color:C.td}}>{unit}</span></div><div style={{fontSize:"9px",color:C.td,marginTop:"2px"}}>{label}</div>{comparison&&<div style={{fontSize:"8px",color:comparison.color,marginTop:"2px",fontWeight:600}}>{comparison.text}</div>}{badge&&<div style={{fontSize:"8px",color:badge.color,marginTop:"2px",fontWeight:600}}>{badge.text}</div>}</div>;}
function MiniTrend({data,field,label,color=C.accent}){const vals=data.map(d=>Number(d[field])).filter(v=>v);if(vals.length<2)return null;const mn=Math.min(...vals),mx=Math.max(...vals),rg=mx-mn||1,w=120,h=40;const pts=vals.map((v,i)=>`${(i/(vals.length-1))*w},${h-((v-mn)/rg)*(h-8)-4}`).join(" ");const df=vals[vals.length-1]-vals[0];return <div style={{display:"flex",alignItems:"center",gap:"10px",padding:"8px 12px",background:C.bg,borderRadius:"8px",marginBottom:"4px"}}><div style={{flex:1}}><div style={{fontSize:"11px",color:C.td}}>{label}</div><div style={{fontSize:"15px",fontWeight:700,color:C.text}}>{vals[vals.length-1]}</div></div><svg width={w} height={h} style={{flexShrink:0}}><polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg><div style={{fontSize:"11px",fontWeight:700,color:df>0?"#4ADE80":df<0?"#F87171":C.td,minWidth:"40px",textAlign:"right"}}>{df>0?"+":""}{df.toFixed(1)}</div></div>;}
const WG=`배꼽 바로 위를 줄자로 수평하게 감아 측정합니다.\n숨을 편하게 내쉰 상태에서 측정하세요.\n\n복부비만 기준: 남성 90cm / 여성 85cm 이상`;

// ─── EXERCISE DETAIL MODAL (photo + youtube) ───
function ExDetailModal({preset, onClose}) {
  if (!preset) return null;
  return (
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1200,padding:"20px"}} onClick={onClose}>
      <div style={{background:C.card,borderRadius:"20px",padding:"24px",width:"100%",maxWidth:"440px",maxHeight:"80vh",overflowY:"auto",border:`1px solid ${C.border}`}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
          <span style={{fontSize:"16px",fontWeight:800}}>{preset.name}</span>
          <Btn variant="ghost" onClick={onClose}>✕</Btn>
        </div>
        <BG color={C.info}>{preset.category}</BG>
        {preset.photo && (
          <div style={{marginTop:"14px"}}>
            <img src={preset.photo} alt={preset.name} style={{width:"100%",borderRadius:"12px",objectFit:"cover",maxHeight:"300px"}} />
          </div>
        )}
        {!preset.photo && (
          <div style={{marginTop:"14px",background:C.bg,borderRadius:"12px",padding:"40px",textAlign:"center",color:C.td,fontSize:"13px"}}>
            📷 사진이 등록되지 않았습니다
          </div>
        )}
        {preset.youtube && (
          <a href={preset.youtube} target="_blank" rel="noopener noreferrer"
            style={{display:"flex",alignItems:"center",gap:"10px",marginTop:"14px",padding:"14px",background:C.bg,borderRadius:"12px",textDecoration:"none",color:C.text,border:`1px solid ${C.border}`}}>
            <span style={{fontSize:"28px"}}>▶️</span>
            <div>
              <div style={{fontSize:"13px",fontWeight:700}}>운동 영상 보기</div>
              <div style={{fontSize:"11px",color:C.td}}>YouTube에서 올바른 자세를 확인하세요</div>
            </div>
          </a>
        )}
        {!preset.youtube && (
          <div style={{marginTop:"14px",padding:"12px",background:C.bg,borderRadius:"10px",fontSize:"12px",color:C.td,textAlign:"center"}}>
            영상 링크가 등록되지 않았습니다
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ATTENDANCE TAB ───
function AttendanceView({client,isTrainer,onSave,onSavePT}){
  const att=client.attendance||[];const pt=client.pt||{};const today=new Date().toISOString().split("T")[0];
  const[month,setMonth]=useState(()=>{const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;});
  const[showLog,setShowLog]=useState(false);const[logDate,setLogDate]=useState(today);const[logStr,setLogStr]=useState("");const[logCard,setLogCard]=useState("");
  const[showPTEdit,setShowPTEdit]=useState(false);const[ptForm,setPtForm]=useState({startDate:pt.startDate||"",endDate:pt.endDate||"",totalSessions:pt.totalSessions||"",completedSessions:pt.completedSessions||""});
  const totalDays=att.length;const yr=Number(month.split("-")[0]),mo=Number(month.split("-")[1]);
  const yearDays=att.filter(a=>a.date.startsWith(String(yr))).length;
  const monthDays=att.filter(a=>a.date.startsWith(month)).length;
  const daysInMonth=new Date(yr,mo,0).getDate();const monthRate=daysInMonth>0?Math.round((monthDays/daysInMonth)*100):0;
  const earnedBadges=BADGES.filter(b=>totalDays>=b.days);const nextBadge=BADGES.find(b=>totalDays<b.days);
  const firstDay=new Date(yr,mo-1,1).getDay();const calDays=[];for(let i=0;i<firstDay;i++)calDays.push(null);for(let i=1;i<=daysInMonth;i++)calDays.push(i);
  const isChk=d=>{if(!d)return false;return att.some(a=>a.date===`${month}-${String(d).padStart(2,"0")}`);};
  const getAtt=d=>att.find(a=>a.date===`${month}-${String(d).padStart(2,"0")}`);
  const totalMin=att.reduce((s,a)=>s+(a.strength||0)+(a.cardio||0),0);
  return (<>
    <span style={{fontSize:"18px",fontWeight:800,display:"block",marginBottom:"14px"}}>출석 & 동기부여</span>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"6px",marginBottom:"12px"}}>{[
      [totalDays,"누적 운동일",C.accent],[yearDays,`${yr}년`,C.success],[monthRate+"%",`${mo}월 출석률`,C.info],[Math.round(totalMin/60)+"h","총 운동시간",C.warn]
    ].map(([v,l,c],i)=><div key={i} style={{background:C.card,borderRadius:"10px",padding:"12px 6px",textAlign:"center",border:`1px solid ${C.border}`}}><div style={{fontSize:"18px",fontWeight:800,color:c}}>{v}</div><div style={{fontSize:"8px",color:C.td}}>{l}</div></div>)}</div>
    {(pt.totalSessions||isTrainer)&&<div style={{background:C.card,borderRadius:"14px",padding:"14px",marginBottom:"12px",border:`1px solid ${C.border}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}><span style={{fontSize:"13px",fontWeight:700,color:C.accent}}>PT 현황</span>{isTrainer&&<Btn variant="ghost" onClick={()=>setShowPTEdit(true)} style={{fontSize:"10px"}}>수정</Btn>}</div>
      {pt.totalSessions?<><div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px",fontSize:"11px"}}><span style={{color:C.td}}>기간</span><span style={{color:C.text}}>{pt.startDate}~{pt.endDate}</span></div><div style={{display:"flex",gap:"6px",marginBottom:"6px"}}><div style={{flex:1,background:C.bg,borderRadius:"8px",padding:"10px",textAlign:"center"}}><div style={{fontSize:"18px",fontWeight:800,color:C.accent}}>{pt.completedSessions}/{pt.totalSessions}</div><div style={{fontSize:"8px",color:C.td}}>진행/전체</div></div><div style={{flex:1,background:C.bg,borderRadius:"8px",padding:"10px",textAlign:"center"}}><div style={{fontSize:"18px",fontWeight:800,color:C.warn}}>{pt.totalSessions-pt.completedSessions}</div><div style={{fontSize:"8px",color:C.td}}>남은 횟수</div></div></div><div style={{background:C.bg,borderRadius:"4px",height:"6px",overflow:"hidden"}}><div style={{height:"100%",background:C.accent,borderRadius:"4px",width:`${Math.round((pt.completedSessions/pt.totalSessions)*100)}%`}}/></div></>:<div style={{fontSize:"11px",color:C.td,textAlign:"center",padding:"8px"}}>PT 정보 없음</div>}
    </div>}
    <div style={{background:C.card,borderRadius:"14px",padding:"14px",marginBottom:"12px",border:`1px solid ${C.border}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}><Btn variant="ghost" onClick={()=>{const d=new Date(yr,mo-2,1);setMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);}} style={{padding:"3px 8px"}}>◀</Btn><span style={{fontSize:"14px",fontWeight:700}}>{yr}년 {mo}월</span><Btn variant="ghost" onClick={()=>{const d=new Date(yr,mo,1);setMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);}} style={{padding:"3px 8px"}}>▶</Btn></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"2px",textAlign:"center",marginBottom:"3px"}}>{["일","월","화","수","목","금","토"].map(d=><div key={d} style={{fontSize:"9px",color:C.td,padding:"3px"}}>{d}</div>)}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"2px"}}>{calDays.map((day,i)=>{if(!day)return <div key={i}/>;const chk=isChk(day);const isT=`${month}-${String(day).padStart(2,"0")}`===today;
        return <div key={i} onClick={()=>{const ds=`${month}-${String(day).padStart(2,"0")}`;setLogDate(ds);const a=getAtt(day);setLogStr(a?String(a.strength||""):"");setLogCard(a?String(a.cardio||""):"");setShowLog(true);}} style={{textAlign:"center",padding:"5px 2px",borderRadius:"8px",cursor:"pointer",background:chk?C.ag:"transparent",border:isT?`2px solid ${C.accent}`:"2px solid transparent"}}><div style={{fontSize:"12px",fontWeight:chk?700:400,color:chk?C.accent:C.text}}>{day}</div>{chk&&<div style={{fontSize:"6px",color:C.accent}}>●</div>}</div>;})}</div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:"8px",fontSize:"10px",color:C.td}}><span>{monthDays}일 운동</span><span>근력 {att.filter(a=>a.date.startsWith(month)).reduce((s,a)=>s+(a.strength||0),0)}분 · 유산소 {att.filter(a=>a.date.startsWith(month)).reduce((s,a)=>s+(a.cardio||0),0)}분</span></div>
    </div>
    {!att.some(a=>a.date===today)&&<Btn onClick={()=>{setLogDate(today);setLogStr("");setLogCard("");setShowLog(true);}} style={{width:"100%",marginBottom:"12px",padding:"14px",fontSize:"15px"}}>오늘 운동 기록하기 💪</Btn>}
    <div style={{background:C.card,borderRadius:"14px",padding:"14px",marginBottom:"12px",border:`1px solid ${C.border}`}}>
      <span style={{fontSize:"13px",fontWeight:700,color:C.accent,display:"block",marginBottom:"8px"}}>배지 ({earnedBadges.length}/{BADGES.length})</span>
      {earnedBadges.length===0&&<div style={{fontSize:"11px",color:C.td,textAlign:"center",padding:"12px"}}>첫 배지까지 {BADGES[0].days-totalDays}일 남았어요! 오늘 바로 시작해볼까요? 💪</div>}
      {earnedBadges.map(b=><div key={b.days} style={{display:"flex",gap:"10px",alignItems:"flex-start",padding:"8px",background:C.bg,borderRadius:"8px",marginBottom:"4px"}}><div style={{fontSize:"24px",flexShrink:0}}>{b.emoji}</div><div><div style={{fontSize:"12px",fontWeight:700}}>{b.title} <span style={{fontSize:"9px",color:C.td}}>({b.days}일)</span></div><div style={{fontSize:"10px",color:C.tm,marginTop:"1px",lineHeight:1.3}}>{b.msg}</div></div></div>)}
      {nextBadge&&<div style={{marginTop:"6px",padding:"8px 12px",background:C.bg,borderRadius:"8px",border:`1px dashed ${C.border}`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:"12px"}}>{nextBadge.emoji} {nextBadge.title}</span><BG color={C.warn}>{nextBadge.days-totalDays}일 남음</BG></div><div style={{background:C.card,borderRadius:"3px",height:"5px",marginTop:"5px",overflow:"hidden"}}><div style={{height:"100%",background:C.accent,borderRadius:"3px",width:`${Math.round((totalDays/nextBadge.days)*100)}%`}}/></div></div>}
    </div>
    {showLog&&<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"20px"}} onClick={()=>setShowLog(false)}><div style={{background:C.card,borderRadius:"20px",padding:"24px",width:"100%",maxWidth:"360px",border:`1px solid ${C.border}`}} onClick={e=>e.stopPropagation()}><div style={{fontSize:"16px",fontWeight:800,marginBottom:"14px"}}>{logDate} 운동 기록</div><Fd label="근력 운동 (분)"><input type="number" value={logStr} onChange={e=>setLogStr(e.target.value)} style={bi} placeholder="예: 60"/></Fd><Fd label="유산소 운동 (분)"><input type="number" value={logCard} onChange={e=>setLogCard(e.target.value)} style={bi} placeholder="예: 30"/></Fd><div style={{display:"flex",gap:"8px"}}><Btn onClick={()=>{const ex=att.find(a=>a.date===logDate);onSave(ex?att.map(a=>a.date===logDate?{...a,strength:Number(logStr)||0,cardio:Number(logCard)||0}:a):[...att,{date:logDate,strength:Number(logStr)||0,cardio:Number(logCard)||0}]);setShowLog(false);}} style={{flex:1}}>저장</Btn>{att.some(a=>a.date===logDate)&&<Btn variant="danger" onClick={()=>{onSave(att.filter(a=>a.date!==logDate));setShowLog(false);}}>삭제</Btn>}</div></div></div>}
    {showPTEdit&&<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"20px"}} onClick={()=>setShowPTEdit(false)}><div style={{background:C.card,borderRadius:"20px",padding:"24px",width:"100%",maxWidth:"400px",border:`1px solid ${C.border}`}} onClick={e=>e.stopPropagation()}><div style={{fontSize:"16px",fontWeight:800,marginBottom:"14px"}}>PT 정보 수정</div><Fd label="시작일"><input type="date" value={ptForm.startDate} onChange={e=>setPtForm({...ptForm,startDate:e.target.value})} style={bi}/></Fd><Fd label="종료일"><input type="date" value={ptForm.endDate} onChange={e=>setPtForm({...ptForm,endDate:e.target.value})} style={bi}/></Fd><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}><Fd label="전체 PT"><input type="number" value={ptForm.totalSessions} onChange={e=>setPtForm({...ptForm,totalSessions:e.target.value})} style={bi}/></Fd><Fd label="완료 횟수"><input type="number" value={ptForm.completedSessions} onChange={e=>setPtForm({...ptForm,completedSessions:e.target.value})} style={bi}/></Fd></div><Btn onClick={()=>{onSavePT({startDate:ptForm.startDate,endDate:ptForm.endDate,totalSessions:Number(ptForm.totalSessions)||0,completedSessions:Number(ptForm.completedSessions)||0});setShowPTEdit(false);}} style={{width:"100%"}}>저장</Btn></div></div>}
  </>);
}

// ─── INBODY FORM ───
function InbodyForm({record,onSave,onClose,title}){const[d,setD]=useState(record||{id:"",date:new Date().toISOString().split("T")[0],height:"",weight:"",muscle:"",fatPct:"",fatMass:"",bodyWater:"",protein:"",bmr:"",visceralFat:"",waist:"",score:""});const u=(k,v)=>setD({...d,[k]:v});const[wg,setWg]=useState(false);const ib=[["date","측정일","date"],["height","키(cm)","number"],["weight","체중(kg)","number"],["muscle","골격근량(kg)","number"],["fatPct","체지방률(%)","number"],["fatMass","체지방량(kg)","number"],["bodyWater","체수분(L)","number"],["protein","단백질(kg)","number"],["bmr","기초대사량(kcal)","number"],["visceralFat","내장지방 레벨","number"],["score","인바디 점수","number"]];
return <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"16px"}} onClick={onClose}><div style={{background:C.card,borderRadius:"20px",padding:"24px",width:"100%",maxWidth:"500px",maxHeight:"85vh",overflowY:"auto",border:`1px solid ${C.border}`}} onClick={e=>e.stopPropagation()}><div style={{display:"flex",justifyContent:"space-between",marginBottom:"12px"}}><span style={{fontSize:"17px",fontWeight:800}}>{title}</span><Btn variant="ghost" onClick={onClose}>✕</Btn></div><div style={{fontSize:"11px",color:C.td,marginBottom:"12px",padding:"8px 12px",background:C.bg,borderRadius:"8px"}}>인바디 결과지 항목만 입력하세요</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px"}}>{ib.map(([k,l,t])=><Fd key={k} label={l}><input type={t} value={d[k]||""} onChange={e=>u(k,e.target.value)} style={bi}/></Fd>)}</div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"10px 0 4px"}}><span style={{fontSize:"12px",fontWeight:700,color:C.accent}}>허리둘레(직접측정)</span><button onClick={()=>setWg(!wg)} style={{background:"none",border:"none",color:C.info,fontSize:"10px",cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif",textDecoration:"underline"}}>{wg?"닫기":"측정법"}</button></div>{wg&&<div style={{background:C.bg,borderRadius:"8px",padding:"10px",marginBottom:"8px",fontSize:"11px",color:C.tm,lineHeight:1.5,whiteSpace:"pre-line"}}>{WG}</div>}<Fd label="허리둘레(cm)"><input type="number" value={d.waist||""} onChange={e=>u("waist",e.target.value)} style={bi}/></Fd><Btn onClick={()=>onSave({...d,id:d.id||gid()})} style={{width:"100%"}}>저장</Btn></div></div>;}

// ─── GOALS FORM ───
function GoalsForm({client,onSave,onClose,isClient}){const[g,setG]=useState(client.gender||"");const[age,setAge]=useState(client.age||"");const[go,setGo]=useState(client.goals||{targetWeight:"",targetFatPct:"",targetMuscle:""});const[n,setN]=useState(client.notes||{injuries:"",surgery:"",conditions:"",experience:""});
return <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"16px"}} onClick={onClose}><div style={{background:C.card,borderRadius:"20px",padding:"24px",width:"100%",maxWidth:"500px",maxHeight:"85vh",overflowY:"auto",border:`1px solid ${C.border}`}} onClick={e=>e.stopPropagation()}><div style={{display:"flex",justifyContent:"space-between",marginBottom:"12px"}}><span style={{fontSize:"17px",fontWeight:800}}>{isClient?"내 정보 수정":"회원 정보 수정"}</span><Btn variant="ghost" onClick={onClose}>✕</Btn></div>
<div style={{fontSize:"12px",fontWeight:700,color:C.accent,marginBottom:"8px"}}>기본 정보</div><div style={{display:"flex",gap:"8px",marginBottom:"10px"}}>{[["male","남성"],["female","여성"]].map(([v,l])=><button key={v} onClick={()=>setG(v)} style={{flex:1,padding:"10px",borderRadius:"10px",border:"none",fontSize:"14px",fontWeight:600,cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif",background:g===v?C.ag:C.bg,color:g===v?C.accent:C.td}}>{l}</button>)}</div><Fd label="나이"><input value={age} type="number" onChange={e=>setAge(e.target.value)} style={bi}/></Fd>
<div style={{fontSize:"12px",fontWeight:700,color:C.accent,margin:"12px 0 8px"}}>목표</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"6px"}}><Fd label="체중(kg)"><input value={go.targetWeight} type="number" onChange={e=>setGo({...go,targetWeight:e.target.value})} style={bi}/></Fd><Fd label="체지방(%)"><input value={go.targetFatPct} type="number" onChange={e=>setGo({...go,targetFatPct:e.target.value})} style={bi}/></Fd><Fd label="골격근(kg)"><input value={go.targetMuscle} type="number" onChange={e=>setGo({...go,targetMuscle:e.target.value})} style={bi}/></Fd></div>
<div style={{fontSize:"12px",fontWeight:700,color:C.accent,margin:"12px 0 8px"}}>특이사항</div><Fd label="부상/아픈곳"><textarea value={n.injuries} onChange={e=>setN({...n,injuries:e.target.value})} style={{...bi,minHeight:"40px",resize:"vertical"}}/></Fd><Fd label="수술이력"><textarea value={n.surgery} onChange={e=>setN({...n,surgery:e.target.value})} style={{...bi,minHeight:"36px",resize:"vertical"}}/></Fd><Fd label="기타"><textarea value={n.conditions} onChange={e=>setN({...n,conditions:e.target.value})} style={{...bi,minHeight:"36px",resize:"vertical"}}/></Fd><Fd label="운동경력"><input value={n.experience} onChange={e=>setN({...n,experience:e.target.value})} style={bi}/></Fd>
<Btn onClick={()=>onSave(g,Number(age)||"",go,n)} style={{width:"100%"}}>저장</Btn></div></div>;}

// ─── INBODY VIEW ───
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

// ─── EXERCISE PICKER ───
function ExPk({presets,onSelect,onClose,onNew}){const[s,setS]=useState("");const[cat,setCat]=useState("전체");const[detail,setDetail]=useState(null);const cats=["전체",...new Set(presets.map(p=>p.category))];const f=presets.filter(p=>(cat==="전체"||p.category===cat)&&(!s||p.name.toLowerCase().includes(s.toLowerCase())));
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
</div></div>{detail&&<ExDetailModal preset={detail} onClose={()=>setDetail(null)}/>}</>;}

// ─── SESSION DETAIL (with client memo) ───
function SesDet({session,presets,isClient,onSaveClientMemo}){
  const[editing,setEditing]=useState(false);const[memo,setMemo]=useState(session.clientMemo||"");
  const[detail,setDetail]=useState(null);
  const getP=ex=>presets?.find(pr=>pr.id===ex.presetId);
  return <div style={{background:C.card,borderRadius:"12px",padding:"14px",marginBottom:"8px",border:`1px solid ${C.border}`}}>
  <div style={{display:"flex",justifyContent:"space-between",marginBottom:"8px"}}><span style={{fontSize:"13px",fontWeight:700}}>{session.date}</span><BG color={C.info}>{session.exercises.length}종목</BG></div>
  {session.exercises.map((ex,i)=>{const p=getP(ex);return <div key={i} style={{background:C.bg,borderRadius:"8px",padding:"8px",marginBottom:"4px"}}>
    <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"4px"}}>
      {p?.photo?<img src={p.photo} alt="" style={{width:24,height:24,borderRadius:"4px",objectFit:"cover",cursor:"pointer"}} onClick={()=>setDetail(p)}/>:null}
      <span style={{fontWeight:700,fontSize:"12px",flex:1,cursor:p?"pointer":"default"}} onClick={()=>p&&setDetail(p)}>{ex.name}</span>
      {ex.equipNote&&<span style={{fontSize:"8px",color:C.accent,background:C.ag,padding:"1px 6px",borderRadius:"4px"}}>⚙{ex.equipNote}</span>}
    </div>
    <div style={{display:"flex",gap:"3px",flexWrap:"wrap"}}>{ex.sets.map((s,j)=><span key={j} style={{padding:"2px 6px",background:C.card,borderRadius:"4px",fontSize:"10px",color:C.tm}}>{j+1}세트 {s.weight}kg×{s.reps}회</span>)}</div>
  </div>;})}
  {session.trainerMemo&&<div style={{marginTop:"6px",padding:"6px 10px",background:C.ag,borderRadius:"6px",fontSize:"11px",color:C.tm,borderLeft:`3px solid ${C.accent}`}}><span style={{fontWeight:600,color:C.accent,fontSize:"9px"}}>트레이너 메모</span><div style={{marginTop:"1px"}}>{session.trainerMemo}</div></div>}
  {/* Client Memo */}
  <div style={{marginTop:"6px"}}>
    {editing ? (
      <div style={{background:C.bg,borderRadius:"8px",padding:"8px"}}>
        <textarea value={memo} onChange={e=>setMemo(e.target.value)} style={{...bi,minHeight:"40px",resize:"vertical",fontSize:"12px"}} placeholder="수업 후기나 느낀 점을 적어보세요"/>
        <div style={{display:"flex",gap:"6px",marginTop:"6px"}}><Btn onClick={()=>{onSaveClientMemo&&onSaveClientMemo(session.id,memo);setEditing(false);}} style={{flex:1,padding:"7px",fontSize:"11px"}}>저장</Btn><Btn variant="secondary" onClick={()=>setEditing(false)} style={{padding:"7px",fontSize:"11px"}}>취소</Btn></div>
      </div>
    ) : session.clientMemo ? (
      <div style={{padding:"6px 10px",background:C.bg,borderRadius:"6px",fontSize:"11px",color:C.tm,borderLeft:`3px solid ${C.info}`,cursor:"pointer"}} onClick={()=>{if(isClient||!onSaveClientMemo)return;setEditing(true);}}>
        <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:600,color:C.info,fontSize:"9px"}}>회원 메모</span>{(isClient)&&<button onClick={e=>{e.stopPropagation();setEditing(true);}} style={{background:"none",border:"none",color:C.info,fontSize:"9px",cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif"}}>수정</button>}</div>
        <div style={{marginTop:"1px"}}>{session.clientMemo}</div>
      </div>
    ) : (isClient||onSaveClientMemo) ? (
      <button onClick={()=>setEditing(true)} style={{width:"100%",padding:"6px",background:C.bg,borderRadius:"6px",border:`1px dashed ${C.border}`,color:C.td,fontSize:"10px",cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif"}}>
        ✏️ 수업 후기 작성하기
      </button>
    ) : null}
  </div>
  {detail&&<ExDetailModal preset={detail} onClose={()=>setDetail(null)}/>}
</div>;}

// ─── SESSION FORM ───
function SesForm({presets,session,onSave,onClose}){const[date,setDate]=useState(session?.date||new Date().toISOString().split("T")[0]);const[exs,setExs]=useState(session?.exercises?.map(e=>({...e}))||[]);const[memo,setMemo]=useState(session?.trainerMemo||"");const[sp,setSp]=useState(false);const[man,setMan]=useState(false);const[mn,setMn]=useState("");
return <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"16px"}} onClick={onClose}><div style={{background:C.card,borderRadius:"20px",padding:"22px",width:"100%",maxWidth:"600px",maxHeight:"85vh",overflowY:"auto",border:`1px solid ${C.border}`}} onClick={e=>e.stopPropagation()}>
<div style={{display:"flex",justifyContent:"space-between",marginBottom:"12px"}}><span style={{fontSize:"15px",fontWeight:800}}>{session?"수정":"새 수업 기록"}</span><Btn variant="ghost" onClick={onClose}>✕</Btn></div>
<Fd label="날짜"><input type="date" value={date} onChange={e=>setDate(e.target.value)} style={bi}/></Fd>
{exs.map((ex,i)=><div key={i} style={{background:C.bg,borderRadius:"10px",padding:"10px",marginBottom:"6px"}}><div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"6px"}}><span style={{flex:1,fontWeight:700,fontSize:"12px"}}>{ex.name}</span><Btn variant="danger" onClick={()=>setExs(exs.filter((_,j)=>j!==i))} style={{padding:"3px 6px"}}>삭제</Btn></div><Fd label="장비 세팅"><input placeholder="의자 높이 등" value={ex.equipNote} onChange={e=>{const c=[...exs];c[i]={...c[i],equipNote:e.target.value};setExs(c);}} style={bi}/></Fd><div style={{fontSize:"9px",fontWeight:600,color:C.td,marginBottom:"3px"}}>세트</div>{ex.sets.map((s,j)=><div key={j} style={{display:"flex",gap:"4px",marginBottom:"3px",alignItems:"center"}}><span style={{fontSize:"10px",color:C.td,width:"18px"}}>{j+1}</span><input placeholder="kg" value={s.weight} type="number" onChange={e=>{const c=[...exs];c[i].sets=[...c[i].sets];c[i].sets[j]={...c[i].sets[j],weight:e.target.value};setExs(c);}} style={{...bi,padding:"8px",flex:1}}/><input placeholder="회" value={s.reps} type="number" onChange={e=>{const c=[...exs];c[i].sets=[...c[i].sets];c[i].sets[j]={...c[i].sets[j],reps:e.target.value};setExs(c);}} style={{...bi,padding:"8px",flex:1}}/>{ex.sets.length>1&&<Btn variant="danger" onClick={()=>{const c=[...exs];c[i].sets=c[i].sets.filter((_,k)=>k!==j);setExs(c);}} style={{padding:"3px 5px"}}>−</Btn>}</div>)}<Btn variant="ghost" onClick={()=>{const c=[...exs];c[i].sets=[...c[i].sets,{weight:"",reps:""}];setExs(c);}} style={{fontSize:"10px"}}>+세트</Btn></div>)}
<Btn variant="secondary" style={{width:"100%",marginBottom:"10px",borderStyle:"dashed"}} onClick={()=>setSp(true)}>+ 운동 추가</Btn>
<Fd label="트레이너 메모"><textarea value={memo} onChange={e=>setMemo(e.target.value)} style={{...bi,resize:"vertical",minHeight:"50px"}}/></Fd>
<Btn onClick={()=>{onSave({id:session?.id||gid(),date,exercises:exs.filter(e=>e.name.trim()).map(e=>({...e,sets:e.sets.map(s=>({weight:Number(s.weight)||0,reps:Number(s.reps)||0}))})),trainerMemo:memo,clientMemo:session?.clientMemo||""});}} style={{width:"100%"}}>저장</Btn>
{sp&&!man&&<ExPk presets={presets} onSelect={p=>{setExs([...exs,{name:p.name,presetId:p.id,sets:[{weight:"",reps:""}],equipNote:""}]);setSp(false);}} onClose={()=>setSp(false)} onNew={()=>setMan(true)}/>}
{man&&<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1200,padding:"20px"}} onClick={()=>setMan(false)}><div style={{background:C.card,borderRadius:"14px",padding:"18px",width:"100%",maxWidth:"340px",border:`1px solid ${C.border}`}} onClick={e=>e.stopPropagation()}><span style={{fontSize:"14px",fontWeight:700}}>직접 입력</span><input value={mn} onChange={e=>setMn(e.target.value)} placeholder="운동 이름" style={{...bi,marginTop:"8px"}} onKeyDown={e=>{if(e.key==="Enter"&&mn.trim()){setExs([...exs,{name:mn.trim(),sets:[{weight:"",reps:""}],equipNote:""}]);setMn("");setMan(false);setSp(false);}}}/><div style={{display:"flex",gap:"6px",marginTop:"8px"}}><Btn onClick={()=>{if(mn.trim()){setExs([...exs,{name:mn.trim(),sets:[{weight:"",reps:""}],equipNote:""}]);setMn("");setMan(false);setSp(false);}}} style={{flex:1}}>추가</Btn><Btn variant="secondary" onClick={()=>setMan(false)}>취소</Btn></div></div></div>}
</div></div>;}

// ─── ADD CLIENT ───
function AddCl({onSave,onClose,pins}){const[n,setN]=useState("");const[ph,setPh]=useState("");const[pin,setPin]=useState("");const dup=pin&&pins.includes(pin);
return <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"20px"}} onClick={onClose}><div style={{background:C.card,borderRadius:"20px",padding:"22px",width:"100%",maxWidth:"380px",border:`1px solid ${C.border}`}} onClick={e=>e.stopPropagation()}><div style={{fontSize:"16px",fontWeight:800,marginBottom:"12px"}}>새 회원</div><Fd label="이름"><input value={n} onChange={e=>setN(e.target.value)} style={bi}/></Fd><Fd label="연락처"><input value={ph} onChange={e=>setPh(e.target.value)} style={bi} placeholder="010-0000-0000"/></Fd><Fd label="PIN(4자리)"><input value={pin} onChange={e=>setPin(e.target.value)} style={bi} maxLength={4}/></Fd>{dup&&<div style={{color:C.danger,fontSize:"10px",marginBottom:"4px"}}>이미 사용 중</div>}<Btn onClick={()=>{if(n.trim()&&pin.length===4&&!dup)onSave({id:gid(),name:n.trim(),phone:ph,pin,gender:"",age:"",goals:{targetWeight:"",targetFatPct:"",targetMuscle:""},notes:{injuries:"",surgery:"",conditions:"",experience:""},pt:{},attendance:[],inbodyHistory:[],sessions:[]});}} style={{width:"100%"}}>등록</Btn></div></div>;}

// ─── PRESET MANAGER (with photo + youtube) ───
function PresetMgr({presets,onSave,onClose}){const[list,setList]=useState([...presets]);const[sa,setSa]=useState(false);const[nn,setNn]=useState("");const[nc,setNc]=useState("가슴");const[np,setNp]=useState("");const[ny,setNy]=useState("");const fr=useRef(null);const[detail,setDetail]=useState(null);
return <><div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"16px"}} onClick={onClose}><div style={{background:C.card,borderRadius:"20px",padding:"22px",width:"100%",maxWidth:"500px",maxHeight:"85vh",overflowY:"auto",border:`1px solid ${C.border}`}} onClick={e=>e.stopPropagation()}>
<div style={{display:"flex",justifyContent:"space-between",marginBottom:"10px"}}><span style={{fontSize:"15px",fontWeight:800}}>종목 관리</span><Btn variant="ghost" onClick={onClose}>✕</Btn></div>
<div style={{fontSize:"10px",color:C.td,marginBottom:"10px"}}>기구 사진과 유튜브 영상 링크를 등록하면 회원님들이 확인할 수 있어요</div>
{list.map(p=><div key={p.id} style={{display:"flex",alignItems:"center",gap:"6px",padding:"6px",background:C.bg,borderRadius:"6px",marginBottom:"3px"}}>
  {p.photo?<img src={p.photo} alt="" style={{width:28,height:28,borderRadius:"4px",objectFit:"cover",cursor:"pointer"}} onClick={()=>setDetail(p)}/>:<div style={{width:28,height:28,borderRadius:"4px",background:C.ag,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px"}}>🏋️</div>}
  <div style={{flex:1,cursor:"pointer"}} onClick={()=>setDetail(p)}><div style={{fontSize:"11px",fontWeight:600}}>{p.name}</div><div style={{fontSize:"8px",color:C.td}}>{p.category}{p.youtube?" · 📹":""}</div></div>
  <Btn variant="danger" onClick={()=>setList(list.filter(x=>x.id!==p.id))} style={{padding:"3px 6px"}}>삭제</Btn>
</div>)}
{sa?<div style={{background:C.bg,borderRadius:"8px",padding:"12px",marginTop:"8px"}}>
  <Fd label="운동 이름"><input value={nn} onChange={e=>setNn(e.target.value)} style={bi}/></Fd>
  <Fd label="카테고리"><div style={{display:"flex",gap:"3px",flexWrap:"wrap"}}>{["가슴","등","어깨","하체","팔","코어","기타"].map(c=><button key={c} onClick={()=>setNc(c)} style={{padding:"4px 10px",borderRadius:"14px",border:"none",fontSize:"10px",fontWeight:600,cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif",background:nc===c?C.ag:C.card,color:nc===c?C.accent:C.td}}>{c}</button>)}</div></Fd>
  <Fd label="기구 사진 (선택)"><div style={{display:"flex",gap:"6px",alignItems:"center"}}>{np&&<img src={np} alt="" style={{width:36,height:36,borderRadius:"5px",objectFit:"cover"}}/>}<input type="file" accept="image/*" ref={fr} onChange={e=>{const f=e.target.files?.[0];if(f){const r=new FileReader();r.onload=ev=>setNp(ev.target.result);r.readAsDataURL(f);}}} style={{display:"none"}}/><Btn variant="secondary" onClick={()=>fr.current?.click()} style={{fontSize:"10px",padding:"5px 10px"}}>{np?"변경":"사진 추가"}</Btn></div></Fd>
  <Fd label="유튜브 링크 (선택)"><input value={ny} onChange={e=>setNy(e.target.value)} style={bi} placeholder="https://youtube.com/..."/></Fd>
  <div style={{display:"flex",gap:"6px"}}><Btn onClick={()=>{if(nn.trim()){setList([...list,{id:gid(),name:nn.trim(),category:nc,photo:np,youtube:ny}]);setNn("");setNp("");setNy("");setSa(false);}}} style={{flex:1}}>추가</Btn><Btn variant="secondary" onClick={()=>setSa(false)}>취소</Btn></div>
</div>:<Btn variant="secondary" style={{width:"100%",marginTop:"8px",borderStyle:"dashed"}} onClick={()=>setSa(true)}>+ 새 운동</Btn>}
<Btn onClick={()=>onSave(list)} style={{width:"100%",marginTop:"12px"}}>저장</Btn>
</div></div>{detail&&<ExDetailModal preset={detail} onClose={()=>setDetail(null)}/>}</>;}

// ─── CUSTOM ROUTINE FORM (Trainer creates) ───
function CustomRoutineForm({presets,routine,onSave,onClose}){
  const[title,setTitle]=useState(routine?.title||"");const[desc,setDesc]=useState(routine?.desc||"");
  const[days,setDays]=useState(routine?.days||[{title:"",exercises:[{name:"",sets:"3",reps:"12",note:""}]}]);
  const addDay=()=>setDays([...days,{title:"",exercises:[{name:"",sets:"3",reps:"12",note:""}]}]);
  const addEx=(di)=>{const c=[...days];c[di].exercises=[...c[di].exercises,{name:"",sets:"3",reps:"12",note:""}];setDays(c);};
  return <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"16px"}} onClick={onClose}><div style={{background:C.card,borderRadius:"20px",padding:"22px",width:"100%",maxWidth:"560px",maxHeight:"85vh",overflowY:"auto",border:`1px solid ${C.border}`}} onClick={e=>e.stopPropagation()}>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:"12px"}}><span style={{fontSize:"15px",fontWeight:800}}>{routine?"루틴 수정":"추천 루틴 만들기"}</span><Btn variant="ghost" onClick={onClose}>✕</Btn></div>
    <Fd label="루틴 이름"><input value={title} onChange={e=>setTitle(e.target.value)} style={bi} placeholder="예: 초보자 전신 루틴"/></Fd>
    <Fd label="설명"><input value={desc} onChange={e=>setDesc(e.target.value)} style={bi} placeholder="예: 주 3회 추천"/></Fd>
    {days.map((day,di)=><div key={di} style={{background:C.bg,borderRadius:"10px",padding:"12px",marginBottom:"8px"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}><span style={{fontSize:"12px",fontWeight:700,color:C.accent}}>Day {di+1}</span>{days.length>1&&<Btn variant="danger" onClick={()=>setDays(days.filter((_,j)=>j!==di))} style={{padding:"2px 6px"}}>삭제</Btn>}</div>
      <Fd label="이름"><input value={day.title} onChange={e=>{const c=[...days];c[di]={...c[di],title:e.target.value};setDays(c);}} style={bi} placeholder="예: 상체의 날"/></Fd>
      {day.exercises.map((ex,ei)=><div key={ei} style={{display:"flex",gap:"4px",marginBottom:"4px",alignItems:"center"}}>
        <input value={ex.name} onChange={e=>{const c=[...days];c[di].exercises=[...c[di].exercises];c[di].exercises[ei]={...ex,name:e.target.value};setDays(c);}} style={{...bi,padding:"8px",flex:3}} placeholder="운동 이름"/>
        <input value={ex.sets} onChange={e=>{const c=[...days];c[di].exercises=[...c[di].exercises];c[di].exercises[ei]={...ex,sets:e.target.value};setDays(c);}} style={{...bi,padding:"8px",flex:1}} placeholder="세트"/>
        <input value={ex.reps} onChange={e=>{const c=[...days];c[di].exercises=[...c[di].exercises];c[di].exercises[ei]={...ex,reps:e.target.value};setDays(c);}} style={{...bi,padding:"8px",flex:1}} placeholder="횟수"/>
        {day.exercises.length>1&&<Btn variant="danger" onClick={()=>{const c=[...days];c[di].exercises=c[di].exercises.filter((_,k)=>k!==ei);setDays(c);}} style={{padding:"2px 5px"}}>−</Btn>}
      </div>)}
      <Btn variant="ghost" onClick={()=>addEx(di)} style={{fontSize:"10px"}}>+운동</Btn>
    </div>)}
    <Btn variant="secondary" style={{width:"100%",marginBottom:"10px",borderStyle:"dashed"}} onClick={addDay}>+ Day 추가</Btn>
    <Btn onClick={()=>{if(title.trim())onSave({id:routine?.id||gid(),title:title.trim(),desc,days});}} style={{width:"100%"}}>저장</Btn>
  </div></div>;
}

// ─── ROUTINE VIEW (auto + custom) ───
function RtView({client,presets,customRoutines,isTrainer,onSaveCustom,onDeleteCustom}){
  const auto=genRt(client,presets)||[];const[at,setAt]=useState(auto[0]?.type||"");const[showCR,setShowCR]=useState(false);const[editCR,setEditCR]=useState(null);
  const allR=[...auto,...(customRoutines||[]).map(r=>({...r,type:"custom-"+r.id}))];
  const active=allR.find(r=>r.type===(at||allR[0]?.type))||allR[0];
  if(!allR.length&&!isTrainer)return <div style={{textAlign:"center",padding:"50px",color:C.td}}><div style={{fontSize:"40px",marginBottom:"10px"}}>📝</div>수업 기록이 쌓이면 루틴이 생성됩니다</div>;
  return <><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"}}><span style={{fontSize:"17px",fontWeight:800}}>복습 루틴</span>{isTrainer&&<Btn onClick={()=>{setEditCR(null);setShowCR(true);}} style={{padding:"7px 12px",fontSize:"11px"}}>+루틴 만들기</Btn>}</div>
    <div style={{fontSize:"10px",color:C.td,marginBottom:"10px"}}>자동 생성 루틴은 수업 시 80% 무게 추천</div>
    {allR.length>0&&<><div style={{display:"flex",gap:"3px",marginBottom:"10px",flexWrap:"wrap"}}>{allR.map(r=><button key={r.type} onClick={()=>setAt(r.type)} style={{padding:"6px 12px",borderRadius:"16px",border:"none",fontSize:"10px",fontWeight:600,cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif",background:(at||allR[0]?.type)===r.type?C.ag:C.bg,color:(at||allR[0]?.type)===r.type?C.accent:C.td}}>{r.title}</button>)}</div>
    {active&&<>{active.desc&&<div style={{fontSize:"10px",color:C.td,marginBottom:"8px"}}>{active.desc}</div>}
      {active.days.map((d,i)=><div key={i} style={{background:C.card,borderRadius:"12px",padding:"12px",marginBottom:"6px",border:`1px solid ${C.border}`}}><div style={{fontSize:"12px",fontWeight:700,color:C.accent,marginBottom:"6px"}}>{d.title}</div>{d.exercises.map((ex,j)=><div key={j} style={{display:"flex",justifyContent:"space-between",padding:"6px 8px",background:C.bg,borderRadius:"6px",marginBottom:"3px"}}><span style={{fontWeight:600,fontSize:"11px"}}>{ex.name}</span><span style={{fontSize:"10px",color:C.accent,fontWeight:600}}>{ex.rec||`${ex.sets}세트×${ex.reps}회`}{ex.note?` (${ex.note})`:""}</span></div>)}</div>)}
      {isTrainer&&active.type?.startsWith("custom-")&&<div style={{display:"flex",gap:"6px",marginTop:"4px"}}><Btn variant="ghost" onClick={()=>{const cr=customRoutines.find(r=>"custom-"+r.id===active.type);setEditCR(cr);setShowCR(true);}}>수정</Btn><Btn variant="danger" onClick={()=>{const crId=active.type.replace("custom-","");onDeleteCustom(crId);setAt(allR[0]?.type||"");}}>삭제</Btn></div>}
    </>}</>}
    {showCR&&<CustomRoutineForm presets={presets} routine={editCR} onSave={r=>{onSaveCustom(r);setShowCR(false);setAt("custom-"+r.id);}} onClose={()=>setShowCR(false)}/>}
  </>;
}

// ─── TABS ───
const trTabs=[["sessions","수업"],["routine","루틴"],["info","인바디"],["attend","출석"]];
const clTabs=[["sessions","수업"],["routine","루틴"],["info","내 건강"],["attend","출석"]];

// ─── TRAINER ───
function Trainer({data,setData,onLogout}){
  const[sel,setSel]=useState(null);const[tab,setTab]=useState("sessions");
  const[showSF,setShowSF]=useState(false);const[editS,setEditS]=useState(null);
  const[showGF,setShowGF]=useState(false);const[showAC,setShowAC]=useState(false);
  const[showPM,setShowPM]=useState(false);const[showIBF,setShowIBF]=useState(false);
  const cl=sel?data.clients.find(c=>c.id===sel):null;
  const sv=useCallback(d=>{setData(d);localStorage.setItem(SK,JSON.stringify(d));},[setData]);

  if(!cl)return <div style={{fontFamily:"'Noto Sans KR',sans-serif",background:C.bg,color:C.text,minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 20px",borderBottom:`1px solid ${C.border}`,background:C.card,flexWrap:"wrap",gap:"6px"}}><div><div style={{fontSize:"10px",color:C.accent,letterSpacing:"2px",fontWeight:600}}>VANGOFIT</div><div style={{fontSize:"16px",fontWeight:800}}>회원 관리</div></div><div style={{display:"flex",gap:"6px"}}><Btn variant="secondary" onClick={()=>setShowPM(true)} style={{fontSize:"10px",padding:"6px 10px"}}>종목관리</Btn><Btn variant="secondary" onClick={onLogout} style={{fontSize:"10px",padding:"6px 10px"}}>로그아웃</Btn></div></div>
    <div style={{padding:"20px",maxWidth:"700px",margin:"0 auto"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:"12px"}}><div style={{display:"flex",gap:"6px",alignItems:"center"}}><span style={{fontSize:"16px",fontWeight:800}}>전체 회원</span><BG>{data.clients.length}명</BG></div><Btn onClick={()=>setShowAC(true)} style={{padding:"8px 14px",fontSize:"12px"}}>+ 새 회원</Btn></div>
      {data.clients.map(c=><div key={c.id} style={{background:C.card,borderRadius:"12px",padding:"12px",border:`1px solid ${C.border}`,cursor:"pointer",marginBottom:"6px"}} onClick={()=>{setSel(c.id);setTab("sessions");}} onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:"13px",fontWeight:700}}>{c.name}</div><div style={{fontSize:"10px",color:C.td}}>{c.phone}</div></div><div style={{display:"flex",alignItems:"center",gap:"6px"}}><div style={{textAlign:"right"}}><div style={{fontSize:"14px",fontWeight:800,color:C.accent}}>{c.sessions.length}</div><div style={{fontSize:"8px",color:C.td}}>수업</div></div><Btn variant="danger" onClick={e=>{e.stopPropagation();if(confirm("삭제?")){sv({...data,clients:data.clients.filter(x=>x.id!==c.id)});}}} style={{padding:"3px 6px"}}>✕</Btn></div></div></div>)}
    </div>
    {showAC&&<AddCl onSave={nc=>{sv({...data,clients:[...data.clients,nc]});setShowAC(false);}} onClose={()=>setShowAC(false)} pins={data.clients.map(c=>c.pin)}/>}
    {showPM&&<PresetMgr presets={data.presets||[]} onSave={p=>{sv({...data,presets:p});setShowPM(false);}} onClose={()=>setShowPM(false)}/>}
  </div>;

  return <div style={{fontFamily:"'Noto Sans KR',sans-serif",background:C.bg,color:C.text,minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 20px",borderBottom:`1px solid ${C.border}`,background:C.card}}><div style={{display:"flex",alignItems:"center",gap:"10px"}}><Btn variant="secondary" onClick={()=>setSel(null)} style={{padding:"5px 8px"}}>←</Btn><div><div style={{fontSize:"9px",color:C.accent,letterSpacing:"2px",fontWeight:600}}>VANGOFIT</div><div style={{fontSize:"15px",fontWeight:800}}>{cl.name}</div></div></div><Btn variant="secondary" onClick={onLogout} style={{fontSize:"10px",padding:"6px 10px"}}>로그아웃</Btn></div>
    <div style={{display:"flex",gap:"2px",padding:"10px 20px",background:C.card,borderBottom:`1px solid ${C.border}`,overflowX:"auto"}}>{trTabs.map(([k,l])=><button key={k} onClick={()=>setTab(k)} style={{padding:"7px 12px",borderRadius:"10px",border:"none",fontSize:"11px",fontWeight:tab===k?700:500,cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif",whiteSpace:"nowrap",background:tab===k?C.ag:"transparent",color:tab===k?C.accent:C.td}}>{l}</button>)}</div>
    <div style={{padding:"20px",maxWidth:"700px",margin:"0 auto"}}>
      {tab==="sessions"&&<><div style={{display:"flex",justifyContent:"space-between",marginBottom:"10px"}}><span style={{fontSize:"16px",fontWeight:800}}>수업 기록</span><Btn onClick={()=>{setEditS(null);setShowSF(true);}} style={{padding:"8px 12px",fontSize:"12px"}}>+ 새 기록</Btn></div>{!cl.sessions.length?<div style={{textAlign:"center",padding:"50px",color:C.td}}>수업 기록이 없습니다</div>:[...cl.sessions].sort((a,b)=>b.date.localeCompare(a.date)).map(s=><div key={s.id}><SesDet session={s} presets={data.presets} onSaveClientMemo={(sid,m)=>{sv({...data,clients:data.clients.map(c=>c.id!==sel?c:{...c,sessions:c.sessions.map(x=>x.id===sid?{...x,clientMemo:m}:x)})});}} /><div style={{display:"flex",gap:"4px",marginTop:"-4px",marginBottom:"6px"}}><Btn variant="ghost" onClick={()=>{setEditS(s);setShowSF(true);}}>수정</Btn><Btn variant="danger" onClick={()=>{if(confirm("삭제?"))sv({...data,clients:data.clients.map(c=>c.id!==sel?c:{...c,sessions:c.sessions.filter(x=>x.id!==s.id)})});}}>삭제</Btn></div></div>)}</>}
      {tab==="routine"&&<RtView client={cl} presets={data.presets} customRoutines={data.customRoutines||[]} isTrainer onSaveCustom={r=>{const existing=(data.customRoutines||[]).find(x=>x.id===r.id);sv({...data,customRoutines:existing?(data.customRoutines||[]).map(x=>x.id===r.id?r:x):[...(data.customRoutines||[]),r]});}} onDeleteCustom={id=>{sv({...data,customRoutines:(data.customRoutines||[]).filter(x=>x.id!==id)});}} />}
      {tab==="info"&&<InbodyView client={cl} isTrainer onEdit={()=>setShowGF(true)} onAddRecord={()=>setShowIBF(true)}/>}
      {tab==="attend"&&<AttendanceView client={cl} isTrainer onSave={att=>sv({...data,clients:data.clients.map(c=>c.id!==sel?c:{...c,attendance:att})})} onSavePT={pt=>sv({...data,clients:data.clients.map(c=>c.id!==sel?c:{...c,pt})})}/>}
    </div>
    {showSF&&<SesForm presets={data.presets||[]} session={editS} onSave={s=>{sv({...data,clients:data.clients.map(c=>c.id!==sel?c:{...c,sessions:c.sessions.find(x=>x.id===s.id)?c.sessions.map(x=>x.id===s.id?s:x):[s,...c.sessions]})});setShowSF(false);setEditS(null);}} onClose={()=>{setShowSF(false);setEditS(null);}}/>}
    {showGF&&<GoalsForm client={cl} onSave={(g,a,go,n)=>{sv({...data,clients:data.clients.map(c=>c.id!==sel?c:{...c,gender:g,age:a,goals:go,notes:n})});setShowGF(false);}} onClose={()=>setShowGF(false)}/>}
    {showIBF&&<InbodyForm onSave={rec=>{sv({...data,clients:data.clients.map(c=>c.id!==sel?c:{...c,inbodyHistory:[...(c.inbodyHistory||[]).filter(x=>x.id!==rec.id),rec]})});setShowIBF(false);}} onClose={()=>setShowIBF(false)} title="인바디 기록"/>}
  </div>;
}

// ─── CLIENT ───
function Client({data,setData,clientId,onLogout}){
  const cl=data.clients.find(c=>c.id===clientId);const[tab,setTab]=useState("sessions");const[showIBF,setShowIBF]=useState(false);const[showGF,setShowGF]=useState(false);
  if(!cl)return <div style={{padding:"40px",textAlign:"center",color:C.td}}>회원 정보 없음</div>;
  const sv=d=>{setData(d);localStorage.setItem(SK,JSON.stringify(d));};
  return <div style={{fontFamily:"'Noto Sans KR',sans-serif",background:C.bg,color:C.text,minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 20px",borderBottom:`1px solid ${C.border}`,background:C.card}}><div><div style={{fontSize:"9px",color:C.accent,letterSpacing:"2px",fontWeight:600}}>VANGOFIT</div><div style={{fontSize:"15px",fontWeight:800}}>{cl.name}님</div></div><Btn variant="secondary" onClick={onLogout} style={{fontSize:"10px",padding:"6px 10px"}}>로그아웃</Btn></div>
    <div style={{display:"flex",gap:"2px",padding:"10px 20px",background:C.card,borderBottom:`1px solid ${C.border}`,overflowX:"auto"}}>{clTabs.map(([k,l])=><button key={k} onClick={()=>setTab(k)} style={{padding:"7px 12px",borderRadius:"10px",border:"none",fontSize:"11px",fontWeight:tab===k?700:500,cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif",whiteSpace:"nowrap",background:tab===k?C.ag:"transparent",color:tab===k?C.accent:C.td}}>{l}</button>)}</div>
    <div style={{padding:"20px",maxWidth:"500px",margin:"0 auto"}}>
      {tab==="sessions"&&<><span style={{fontSize:"16px",fontWeight:800,display:"block",marginBottom:"10px"}}>수업 기록</span>{!cl.sessions.length?<div style={{textAlign:"center",padding:"50px",color:C.td}}>수업 기록이 없습니다</div>:[...cl.sessions].sort((a,b)=>b.date.localeCompare(a.date)).map(s=><SesDet key={s.id} session={s} presets={data.presets} isClient onSaveClientMemo={(sid,m)=>{sv({...data,clients:data.clients.map(c=>c.id!==clientId?c:{...c,sessions:c.sessions.map(x=>x.id===sid?{...x,clientMemo:m}:x)})});}}/>)}</>}
      {tab==="routine"&&<RtView client={cl} presets={data.presets} customRoutines={data.customRoutines||[]}/>}
      {tab==="info"&&<InbodyView client={cl} onEdit={()=>setShowGF(true)} onAddRecord={()=>setShowIBF(true)}/>}
      {tab==="attend"&&<AttendanceView client={cl} onSave={att=>sv({...data,clients:data.clients.map(c=>c.id!==clientId?c:{...c,attendance:att})})} onSavePT={()=>{}}/>}
    </div>
    {showIBF&&<InbodyForm onSave={rec=>{sv({...data,clients:data.clients.map(c=>c.id!==clientId?c:{...c,inbodyHistory:[...(c.inbodyHistory||[]).filter(x=>x.id!==rec.id),rec]})});setShowIBF(false);}} onClose={()=>setShowIBF(false)} title="인바디 기록"/>}
    {showGF&&<GoalsForm client={cl} isClient onSave={(g,a,go,n)=>{sv({...data,clients:data.clients.map(c=>c.id!==clientId?c:{...c,gender:g,age:a,goals:go,notes:n})});setShowGF(false);}} onClose={()=>setShowGF(false)}/>}
  </div>;
}

// ─── LOGIN ───
function Login({onLogin}){const[mode,setMode]=useState("select");const[pin,setPin]=useState("");const[err,setErr]=useState("");
const go=t=>{const s=localStorage.getItem(SK);const d=s?JSON.parse(s):defData;if(t==="trainer"){if(pin===d.trainer.pin)onLogin({type:"trainer"});else setErr("PIN 불일치");}else{const c=d.clients.find(c=>c.pin===pin);if(c)onLogin({type:"client",clientId:c.id});else setErr("PIN 확인");}};
return <div style={{fontFamily:"'Noto Sans KR',sans-serif",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:"20px",background:`linear-gradient(160deg,${C.bg},#12131A,${C.bg})`,color:C.text}}>
  <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"radial-gradient(ellipse at 25% 15%,rgba(212,168,67,0.05) 0%,transparent 55%)",pointerEvents:"none"}}/>
  <div style={{background:C.card,borderRadius:"20px",padding:"40px 32px",width:"100%",maxWidth:"350px",border:`1px solid ${C.border}`,boxShadow:"0 20px 60px rgba(0,0,0,0.5)"}}>
    <div style={{textAlign:"center",marginBottom:"24px"}}>
      <div style={{fontSize:"28px",fontWeight:900,color:C.accent,letterSpacing:"-1px"}}>VangoFit</div>
      <div style={{fontSize:"11px",color:C.td,marginTop:"4px",letterSpacing:"2px"}}>YOUR BODY, YOUR JOURNEY</div>
    </div>
    <div style={{fontSize:"20px",fontWeight:800,textAlign:"center",marginBottom:"24px"}}>{mode==="select"?"로그인":mode==="trainer"?"트레이너":"회원"}</div>
    {mode==="select"?<div style={{display:"flex",flexDirection:"column",gap:"10px"}}><Btn onClick={()=>setMode("trainer")} style={{width:"100%",padding:"13px"}}>트레이너</Btn><Btn variant="secondary" onClick={()=>setMode("client")} style={{width:"100%",padding:"13px"}}>회원</Btn></div>
    :<><input style={{...bi,padding:"13px 16px",marginBottom:"10px"}} type="password" placeholder={mode==="trainer"?"PIN (기본: 1234)":"회원 PIN"} value={pin} onChange={e=>{setPin(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&go(mode)}/>{err&&<div style={{color:C.danger,fontSize:"11px",marginBottom:"6px"}}>{err}</div>}<Btn onClick={()=>go(mode)} style={{width:"100%",marginBottom:"8px"}}>로그인</Btn><Btn variant="ghost" onClick={()=>{setMode("select");setErr("");setPin("");}} style={{width:"100%"}}>← 돌아가기</Btn></>}
  </div>
  <div style={{marginTop:"16px",fontSize:"10px",color:C.td}}>안동 · 형민 트레이너</div>
</div>;}

// ─── APP ───
export default function App(){
  const[user,setUser]=useState(null);
  const[data,setData]=useState(()=>{try{const s=localStorage.getItem(SK);return s?JSON.parse(s):defData;}catch{return defData;}});
  useEffect(()=>{try{localStorage.setItem(SK,JSON.stringify(data));}catch{}},[data]);
  if(!user)return <Login onLogin={setUser}/>;
  if(user.type==="trainer")return <Trainer data={data} setData={setData} onLogout={()=>setUser(null)}/>;
  return <Client data={data} setData={setData} clientId={user.clientId} onLogout={()=>setUser(null)}/>;
}