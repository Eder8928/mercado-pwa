/* Minha Lista de Mercado — chat da família e "onde cada um está"
   Autor: Eder Rodrigues — LIVREZON TECNOLOGIA
   Disponível para famílias Premium e para a conta Master. Carregado depois de cloud.js. */
"use strict";

const CH={hid:null,subs:[],msgs:[],pres:{},cleaned:false,lastSeenAlert:0};
const CHAT_DAYS=7;
const isMasterUser=()=>{const u=authU();return !!(u&&u.email&&(window.MASTER_EMAILS||[]).map(e=>e.toLowerCase()).includes(u.email.toLowerCase()))};
const chatAllowed=()=>cloudOn()&&(isPremium()||isMasterUser());
const myChatName=()=>SAN.s(S.me||((authU()&&authU().displayName)||"").split(" ")[0]||"Eu",30);
const tsMs=t=>t&&t.toMillis?t.toMillis():0;
const ago=ms=>{if(!ms)return"agora";const m=Math.round((Date.now()-ms)/60000);if(m<1)return"agora";if(m<60)return`há ${m} min`;const h=Math.round(m/60);if(h<24)return`há ${h} h`;return dt(ms)};
const SPOTS=()=>[...S.cats,"Caixa","Estacionamento","Saindo"].slice(0,44);

/* ---------- assinatura dos dados ---------- */
function chatStop(){CH.subs.forEach(f=>{try{f()}catch(e){}});CH.subs=[];CH.hid=null;CH.msgs=[];CH.pres={};CH.cleaned=false;navChat()}
function chatSync(){
  const ok=chatAllowed();
  if(!ok){if(CH.hid)chatStop();else navChat();return}
  if(CH.hid===CL.hid)return;
  chatStop();CH.hid=CL.hid;const m=FB.m,hid=CH.hid;
  const since=FB.m.Timestamp.fromMillis(Date.now()-CHAT_DAYS*864e5);
  CH.subs.push(m.onSnapshot(m.query(m.collection(FB.db,"households",hid,"chat"),m.where("at",">=",since),m.orderBy("at"),m.limit(300)),s=>{
    const before=CH.msgs.length;
    CH.msgs=s.docs.map(d=>({id:d.id,...d.data()}));
    const fresh=s.docChanges().filter(c=>c.type==="added"&&c.doc.data().uid!==FB.uid&&!c.doc.metadata.hasPendingWrites);
    if(before&&fresh.length&&view!=="chat"){try{navigator.vibrate&&navigator.vibrate([60,40,60])}catch(e){}toast("💬 "+SAN.s(fresh[fresh.length-1].doc.data().name,30)+": nova mensagem")}
    if(view==="chat"){markSeen();drawChat()}navChat();
  },e=>{console.warn(e);chatStop()}));
  CH.subs.push(m.onSnapshot(m.collection(FB.db,"households",hid,"presence"),s=>{
    CH.pres={};s.docs.forEach(d=>CH.pres[d.id]=d.data());if(view==="chat")drawPresence();
  },e=>console.warn(e)));
  if(!CH.cleaned){CH.cleaned=true;cleanupOld(hid)}
  navChat();
}
async function cleanupOld(hid){
  try{const m=FB.m,q=await m.getDocs(m.query(m.collection(FB.db,"households",hid,"chat"),m.where("at","<",FB.m.Timestamp.fromMillis(Date.now()-CHAT_DAYS*864e5)),m.limit(100)));
    await Promise.all(q.docs.map(d=>m.deleteDoc(d.ref).catch(()=>{})))}catch(e){}
}
setInterval(chatSync,4000);

/* ---------- aba e contador de não lidas ---------- */
const unread=()=>{const seen=+S.chatSeen||0;return CH.msgs.filter(x=>x.uid!==FB.uid&&tsMs(x.at)>seen).length};
function markSeen(){const last=CH.msgs.reduce((a,x)=>Math.max(a,tsMs(x.at)),0);if(last>(+S.chatSeen||0)){S.chatSeen=last;persistLocal()}}
function navChat(){
  const b=$("#navChat");if(!b)return;const ok=chatAllowed();b.hidden=!ok;
  const n=ok?unread():0,badge=b.querySelector(".nbadge");badge.textContent=n>9?"9+":String(n);badge.hidden=!n;
}

/* ---------- envio ---------- */
async function sendMsg(o){
  if(!chatAllowed()){premiumSheet("Chat da família");return}
  const m=FB.m,d={uid:FB.uid,name:myChatName(),kind:o.kind||"text",text:SAN.s(o.text||"",500),sector:SAN.s(o.sector||"",40),at:m.serverTimestamp()};
  if(o.kind==="loc"){d.lat=o.lat;d.lng=o.lng;d.acc=o.acc}
  try{await m.addDoc(m.collection(FB.db,"households",CH.hid,"chat"),d)}catch(e){console.warn(e);toast("Não foi possível enviar")}
}
async function setSpot(sector){
  const m=FB.m;
  try{await m.setDoc(m.doc(FB.db,"households",CH.hid,"presence",FB.uid),{name:myChatName(),sector:SAN.s(sector,40),at:m.serverTimestamp()})}catch(e){console.warn(e)}
  sendMsg({kind:"sector",sector,text:""});
}
function shareLocation(){
  if(!navigator.geolocation){toast("Localização indisponível neste aparelho");return}
  ask("Enviar sua localização atual para a família? Ela fica visível no chat por até 7 dias.","Enviar").then(ok=>{
    if(!ok)return;toast("Obtendo localização…");
    navigator.geolocation.getCurrentPosition(p=>{
      const lat=Math.round(p.coords.latitude*1e5)/1e5,lng=Math.round(p.coords.longitude*1e5)/1e5,acc=Math.min(Math.round(p.coords.accuracy||0),100000);
      if(!(lat>=-90&&lat<=90&&lng>=-180&&lng<=180)){toast("Localização inválida");return}
      sendMsg({kind:"loc",lat,lng,acc,text:""});
    },e=>toast(e.code===1?"Permita o acesso à localização para este app":"Não foi possível obter a localização"),{enableHighAccuracy:true,timeout:15000,maximumAge:30000});
  });
}
async function delMsg(id){
  if(!await ask("Apagar esta mensagem para todos?","Apagar",true))return;
  try{await FB.m.deleteDoc(FB.m.doc(FB.db,"households",CH.hid,"chat",id))}catch(e){toast("Não foi possível apagar")}
}

/* ---------- tela ---------- */
function msgHTML(x){
  const mine=x.uid===FB.uid,t=tsMs(x.at);
  let body;
  if(x.kind==="sector")body=`📍 Estou em <b>${esc(x.sector)}</b>`;
  else if(x.kind==="loc"&&Number.isFinite(+x.lat)&&Number.isFinite(+x.lng))body=`🗺️ <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((+x.lat)+","+(+x.lng))}" target="_blank" rel="noopener noreferrer">Ver minha localização no mapa</a>${x.acc?`<div class="mu sm">precisão de ~${esc(x.acc)} m</div>`:""}`;
  else body=esc(x.text).replace(/\n/g,"<br>");
  return`<div class="msg ${mine?"me":""}${x.kind!=="text"?" sys":""}">${mine?"":`<div class="who2">${esc(x.name)}</div>`}<div>${body}</div><div class="mt">${t?new Date(t).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}):"enviando…"}${mine||isOwnerH()?` · <button class="lnk" data-dm="${esc(x.id)}">apagar</button>`:""}</div></div>`;
}
function presenceHTML(){
  const list=Object.entries(CH.pres).filter(([,p])=>tsMs(p.at)>Date.now()-3*3600e3).sort((a,b)=>tsMs(b[1].at)-tsMs(a[1].at));
  if(!list.length)return`<div class="mu sm">Ninguém informou onde está ainda. Toque num setor abaixo.</div>`;
  return list.map(([u,p])=>`<span class="pchip${u===FB.uid?" mine":""}"><b>${esc(u===FB.uid?"Você":p.name)}</b> · ${esc(p.sector)} <span class="mu">${ago(tsMs(p.at))}</span></span>`).join("");
}
function drawPresence(){const e=$("#pres");e&&(e.innerHTML=presenceHTML())}
function drawChat(){
  const box=$("#msgs");if(!box)return;const atBottom=box.scrollHeight-box.scrollTop-box.clientHeight<80;
  box.innerHTML=CH.msgs.length?CH.msgs.map(msgHTML).join(""):`<div class="empty"><span class="i">💬</span>Nenhuma mensagem nos últimos ${CHAT_DAYS} dias.</div>`;
  box.querySelectorAll("[data-dm]").forEach(b=>b.onclick=()=>delMsg(b.dataset.dm));
  if(atBottom||!box.dataset.init){box.scrollTop=box.scrollHeight;box.dataset.init=1}
}
VIEWS.chat=()=>{
  if(!chatAllowed())return{title:"Chat da família",html:`<div class="empty"><span class="i">💬</span>O chat da família é um recurso Premium.<br><br><button class="btn" id="prem">Saiba mais</button></div>`,after(){$("#prem").onclick=()=>premiumSheet("Chat da família")}};
  return{title:"Chat da família",html:`
  <div class="card" style="padding:12px"><div class="mu sm" style="margin-bottom:6px">Onde cada um está</div><div id="pres" class="pwrap">${presenceHTML()}</div></div>
  <div class="mu sm" style="margin:2px 4px 6px">Estou em:</div>
  <div class="chips">${SPOTS().map(s=>`<button class="chip" data-sp="${esc(s)}">${esc(s)}</button>`).join("")}</div>
  <div id="msgs" class="msgs"></div>
  <div class="chips" style="padding-top:8px">${["Onde você está?","Já peguei ✅","Não achei 😕","Vou para o caixa 🛒","Me espera 🙏"].map(q=>`<button class="chip" data-q="${esc(q)}">${esc(q)}</button>`).join("")}<button class="chip" id="loc">📍 Minha localização</button></div>
  <div class="row chatin"><input id="txt" maxlength="500" placeholder="Mensagem para a família" enterkeyhint="send"><button class="btn" id="send" style="flex:none" aria-label="Enviar">➤</button></div>
  <div class="mu sm" style="text-align:center;margin-top:8px">Mensagens visíveis só para a sua família e apagadas após ${CHAT_DAYS} dias.</div>`,
  after(){
    markSeen();navChat();drawChat();
    const t=$("#txt"),go2=()=>{const v=t.value.trim();if(!v)return;t.value="";sendMsg({text:v})};
    $("#send").onclick=go2;t.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();go2()}};
    document.querySelectorAll("[data-sp]").forEach(b=>b.onclick=()=>setSpot(b.dataset.sp));
    document.querySelectorAll("[data-q]").forEach(b=>b.onclick=()=>sendMsg({text:b.dataset.q}));
    $("#loc").onclick=shareLocation;
  }};
};
TOP.push("chat");

/* ---------- integração ---------- */
const _detach=detachCloud;
detachCloud=function(){chatStop();_detach()};
const _wipe=wipeHousehold;
wipeHousehold=async function(hid){
  const m=FB.m;
  for(const c of ["chat","presence"]){try{const s=await m.getDocs(m.collection(FB.db,"households",hid,c));await Promise.all(s.docs.map(d=>m.deleteDoc(d.ref)))}catch(e){}}
  return _wipe(hid);
};
/* o chat redesenha só as partes que mudam; não recarrega a tela enquanto se digita */
const _soft2=softRender;
softRender=function(){if(view==="chat"){drawChat();drawPresence();return}_soft2()};
navChat();
/* redesenha a tela já com conta, limpeza e chat carregados */
render();
