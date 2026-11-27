/* Minha Lista de Mercado — conta Google, sincronização e família
   Autor: Eder Rodrigues — LIVREZON TECNOLOGIA
   Carregado depois do script principal (usa S, save, render, FB, fbInit…). */
"use strict";

/* ---------- saneamento (dados de backup, nuvem ou aparelho) ---------- */
const SAN={
  s:(v,max)=>String(v==null?"":v).replace(/[\u0000-\u001f\u007f]/g," ").slice(0,max),
  n:(v,max)=>{const x=+v;return Number.isFinite(x)?Math.min(Math.max(x,0),max):0},
  id:v=>/^[A-Za-z0-9_-]{1,40}$/.test(String(v||""))?String(v):null
};
function sanItem(i){
  const id=SAN.id(i&&i.id);if(!id)return null;
  const name=SAN.s(i.name,80).trim();if(!name)return null;
  return{id,name,cat:SAN.s(i.cat||"Outros",40),unit:UNITS.includes(i.unit)?i.unit:"un",price:SAN.n(i.price,1e6),min:SAN.n(i.min,1e5),stock:SAN.n(i.stock,1e5),barcode:SAN.s(i.barcode,40).replace(/[^0-9A-Za-z-]/g,"")};
}
function sanHist(h){
  const id=SAN.id(h&&h.id);if(!id)return null;
  const entries=(Array.isArray(h.entries)?h.entries:[]).slice(0,400).map(e=>({itemId:SAN.id(e&&e.itemId)||"",name:SAN.s(e&&e.name,80),cat:SAN.s(e&&e.cat,40),unit:SAN.s(e&&e.unit,12),qty:SAN.n(e&&e.qty,1e5),price:SAN.n(e&&e.price,1e6),prev:SAN.n(e&&e.prev,1e6)}));
  return{id,date:Number.isFinite(+h.date)?Math.round(+h.date):Date.now(),store:SAN.s(h.store,80),listName:SAN.s(h.listName,80),budget:SAN.n(h.budget,1e7),total:SAN.n(h.total,1e7),refTotal:SAN.n(h.refTotal,1e7),missing:Math.round(SAN.n(h.missing,400)),by:SAN.s(h.by,40),entries};
}
function sanList(l){
  const id=SAN.id(l&&l.id);if(!id)return null;
  const out={id,name:SAN.s(l.name,80)||"Lista",budget:SAN.n(l.budget,1e7),created:Number.isFinite(+l.created)?+l.created:Date.now(),done:false,
    entries:(Array.isArray(l.entries)?l.entries:[]).slice(0,400).map(e=>({itemId:SAN.id(e&&e.itemId)||"",qty:SAN.n(e&&e.qty,1e5)||1,price:SAN.n(e&&e.price,1e6),checked:!!(e&&e.checked),by:SAN.s(e&&e.by,40)})).filter(e=>e.itemId)};
  if(l.shared&&/^[A-Za-z0-9]{20,40}$/.test(l.shared.id||""))out.shared={id:l.shared.id,owner:!!l.shared.owner};
  return out;
}
function sanitizeState(d){
  const b=blank();if(!d||typeof d!=="object")return b;
  b.items=(Array.isArray(d.items)?d.items:[]).slice(0,5000).map(sanItem).filter(Boolean);
  b.history=(Array.isArray(d.history)?d.history:[]).slice(0,5000).map(sanHist).filter(Boolean);
  b.lists=(Array.isArray(d.lists)?d.lists:[]).slice(0,200).map(sanList).filter(Boolean);
  const cats=(Array.isArray(d.cats)?d.cats:[]).map(c=>SAN.s(c,40).trim()).filter(Boolean);
  b.cats=cats.length?[...new Set(cats)].slice(0,40):DEF_CATS.slice();
  b.seeded=true;
  if(d.me)b.me=SAN.s(d.me,20);
  if(d.consent&&d.consent.v)b.consent={v:SAN.s(d.consent.v,8),at:+d.consent.at||0};
  if(d.cloud&&SAN.id(d.cloud.hid))b.cloud={hid:d.cloud.hid,uid:SAN.s(d.cloud.uid,128),email:SAN.s(d.cloud.email,120)};
  return b;
}
/* backup restaurado passa pelo saneamento */
restore=async function(txt){
  let d;try{d=JSON.parse(txt)}catch(e){toast("Backup inválido");return}
  if(!d||!Array.isArray(d.items)){toast("Backup inválido");return}
  const c=sanitizeState(d);
  if(await ask(`Restaurar backup com ${c.items.length} itens e ${c.history.length} compras? Os dados atuais serão substituídos.`,"Restaurar")){
    const keep={consent:S.consent,cloud:S.cloud,me:S.me||c.me};S=Object.assign(c,keep);save();toast("Backup restaurado");stack=[];go("home",null,false)}
};

/* ---------- limpeza dos itens de exemplo (só os que nunca foram usados) ---------- */
const SEED_DEF={"Arroz":["Mercearia","pct",1],"Feijão":["Mercearia","pct",1],"Açúcar":["Mercearia","pct",1],"Café":["Mercearia","pct",1],"Óleo":["Mercearia","garrafa",1],"Leite":["Laticínios","L",6],"Ovos":["Hortifruti","dz",1],"Pão":["Padaria","un",0],"Banana":["Hortifruti","kg",0],"Papel higiênico":["Higiene","pct",1],"Sabão em pó":["Limpeza","cx",1],"Detergente":["Limpeza","un",2]};
function cleanSeeds(){
  const used=new Set();S.lists.forEach(l=>l.entries.forEach(e=>used.add(e.itemId)));S.history.forEach(h=>h.entries.forEach(e=>used.add(e.itemId)));
  const n=S.items.length;
  S.items=S.items.filter(i=>{const d=Object.prototype.hasOwnProperty.call(SEED_DEF,i.name)?SEED_DEF[i.name]:null;
    return !(d&&i.cat===d[0]&&i.unit===d[1]&&(+i.min||0)===d[2]&&!(+i.stock)&&!(+i.price)&&!i.barcode&&!used.has(i.id))});
  return n-S.items.length;
}
if(!S.cloud&&!S.seedClean){const n=cleanSeeds();S.seedClean=true;n?save():persistLocalEarly()}
function persistLocalEarly(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}

/* ---------- conta Google ---------- */
const CL={hid:null,h:null,subs:[],cache:{items:{},history:{},meta:null},timer:0,merged:false,attaching:null,err:0};
const authU=()=>FB.m&&FB.app?FB.m.getAuth(FB.app).currentUser:null;
const isGoogle=u=>!!(u&&!u.isAnonymous&&u.providerData.some(p=>p.providerId==="google.com"));
const cloudOn=()=>!!(S.cloud&&CL.hid);
const hdoc=hid=>FB.m.doc(FB.db,"households",hid);
const hcol=(hid,c)=>FB.m.collection(FB.db,"households",hid,c);
const isPremium=()=>!!(CL.h&&CL.h.plan==="premium"&&CL.h.planUntil&&CL.h.planUntil.toMillis()>Date.now());
const isOwnerH=()=>!!(CL.h&&FB.uid&&CL.h.ownerUid===FB.uid);

async function signInGoogle(){
  if(!fbOn()){toast("Login indisponível");return}
  if(!navigator.onLine){toast("Conecte-se à internet para entrar");return}
  try{
    await fbInit();
    const auth=FB.m.getAuth(FB.app),prov=new FB.m.GoogleAuthProvider();prov.setCustomParameters({prompt:"select_account"});
    const u=auth.currentUser;
    try{
      if(u&&u.isAnonymous)await FB.m.linkWithPopup(u,prov);else await FB.m.signInWithPopup(auth,prov);
    }catch(e){
      if(e.code==="auth/credential-already-in-use"||e.code==="auth/email-already-in-use"){
        const cred=FB.m.GoogleAuthProvider.credentialFromError(e);if(!cred)throw e;await FB.m.signInWithCredential(auth,cred);
      }else if(e.code==="auth/popup-blocked"||e.code==="auth/operation-not-supported-in-this-environment"){
        try{sessionStorage.setItem("mercado.redirect","1")}catch(x){}await FB.m.signInWithRedirect(auth,prov);return;
      }else if(e.code==="auth/popup-closed-by-user"||e.code==="auth/cancelled-popup-request"||e.code==="auth/user-cancelled")return;
      else throw e;
    }
    await auth.currentUser.getIdToken(true);FB.uid=auth.currentUser.uid;
    await attachCloud();
    toast("Conta conectada ☁️");render();
  }catch(e){console.warn(e);toast("Não foi possível entrar com o Google")}
}
async function signOutGoogle(){
  if(!await ask("Sair da conta Google? Os dados continuam neste aparelho, mas deixam de sincronizar.","Sair"))return;
  detachCloud();S.cloud=null;save();
  try{await FB.m.signOut(FB.m.getAuth(FB.app));FB.uid=null;FB.ready=null}catch(e){}
  toast("Você saiu da conta");render();
}

/* ---------- ligar a sincronização ---------- */
function attachCloud(){
  if(CL.attaching)return CL.attaching;
  CL.attaching=(async()=>{
    const u=authU();if(!isGoogle(u))return;
    const m=FB.m,db=FB.db,me=u.uid;
    let hid=null;
    try{const us=await m.getDoc(m.doc(db,"users",me));if(us.exists())hid=us.data().householdId||null}catch(e){}
    if(hid){try{await m.getDoc(hdoc(hid))}catch(e){hid=null}}
    if(!hid){
      hid=me;let exists=false;
      try{exists=(await m.getDoc(hdoc(hid))).exists()}catch(e){exists=false}
      if(!exists)await m.setDoc(hdoc(hid),{ownerUid:me,members:{[me]:true},name:SAN.s("Família de "+(S.me||u.displayName||"").trim(),60),createdAt:m.serverTimestamp()});
    }
    await m.setDoc(m.doc(db,"users",me),{email:u.email,name:SAN.s(S.me||u.displayName||"",40),householdId:hid,updatedAt:m.serverTimestamp()});
    startSync(hid,u);
  })().finally(()=>{CL.attaching=null});
  return CL.attaching;
}
function detachCloud(){CL.subs.forEach(f=>{try{f()}catch(e){}});CL.subs=[];CL.hid=null;CL.h=null;CL.merged=false;CL.cache={items:{},history:{},meta:null};clearTimeout(CL.timer)}
function startSync(hid,u){
  detachCloud();
  const m=FB.m,prev=S.cloud&&S.cloud.hid;CL.hid=hid;
  if(prev!==hid){S.cloud={hid,uid:u.uid,email:u.email};persistLocal()}
  CL.subs.push(m.onSnapshot(hdoc(hid),s=>{CL.h=s.exists()?s.data():null;masterAutoPremium();softRender()},err=>{console.warn(err);onRemoved()}));
  let first={items:true,history:true,meta:true};
  const done=()=>{if(!first.items&&!first.history&&!first.meta&&!CL.merged){CL.merged=true;mergeAndPush()}};
  CL.subs.push(m.onSnapshot(hcol(hid,"items"),s=>{applyItems(s);first.items=false;done()},e=>console.warn(e)));
  CL.subs.push(m.onSnapshot(hcol(hid,"history"),s=>{applyHistory(s);first.history=false;done()},e=>console.warn(e)));
  CL.subs.push(m.onSnapshot(m.doc(FB.db,"households",hid,"meta","main"),s=>{applyMeta(s);first.meta=false;done()},e=>{first.meta=false;done()}));
}
/* conta Master: a própria família fica Premium (registrado na auditoria) */
let masterAuto=false;
async function masterAutoPremium(){
  if(masterAuto||!CL.h||!isOwnerH()||isPremium())return;
  const u=authU();if(!(u&&u.email&&(window.MASTER_EMAILS||[]).map(e=>e.toLowerCase()).includes(u.email.toLowerCase())))return;
  masterAuto=true;const m=FB.m;
  try{
    await m.addDoc(m.collection(FB.db,"audit"),{at:m.serverTimestamp(),email:u.email,action:"grant_premium",target:CL.hid,reason:"Acesso Master: família do proprietário",details:"automático"});
    await m.updateDoc(hdoc(CL.hid),{plan:"premium",planUntil:m.Timestamp.fromMillis(Date.UTC(2100,0,1)),planSource:"master"});
    toast("⭐ Premium ativado na sua família (Acesso Master)");
  }catch(e){console.warn(e);masterAuto=false}
}
function onRemoved(){
  if(!CL.hid)return;const was=CL.hid;detachCloud();
  toast("Você não faz mais parte dessa família. Seus dados continuam neste aparelho.");
  const u=authU();if(isGoogle(u)&&was!==u.uid){S.cloud={hid:u.uid,uid:u.uid,email:u.email};persistLocal();attachCloud().catch(()=>{})}
}
function persistLocal(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}

/* ---------- formatos na nuvem ---------- */
const itemDoc=i=>({name:SAN.s(i.name,80),cat:SAN.s(i.cat,40),unit:SAN.s(i.unit,12),price:SAN.n(i.price,1e6),min:SAN.n(i.min,1e5),stock:SAN.n(i.stock,1e5),barcode:SAN.s(i.barcode||"",40)});
const histDoc=h=>{const x=sanHist(h)||{};delete x.id;return x};
const key=o=>JSON.stringify(o);

/* ---------- nuvem → aparelho ---------- */
function applyItems(snap){
  let ch=false;
  snap.docChanges().forEach(c=>{
    const id=c.doc.id;
    if(c.type==="removed"){if(CL.cache.items[id]!==undefined){const i=S.items.findIndex(x=>x.id===id);if(i>=0&&key(itemDoc(S.items[i]))===CL.cache.items[id]){S.items.splice(i,1);ch=true}delete CL.cache.items[id]}return}
    const r=c.doc.data(),it=sanItem({id,...r});if(!it)return;
    const L=S.items.find(x=>x.id===id),remoteKey=key(itemDoc(it));
    if(L&&CL.cache.items[id]!==undefined&&key(itemDoc(L))!==CL.cache.items[id])return; // alteração local ainda não enviada
    if(L){if(key(itemDoc(L))!==remoteKey){Object.assign(L,it);ch=true}}else{S.items.push(it);ch=true}
    CL.cache.items[id]=remoteKey;
  });
  if(ch){persistLocal();softRender()}
}
function applyHistory(snap){
  let ch=false;
  snap.docChanges().forEach(c=>{
    const id=c.doc.id;
    if(c.type==="removed"){const i=S.history.findIndex(x=>x.id===id);if(i>=0){S.history.splice(i,1);ch=true}delete CL.cache.history[id];return}
    const h=sanHist({id,...c.doc.data()});if(!h)return;
    const i=S.history.findIndex(x=>x.id===id);
    if(i>=0)S.history[i]=Object.assign(S.history[i],h);else S.history.push(h);
    CL.cache.history[id]=key(histDoc(h));ch=true;
  });
  if(ch){S.history.sort((a,b)=>b.date-a.date);persistLocal();softRender()}
}
function applyMeta(snap){
  if(!snap.exists())return;const d=snap.data(),cats=(Array.isArray(d.cats)?d.cats:[]).map(c=>SAN.s(c,40)).filter(Boolean);
  if(!cats.length)return;
  if(!CL.merged){CL.cache.meta=key(cats);return}
  if(CL.cache.meta!==null&&key(S.cats)!==CL.cache.meta)return;
  CL.cache.meta=key(cats);if(key(S.cats)!==CL.cache.meta){S.cats=cats;persistLocal();softRender()}
}

/* ---------- primeira junção: une itens pelo nome, sem duplicar ---------- */
function mergeAndPush(){
  const remoteByName={};
  S.items.forEach(i=>{if(CL.cache.items[i.id]!==undefined)remoteByName[i.name.toLowerCase()]=i.id});
  const remap={};
  S.items=S.items.filter(i=>{
    if(CL.cache.items[i.id]!==undefined)return true;
    const r=remoteByName[i.name.toLowerCase()];
    if(r&&r!==i.id){remap[i.id]=r;const R=S.items.find(x=>x.id===r);if(R&&!R.barcode&&i.barcode)R.barcode=i.barcode;return false}
    return true;
  });
  if(Object.keys(remap).length){
    S.lists.forEach(l=>l.entries.forEach(e=>{if(remap[e.itemId])e.itemId=remap[e.itemId]}));
    S.history.forEach(h=>h.entries.forEach(e=>{if(remap[e.itemId])e.itemId=remap[e.itemId]}));
  }
  if(CL.cache.meta!==null){const extra=S.cats.filter(c=>!JSON.parse(CL.cache.meta).includes(c));S.cats=[...JSON.parse(CL.cache.meta),...extra].slice(0,40)}
  if(!S.seedCleanCloud){cleanSeeds();S.seedCleanCloud=true;S.seedClean=true}
  persistLocal();pushNow();render();
}

/* ---------- aparelho → nuvem ---------- */
function queueCloud(){if(!cloudOn()||!CL.merged)return;clearTimeout(CL.timer);CL.timer=setTimeout(pushNow,600)}
function pushNow(){
  if(!cloudOn()||!CL.merged)return;
  const m=FB.m,hid=CL.hid,by=FB.uid,t=Date.now(),fail=e=>{console.warn(e);if(Date.now()-CL.err>8000){CL.err=Date.now();toast("Falha ao sincronizar com a nuvem")}};
  const ids=new Set();
  S.items.forEach(i=>{ids.add(i.id);const d=itemDoc(i),k=key(d);if(CL.cache.items[i.id]!==k){CL.cache.items[i.id]=k;m.setDoc(m.doc(FB.db,"households",hid,"items",i.id),{...d,t,by}).catch(fail)}});
  Object.keys(CL.cache.items).forEach(id=>{if(!ids.has(id)){delete CL.cache.items[id];m.deleteDoc(m.doc(FB.db,"households",hid,"items",id)).catch(fail)}});
  const hids=new Set();
  S.history.forEach(h=>{hids.add(h.id);const d=histDoc(h),k=key(d);if(CL.cache.history[h.id]!==k){CL.cache.history[h.id]=k;m.setDoc(m.doc(FB.db,"households",hid,"history",h.id),{...d,t,uid:by}).catch(fail)}});
  Object.keys(CL.cache.history).forEach(id=>{if(!hids.has(id)){delete CL.cache.history[id];m.deleteDoc(m.doc(FB.db,"households",hid,"history",id)).catch(fail)}});
  const ck=key(S.cats);if(CL.cache.meta!==ck){CL.cache.meta=ck;m.setDoc(m.doc(FB.db,"households",hid,"meta","main"),{cats:S.cats.slice(0,40).map(c=>SAN.s(c,40)),t,by}).catch(fail)}
}
const _save=save;
save=function(){_save();queueCloud()};

/* ---------- família ---------- */
function familyLink(code){return location.origin+location.pathname.replace(/index\.html$/,"")+"#f-"+CL.hid+"."+code}
async function inviteFamily(){
  if(!isOwnerH()){toast("Só quem criou a família pode convidar");return}
  if(!isPremium()){premiumSheet("Família compartilhada");return}
  try{
    const code=rid(24);
    await FB.m.setDoc(FB.m.doc(FB.db,"households",CL.hid,"invites",code),{expiresAt:FB.m.Timestamp.fromMillis(Date.now()+47*3600e3),createdAt:FB.m.serverTimestamp()});
    const link=familyLink(code),msg=`🏡 Entre na nossa família no app Minha Lista de Mercado (itens, o que tem em casa e histórico juntos): ${link}`;
    sheet(`<h3>Convite para a família</h3><div class="mu sm">Vale por 48 horas. Quem abrir entra com a conta Google e passa a ver e editar os dados da família.</div>
    <div class="card" style="margin-top:10px;word-break:break-all;font-size:14px">${esc(link)}</div>
    <a class="btn full" style="text-decoration:none;margin-bottom:8px;background:#25D366;color:#fff" href="https://wa.me/?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">Enviar pelo WhatsApp</a>
    <button class="btn sec full" id="cp">📋 Copiar link</button><button class="btn ghost full" id="x" style="margin-top:10px">Fechar</button>`,mm=>{mm.querySelector("#cp").onclick=()=>copy(link,"Link copiado");mm.querySelector("#x").onclick=close});
  }catch(e){console.warn(e);toast("Não foi possível criar o convite")}
}
async function joinFamily(hid,code){
  if(!SAN.id(hid)||!/^[A-Za-z0-9]{20,40}$/.test(code)){toast("Convite inválido");return}
  if(!isGoogle(authU())){
    sheet(`<h3>Convite para família</h3><div class="mu sm">Para entrar na família, conecte sua conta Google.</div><button class="btn full" id="g" style="margin-top:14px">Entrar com Google</button><button class="btn ghost full" id="x" style="margin-top:8px">Agora não</button>`,mm=>{
      mm.querySelector("#x").onclick=close;mm.querySelector("#g").onclick=async()=>{close();await signInGoogle();if(isGoogle(authU()))joinFamily(hid,code)}});
    return;
  }
  if(CL.hid===hid){toast("Você já faz parte dessa família");return}
  if(!await ask("Entrar nessa família? Seus itens e seu histórico serão juntados aos da família, e todos poderão vê-los e editá-los.","Entrar"))return;
  try{
    const m=FB.m,inv=await m.getDoc(m.doc(FB.db,"households",hid,"invites",code));
    if(!inv.exists()||inv.data().expiresAt.toMillis()<Date.now()){toast("Convite vencido ou inválido. Peça um novo.");return}
    await m.updateDoc(hdoc(hid),{["members."+FB.uid]:true,lastInvite:code});
    const u=authU();
    await m.setDoc(m.doc(FB.db,"users",u.uid),{email:u.email,name:SAN.s(S.me||u.displayName||"",40),householdId:hid,updatedAt:m.serverTimestamp()});
    startSync(hid,u);toast("Você entrou na família 🏡");stack=[];go("settings",null,false);
  }catch(e){console.warn(e);toast("Não foi possível entrar. O convite pode estar vencido ou a família cheia (máx. 6).")}
}
async function leaveFamily(){
  if(isOwnerH()){toast("Você é o dono desta família");return}
  if(!await ask("Sair da família? Uma cópia dos dados fica neste aparelho e vai para a sua própria conta.","Sair",true))return;
  try{
    const m=FB.m,was=CL.hid;detachCloud();
    await m.updateDoc(hdoc(was),{["members."+FB.uid]:m.deleteField()});
    const u=authU();S.cloud={hid:u.uid,uid:u.uid,email:u.email};
    await m.setDoc(m.doc(FB.db,"users",u.uid),{email:u.email,name:SAN.s(S.me||u.displayName||"",40),householdId:null,updatedAt:m.serverTimestamp()});
    await attachCloud();toast("Você saiu da família");render();
  }catch(e){console.warn(e);toast("Não foi possível sair agora");attachCloud().catch(()=>{})}
}
async function resetMembers(){
  if(!isOwnerH())return;
  if(!await ask("Remover todos os outros membros da família? Eles perdem o acesso aos dados da família.","Remover",true))return;
  try{await FB.m.updateDoc(hdoc(CL.hid),{members:{[FB.uid]:true}});toast("Membros removidos")}catch(e){toast("Não foi possível remover")}
}

/* ---------- excluir conta (LGPD) ---------- */
async function wipeHousehold(hid){
  const m=FB.m;
  for(const c of ["items","history","meta","invites"]){
    const s=await m.getDocs(hcol(hid,c));await Promise.all(s.docs.map(d=>m.deleteDoc(d.ref)));
  }
  await m.deleteDoc(hdoc(hid));
}
async function deleteAccount(){
  const u=authU();if(!isGoogle(u))return;
  const others=CL.h?Object.keys(CL.h.members||{}).filter(x=>x!==u.uid).length:0;
  const msg=isOwnerH()&&others?`Excluir sua conta e TODOS os dados da família na nuvem (${others} outro(s) membro(s) perdem o acesso)? Isso não pode ser desfeito.`:"Excluir sua conta Google do app e todos os seus dados na nuvem? Isso não pode ser desfeito. Os dados deste aparelho continuam até você apagá-los.";
  if(!await ask(msg,"Excluir conta",true))return;
  sheet(`<div class="empty"><span class="i">🗑️</span>Excluindo seus dados da nuvem…</div>`);
  try{
    const m=FB.m,hid=CL.hid;detachCloud();
    if(hid===u.uid)await wipeHousehold(hid);
    else{if(hid)await m.updateDoc(hdoc(hid),{["members."+u.uid]:m.deleteField()}).catch(()=>{});try{await wipeHousehold(u.uid)}catch(e){}}
    await m.deleteDoc(m.doc(FB.db,"users",u.uid));
    try{await FB.m.deleteUser(u)}catch(e){if(e.code==="auth/requires-recent-login"){await FB.m.reauthenticateWithPopup(u,new FB.m.GoogleAuthProvider());await FB.m.deleteUser(u)}else throw e}
    S.cloud=null;save();FB.uid=null;FB.ready=null;close();toast("Conta e dados da nuvem excluídos");render();
  }catch(e){console.warn(e);close();toast("Não foi possível concluir. Tente de novo ou escreva para contato@livrezon.com.br");attachCloud().catch(()=>{})}
}

/* ---------- Premium (assinatura vem na Fase 2) ---------- */
function premiumSheet(feature){
  sheet(`<div style="text-align:center"><span style="font-size:38px">⭐</span><h3>${esc(feature)} é Premium</h3>
  <div class="mu">Família sincronizada, chat da família com “onde cada um está” no mercado, painel de gastos com gráficos, comparação de preços e de mercados, alertas, meta mensal e importação do cupom fiscal.</div>
  <div class="okbox" style="margin-top:12px">A assinatura dentro do app chega em breve.</div></div>
  <button class="btn full" id="x" style="margin-top:12px">Entendi</button>`,mm=>mm.querySelector("#x").onclick=close);
}

/* ---------- tela "Conta e família" (em Opções) ---------- */
function accountHTML(){
  if(!fbOn())return"";
  const u=authU(),g=isGoogle(u);
  if(!g)return`<h2>Conta</h2><div class="card"><div class="row"><span style="font-size:28px">☁️</span><div class="grow"><b>Entre com o Google</b><div class="mu sm">Seus itens, o que tem em casa e o histórico salvos na nuvem e iguais em todos os seus aparelhos.</div></div></div>
    <button class="btn full" id="gin" style="margin-top:12px">Entrar com Google</button></div>`;
  const h=CL.h,n=h?Object.keys(h.members||{}).length:1,prem=isPremium();
  return`<h2>Conta e família</h2><div class="card">
   <div class="kv"><span>Conta</span><b style="word-break:break-all">${esc(u.email||"")}</b></div>
   <div class="kv"><span>Sincronização</span><b class="${CL.merged?"pos":""}">${CL.merged?"☁️ Ativa":"⏳ Conectando…"}</b></div>
   <div class="kv"><span>Família</span><b>${esc(h&&h.name||"—")} · ${n} pessoa(s)</b></div>
   <div class="kv"><span>Plano</span><b>${prem?`⭐ Premium até ${dt(h.planUntil.toMillis())}`:(typeof isMasterUser==="function"&&isMasterUser()?"Master (acesso total)":"Grátis")}</b></div>
   <div class="grid2" style="margin-top:12px">${isOwnerH()?`<button class="btn sec" id="finv">👨‍👩‍👧 Convidar</button>`:`<button class="btn ghost" id="fleave">🚪 Sair da família</button>`}<button class="btn ghost" id="gout">Sair da conta</button></div>
   ${isOwnerH()&&n>1?`<button class="btn ghost full" id="freset" style="margin-top:8px">Remover os outros membros</button>`:""}
   <button class="btn danger full" id="gdel" style="margin-top:8px">Excluir minha conta e dados da nuvem</button></div>`;
}
function bindAccount(){
  const b=(id,f)=>{const e=$(id);e&&(e.onclick=f)};
  b("#gin",signInGoogle);b("#gout",signOutGoogle);b("#finv",inviteFamily);b("#fleave",leaveFamily);b("#freset",resetMembers);b("#gdel",deleteAccount);
}
const _home=VIEWS.home;
VIEWS.home=()=>{const r=_home();let b="";
  if(fbOn()){const u=authU();
    if(!isGoogle(u))b=`<div class="card row" style="margin-bottom:12px;border-color:var(--au)"><span style="font-size:26px">☁️</span><div class="grow"><b>Entre com sua conta Google</b><div class="mu sm">Sincronize seus aparelhos e use os recursos Premium da sua conta.</div></div><button class="btn" id="ginH" style="flex:none">Entrar</button></div>`;
    else b=`<div class="row" style="margin:0 2px 10px;gap:6px;flex-wrap:wrap"><span class="badge ${isPremium()?"b-low":"b-ok"}">${isPremium()?"⭐ Premium":"Grátis"}</span><span class="mu sm" style="overflow:hidden;text-overflow:ellipsis">${esc(u.email||"")}</span></div>`}
  return{...r,html:b+r.html,after(){r.after&&r.after();const g=$("#ginH");g&&(g.onclick=signInGoogle)}}};
const _settings=VIEWS.settings;
VIEWS.settings=()=>{const r=_settings();return{...r,html:accountHTML()+r.html,after(){r.after&&r.after();bindAccount()}}};
softRender=function(){const a=document.activeElement;if($("#layer").firstChild||(a&&a.matches&&a.matches("#app input, #app textarea, #app select"))){pendingRender=true;return}render()};

/* ---------- início ---------- */
(async function bootCloud(){
  if(!fbOn())return;
  const fm=location.hash.match(/^#f-([A-Za-z0-9_-]{1,40})\.([A-Za-z0-9]{20,40})$/);
  if(fm){try{history.replaceState({root:1},"",location.pathname)}catch(e){}}
  let redirect=false;try{redirect=sessionStorage.getItem("mercado.redirect")==="1";sessionStorage.removeItem("mercado.redirect")}catch(e){}
  if(!S.cloud&&!fm&&!redirect)return;
  try{
    await fbInit();
    if(redirect){try{await FB.m.getRedirectResult(FB.m.getAuth(FB.app))}catch(e){if(e.code==="auth/credential-already-in-use"){const c=FB.m.GoogleAuthProvider.credentialFromError(e);c&&await FB.m.signInWithCredential(FB.m.getAuth(FB.app),c)}}FB.uid=authU()&&authU().uid}
    if(isGoogle(authU()))await attachCloud();else if(S.cloud){S.cloud=null;persistLocal()}
    if(fm)joinFamily(fm[1],fm[2]);
    render();
  }catch(e){console.warn(e)}
})();
