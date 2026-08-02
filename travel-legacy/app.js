/* ============================================================
   STATE + HELPERS
   ============================================================ */
let DATA;                     // {meta, stops}
let TRIP;                     // computed stops
let EDIT = null;              // working copy while editing
let map, pastLayer, futLayer, markPast, markFut;

const now = new Date();
const TODAY = new Date(now.getFullYear(),now.getMonth(),now.getDate());
const DAY = 86400000;
const $ = id => document.getElementById(id);
const parse = d => new Date(d+"T00:00:00");
const formatISODate = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const fmtDate = d => parse(d).toLocaleDateString('en-US',{month:'short',day:'numeric'});
const fmtDateY = d => parse(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
const flag = cc => (cc||"").toUpperCase().replace(/[^A-Z]/g,'').replace(/./g,c=>String.fromCodePoint(127397+c.charCodeAt(0)));
const esc = s => (s||"").replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const safeDate = v => ISO_DATE.test(v||'') ? v : '';
const validateTrip = window.TripValidation.validateTrip;

function statusOf(s){
  const a=parse(s.arrive), d=parse(s.depart);
  if(TODAY < a) return "future";
  if(TODAY >= a && TODAY < d) return "current";
  return "past";
}
function computeTrip(stops){
  return stops.map((s,i)=>({...s, i, status:statusOf(s), nights:Math.max(0,Math.round((parse(s.depart)-parse(s.arrive))/DAY))}));
}
function haversine(a,b){
  const R=6371, toR=x=>x*Math.PI/180;
  const dLat=toR(b.lat-a.lat), dLon=toR(b.lon-a.lon), la1=toR(a.lat), la2=toR(b.lat);
  const h=Math.sin(dLat/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}
const distFromPrev = idx => idx<=0 ? 0 : haversine(TRIP[idx-1],TRIP[idx]);
const continentOf = cc => ({TH:'Asia',VN:'Asia',CN:'Asia',HK:'Asia',TW:'Asia',KG:'Asia',KZ:'Asia',UZ:'Asia',TJ:'Asia',KR:'Asia',JP:'Asia',TR:'Asia',SY:'Asia',IQ:'Asia',GE:'Asia',AM:'Asia',US:'N. America',MX:'N. America',GT:'N. America',CA:'N. America',CO:'S. America',PE:'S. America',BO:'S. America',CL:'S. America',AR:'S. America',BR:'S. America',FR:'Europe',NL:'Europe',DE:'Europe',DK:'Europe',SE:'Europe',FI:'Europe',EE:'Europe',LV:'Europe',LT:'Europe',PL:'Europe',CZ:'Europe',SK:'Europe',AT:'Europe',HU:'Europe',BA:'Europe',MK:'Europe',BG:'Europe',SI:'Europe',HR:'Europe',IT:'Europe',ES:'Europe',PT:'Europe',GB:'Europe',GR:'Europe'}[cc]||'—');

/* ============================================================
   RENDER
   ============================================================ */
function renderHeader(){
  const m=DATA.meta||{};
  if(m.subtitle) $('subtitle').textContent=m.subtitle;
}
function renderStats(){
  const start=parse(TRIP[0].arrive);
  const daysGone=Math.max(0,Math.round((TODAY-start)/DAY));
  const visited=TRIP.filter(s=>s.status!=="future");
  const current=TRIP.find(s=>s.status==="current");
  const countries=new Set(visited.map(s=>s.cc));
  let totalKm=0; for(let i=1;i<TRIP.length;i++) if(TRIP[i].status!=="future") totalKm+=distFromPrev(i);
  const continents=new Set(visited.map(s=>continentOf(s.cc)));
  const nightsTotal=visited.reduce((a,s)=>a+s.nights,0);
  const longest=visited.reduce((mx,s)=>s.nights>mx.nights?s:mx, visited[0]||TRIP[0]);
  const S=[
    {num:daysGone, lbl:"Days on the road"},
    {num:countries.size, lbl:"Countries & territories"},
    {num:visited.length, lbl:"Stops so far"},
    {num:(totalKm/1000).toFixed(1)+"k", lbl:"Kilometres travelled"},
    {num:continents.size, lbl:"Continents"},
    {num:TRIP.filter(s=>s.status==="future").length, lbl:"Stops still to come"},
  ];
  $('stats').innerHTML=S.map(s=>`<div class="stat"><div class="num">${s.num}</div><div class="lbl">${s.lbl}</div></div>`).join('');
  $('stats2').innerHTML=[
    longest?`<span class="chip">Longest stay · <b>${esc(longest.name)}, ${longest.nights} nights</b></span>`:'',
    visited.length?`<span class="chip">Avg <b>${(nightsTotal/visited.length).toFixed(1)} nights</b> per stop</span>`:'',
    daysGone?`<span class="chip"><b>~${Math.round(totalKm/daysGone)} km</b> / day pace</span>`:'',
    `<span class="chip">Continents · <b>${[...continents].join(' · ')}</b></span>`,
  ].join('');
  if(current){
    $('nowline').innerHTML=`In <b style="color:var(--txt)">${flag(current.cc)} ${esc(current.name)}, ${esc(current.country)}</b> · night ${Math.max(1,Math.round((TODAY-parse(current.arrive))/DAY)+1)} of ${current.nights} · leaving ${fmtDate(current.depart)}`;
  } else {
    const next=TRIP.find(s=>s.status==="future");
    $('nowline').innerHTML = next?`Next stop <b style="color:var(--txt)">${flag(next.cc)} ${esc(next.name)}</b> · ${fmtDateY(next.arrive)}`:`Journey complete — ${visited.length} stops`;
  }
  $('startlbl').textContent=fmtDateY(TRIP[0].arrive);
  $('daylbl').textContent=daysGone;
}

function themeName(){ return document.documentElement.getAttribute('data-theme')==='dusk'?'dusk':'day'; }
function applyTheme(name){
  if(name==='dusk') document.documentElement.setAttribute('data-theme','dusk');
  else document.documentElement.removeAttribute('data-theme');
  try{ sessionStorage.setItem('tlwr_theme', themeName()); }catch(e){}
  const btn=$('themeToggle');
  if(btn) btn.textContent = themeName()==='dusk' ? 'Day' : 'Dusk';
}
function initTheme(){
  let pref='day';
  try{ pref=sessionStorage.getItem('tlwr_theme')||'day'; }catch(e){}
  applyTheme(pref);
}
function themeColors(){
  if(themeName()==='dusk') return {past:'#9bb5a2', future:'#d08968', good:'#6fbf91', tile:'dark_all'};
  return {past:'#3a5344', future:'#9a4a2e', good:'#2f6b4f', tile:'rastertiles/voyager'};
}

function markerFor(s){
  const isCur=s.status==="current", isFut=s.status==="future";
  const c=themeColors();
  const color=isCur?c.good:isFut?c.future:c.past;
  const m=L.circleMarker([s.lat,s.lon],{radius:isCur?7:isFut?5:4,color,weight:isFut?2:1.5,fillColor:color,fillOpacity:isFut?0.18:0.92});
  const q=s.note?`<div class="popq">${esc(s.note)}</div>`:'';
  const tag=isCur?' · <span style="color:var(--good)">here now</span>':isFut?(s.tentative?' · <span style="color:var(--warm)">tentative</span>':' · <span style="color:var(--future)">planned</span>'):'';
  m.bindPopup(`<b>${flag(s.cc)} ${esc(s.name)}</b>${tag}<br>${fmtDate(s.arrive)} – ${fmtDate(s.depart)} · ${s.nights} nights<br><span style="color:var(--muted)">${esc(s.country)}</span>${q}`);
  return m;
}
function renderMap(){
  if(map){ map.remove(); map=null; }
  const c=themeColors();
  map=L.map('map',{worldCopyJump:true,scrollWheelZoom:false,zoomControl:true}).setView([25,40],2);
  L.tileLayer(`https://{s}.basemaps.cartocdn.com/${c.tile}/{z}/{x}/{y}{r}.png`,{attribution:'© OpenStreetMap contributors © CARTO',subdomains:'abcd',maxZoom:19}).addTo(map);
  const pastLL=TRIP.filter(s=>s.status!=="future").map(s=>[s.lat,s.lon]);
  const statuses=TRIP.map(s=>s.status);
  const lastVisited=statuses.lastIndexOf("current")>=0?statuses.lastIndexOf("current"):statuses.lastIndexOf("past");
  const futLL=TRIP.filter((s,i)=>s.status==="future"||i===lastVisited).map(s=>[s.lat,s.lon]);
  const pastLine=L.polyline(pastLL,{color:c.past,weight:2.5,opacity:.88,smoothFactor:1});
  const futLine=L.polyline(futLL,{color:c.future,weight:2.25,opacity:.9,dashArray:'2 7',lineCap:'round'});
  pastLayer=L.layerGroup([pastLine]).addTo(map);
  futLayer=L.layerGroup([futLine]).addTo(map);
  markPast=L.layerGroup().addTo(map); markFut=L.layerGroup().addTo(map);
  TRIP.forEach(s=>{ const m=markerFor(s); s._marker=m; (s.status==="future"?markFut:markPast).addLayer(m); });
  if(pastLL.length>1) map.fitBounds(pastLine.getBounds().pad(0.15));
  else if(TRIP.length) map.setView([TRIP[0].lat,TRIP[0].lon],4);
  const toggleLayer=(button,routeLayer,markerLayer)=>{
    button.classList.toggle('on');
    const on=button.classList.contains('on');
    button.setAttribute('aria-pressed',String(on));
    if(on){map.addLayer(routeLayer);map.addLayer(markerLayer);}
    else{map.removeLayer(routeLayer);map.removeLayer(markerLayer);}
  };
  $('tgPast').onclick=()=>toggleLayer($('tgPast'),pastLayer,markPast);
  $('tgFut').onclick=()=>toggleLayer($('tgFut'),futLayer,markFut);
  if(!$('tgPast').classList.contains('on')){map.removeLayer(pastLayer);map.removeLayer(markPast);}
  if(!$('tgFut').classList.contains('on')){map.removeLayer(futLayer);map.removeLayer(markFut);}
}

function packCue(minC,maxC,precip){
  let msg,ico;
  if(minC<0){ico="🧥";msg="Serious winter kit — insulated coat, hat & gloves.";}
  else if(minC<7){ico="🧣";msg="Cold — warm coat and layers needed.";}
  else if(minC<13){ico="🧥";msg="Cool — a proper jacket for evenings.";}
  else if(minC<19){ico="🧢";msg="Mild — a light layer will do.";}
  else if(maxC<28){ico="👕";msg="Warm & pleasant — t-shirt weather.";}
  else{ico="🩳";msg="Hot — shorts and sun cover.";}
  if(precip>=6) msg+=" Pack a rain shell.";
  return {ico,msg};
}
const tempPct = c => Math.max(0,Math.min(100,((c-(-5))/(38-(-5)))*100));

function renderLegs(){
  const upcoming=TRIP.filter(s=>s.status==="future");
  const el=$('legs');
  if(!upcoming.length){ el.innerHTML=`<div class="skel">No upcoming stops planned yet — add some with ✎ Edit trip.</div>`; return; }
  el.innerHTML=upcoming.map((s,idx)=>{
    const isNext=idx===0, distPrev=distFromPrev(s.i);
    const badge=s.tentative?`<div class="badge tent">Tentative</div>`:isNext?`<div class="badge">Up next</div>`:'';
    return `<div class="leg ${isNext?'next':''}" data-i="${s.i}" role="button" tabindex="0" aria-label="Show ${esc(s.name)} on the map">
      ${badge}<div class="flag">${flag(s.cc)}</div>
      <h3>${esc(s.name)}</h3>
      <div class="dates">${fmtDateY(s.arrive)} – ${fmtDate(s.depart)} · ${esc(s.country)}</div>
      <div class="legmeta">
        <span><b>${s.nights}</b> nights</span>
        <span><b>${Math.round(distPrev).toLocaleString()}</b> km from prev.</span>
        <span>starts in <b>${Math.max(0,Math.round((parse(s.arrive)-TODAY)/DAY))}</b> d</span>
      </div>
      <div class="wxbody" id="wx-${s.i}"><div class="skel">Loading seasonal weather…</div></div>
    </div>`;
  }).join('');
  el.querySelectorAll('.leg').forEach(node=>{
    const showOnMap=()=>{const s=TRIP[+node.dataset.i]; map.setView([s.lat,s.lon],6,{animate:true}); s._marker.openPopup(); $('map').scrollIntoView({behavior:'smooth',block:'center'});};
    node.onclick=showOnMap;
    node.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showOnMap();}};
  });
  loadWeather(upcoming);
}

async function fetchClimate(s){
  const start=parse(s.arrive), end=parse(s.depart);
  start.setFullYear(start.getFullYear()-1);
  end.setFullYear(end.getFullYear()-1);
  const sd=formatISODate(start), ed=formatISODate(end);
  const url=`https://archive-api.open-meteo.com/v1/archive?latitude=${s.lat}&longitude=${s.lon}&start_date=${sd}&end_date=${ed}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,daylight_duration&timezone=auto`;
  const r=await fetch(url); if(!r.ok) throw new Error('archive '+r.status);
  const d=(await r.json()).daily; const avg=a=>a.reduce((x,y)=>x+(y??0),0)/a.length;
  return {maxC:avg(d.temperature_2m_max),minC:avg(d.temperature_2m_min),precip:avg(d.precipitation_sum),daylight:avg(d.daylight_duration)/3600};
}
function renderWx(s,w){
  const el=$('wx-'+s.i); if(!el) return;
  const pk=packCue(w.minC,w.maxC,w.precip), hi=Math.round(w.maxC), lo=Math.round(w.minC);
  el.innerHTML=`<div class="wx">
    <div class="cell"><div class="k">Typical high</div><div class="v">${hi}°<small> C</small></div></div>
    <div class="cell"><div class="k">Typical low</div><div class="v">${lo}°<small> C</small></div></div>
    <div class="cell"><div class="k">Daylight</div><div class="v">${w.daylight.toFixed(1)}<small> hrs</small></div></div>
    <div class="cell"><div class="k">Rain</div><div class="v">${w.precip.toFixed(1)}<small> mm/day</small></div></div>
  </div>
  <div class="tempbar-wrap"><div class="tempbar"></div>
    <div class="tmark" title="low ${lo}°" style="left:${tempPct(w.minC)}%"></div>
    <div class="tmark" title="high ${hi}°" style="left:${tempPct(w.maxC)}%;background:var(--hot);border-color:var(--bg)"></div>
  </div>
  <div class="pack"><span class="ico">${pk.ico}</span><span>${pk.msg}</span></div>`;
}
async function loadWeather(upcoming){
  for(const s of upcoming){
    try{
      const w=await fetchClimate(s); renderWx(s,w);
      if(s._marker){
        const pk=packCue(w.minC,w.maxC,w.precip), q=s.note?`<div class="popq">${esc(s.note)}</div>`:'';
        const tag=s.tentative?' · <span style="color:var(--warm)">tentative</span>':' · <span style="color:var(--future)">planned</span>';
        s._marker.setPopupContent(`<b>${flag(s.cc)} ${esc(s.name)}</b>${tag}<br>${fmtDate(s.arrive)} – ${fmtDate(s.depart)} · ${s.nights} nights<br><span style="color:var(--muted)">Typically ${Math.round(w.maxC)}°/${Math.round(w.minC)}°C · ${w.daylight.toFixed(1)}h daylight</span><br><span style="color:var(--muted)">${pk.ico} ${pk.msg}</span>${q}`);
      }
    }catch(e){ const el=$('wx-'+s.i); if(el) el.innerHTML=`<div class="wxfail">Couldn't load weather right now — Open‑Meteo may be rate‑limiting. Reload to retry.</div>`; }
  }
}

let tlExpanded=false;
function renderTimeline(){
  const el=$('tl'); let lastYear=null;
  const futStart=TRIP.findIndex(s=>s.status!=="past");
  const shown=tlExpanded?TRIP:TRIP.slice(Math.max(0,(futStart<0?TRIP.length:futStart)-6));
  el.innerHTML=shown.map(s=>{
    const yr=s.arrive.slice(0,4); let head='';
    if(yr!==lastYear){head=`<div class="tlyear">${yr}</div>`;lastYear=yr;}
    const cls=s.status==="future"?"fut":s.status==="current"?"cur":"";
    const note=s.note?`<div class="note">${esc(s.note)}</div>`:'';
    return `${head}<div class="tlrow ${cls}"><div class="when">${fmtDate(s.arrive)}<br><span style="color:var(--faint)">${s.nights}n</span></div>
      <div class="what"><div class="place"><span class="flag">${flag(s.cc)}</span>${esc(s.name)}<span style="color:var(--faint);font-weight:400"> · ${esc(s.country)}</span></div>${note}</div></div>`;
  }).join('');
}
$('tlmore').onclick=function(){
  tlExpanded=!tlExpanded;
  renderTimeline();
  this.textContent=tlExpanded?'Show less ↑':'Show the full journey ↓';
  this.setAttribute('aria-expanded',String(tlExpanded));
};

function renderAll(){
  TRIP=computeTrip(DATA.stops);
  renderHeader(); renderStats(); renderMap(); renderLegs(); renderTimeline();
}

/* ============================================================
   EDITOR
   ============================================================ */
let AUTH_LOGIN = null;

async function refreshAuth(){
  const el=$('authState'), loginBtn=$('ghLogin'), logoutBtn=$('ghLogout');
  try{
    const r=await fetch('/.netlify/functions/auth-me',{credentials:'same-origin',cache:'no-store'});
    const j=await r.json().catch(()=>({}));
    if(r.ok && j.login){
      AUTH_LOGIN=j.login;
      el.textContent='Signed in as '+j.login;
      el.className='authstate ok';
      loginBtn.style.display='none';
      logoutBtn.style.display='';
      return true;
    }
  }catch(e){}
  AUTH_LOGIN=null;
  el.textContent='Not signed in';
  el.className='authstate no';
  loginBtn.style.display='';
  logoutBtn.style.display='none';
  return false;
}

function consumeAuthQuery(){
  const u=new URL(location.href);
  const auth=u.searchParams.get('auth');
  if(!auth) return;
  const reason=u.searchParams.get('reason')||'';
  u.searchParams.delete('auth');
  u.searchParams.delete('reason');
  history.replaceState({},'',u.pathname+u.search+u.hash);
  if(auth==='ok'){
    openEditor();
    edMsg('Signed in with GitHub.','ok');
  }else{
    const map={not_allowed:'That GitHub account is not allowed to edit this trip.',bad_state:'Sign-in expired — try again.',token_exchange:'GitHub token exchange failed.',missing_code:'Sign-in was cancelled.',user:'Could not read GitHub user.',server:'Sign-in failed on the server.'};
    openEditor();
    edMsg('✕ '+(map[reason]||'Sign-in failed.'),'err');
  }
}

let edFilter='all';
function edRows(){
  const list=$('rowlist');
  list.innerHTML=EDIT.stops.map((s,i)=>{
    const st=statusOf(s);
    if(edFilter==='past' && st==='future') return '';
    if(edFilter==='fut' && st!=='future') return '';
    const cls=st==='future'?'isfut':st==='current'?'iscur':'ispast';
    return `<div class="erow ${cls}" data-i="${i}">
      <div class="idx">${i+1}</div>
      <input class="f-name" value="${esc(s.name)}" placeholder="City" aria-label="Stop ${i+1} place">
      <input class="f-country" value="${esc(s.country)}" placeholder="Country" aria-label="Stop ${i+1} country">
      <input class="f-arrive" type="date" value="${safeDate(s.arrive)}" aria-label="Stop ${i+1} arrival date">
      <input class="f-depart" type="date" value="${safeDate(s.depart)}" aria-label="Stop ${i+1} departure date">
      <div class="acts">
        <button class="icobtn" type="button" title="Look up coordinates" aria-label="Look up coordinates for stop ${i+1}" data-act="geo">⌖</button>
        <button class="icobtn" type="button" title="Insert stop below" aria-label="Insert a stop below stop ${i+1}" data-act="ins">+</button>
        <button class="icobtn" type="button" title="Move up" aria-label="Move stop ${i+1} up" data-act="up">↑</button>
        <button class="icobtn" type="button" title="Move down" aria-label="Move stop ${i+1} down" data-act="down">↓</button>
        <button class="icobtn del" type="button" title="Delete" aria-label="Delete stop ${i+1}" data-act="del">✕</button>
      </div>
      <div class="full"><input class="f-note" value="${esc(s.note||'')}" placeholder="Note (optional)" aria-label="Stop ${i+1} note"></div>
      <div class="tentwrap"><label><input type="checkbox" class="f-tent" ${s.tentative?'checked':''}> tentative</label></div>
    </div>`;
  }).join('') || `<div class="skel">No stops in this view.</div>`;
  // bind field edits
  list.querySelectorAll('.erow').forEach(row=>{
    const i=+row.dataset.i, s=EDIT.stops[i];
    const bindDate=(sel,key)=>{
      const el=row.querySelector(sel); if(!el) return;
      el.onchange=()=>{
        const v=safeDate(el.value);
        if(v){ s[key]=v; el.value=v; }
        else { el.value=safeDate(s[key]); }
      };
    };
    // Name / country auto-locate: fill CC, lat, lon from the place (country disambiguates).
    const nameEl=row.querySelector('.f-name');
    nameEl.onchange=async()=>{ s.name=nameEl.value; await geocodeRow(i,row); };
    const cnEl=row.querySelector('.f-country');
    cnEl.onchange=async()=>{ s.country=cnEl.value; await geocodeRow(i,row); };
    bindDate('.f-arrive','arrive'); bindDate('.f-depart','depart');
    const note=row.querySelector('.f-note'); note.onchange=()=>{const v=note.value.trim(); if(v)s.note=v; else delete s.note;};
    const tent=row.querySelector('.f-tent'); tent.onchange=()=>{ if(tent.checked)s.tentative=true; else delete s.tentative; };
    row.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>rowAction(b.dataset.act,i));
  });
}
async function rowAction(act,i){
  if(act==='del'){ if(confirm('Delete '+EDIT.stops[i].name+'?')){ EDIT.stops.splice(i,1); edRows(); } return; }
  if(act==='up' && i>0){ [EDIT.stops[i-1],EDIT.stops[i]]=[EDIT.stops[i],EDIT.stops[i-1]]; edRows(); return; }
  if(act==='down' && i<EDIT.stops.length-1){ [EDIT.stops[i+1],EDIT.stops[i]]=[EDIT.stops[i],EDIT.stops[i+1]]; edRows(); return; }
  if(act==='ins'){ insertStopAfter(i); return; }
  if(act==='geo'){
    const row=$('rowlist').querySelector('.erow[data-i="'+i+'"]');
    await geocodeRow(i,row,{force:true});
    return;
  }
}
// Geocode a stop from its name, using the country field to pick the best match.
// Auto-called on name/country edits; ⌖ button forces it (and overrides symbol-name skip).
async function geocodeRow(i,row,opts={}){
  const s=EDIT.stops[i];
  const name=(s.name||'').trim();
  if(!name || name.toLowerCase()==='new stop') return;
  // Names with arrows/multi-hop or trek/flat labels rarely geocode cleanly — skip auto, allow force.
  if(/[→>/]/.test(name) && !opts.force) return;
  edMsg('Locating '+name+'…','busy');
  try{
    const r=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=10&language=en&format=json`);
    const j=await r.json();
    const results=j.results||[];
    if(!results.length){ edMsg('No match for “'+name+'” — try a clearer place name or add a country.','err'); return; }
    const want=(s.country||'').trim().toLowerCase();
    let hit=results[0];
    if(want){
      const m=results.find(x=>(x.country||'').toLowerCase()===want || (x.country_code||'').toLowerCase()===want.slice(0,2));
      if(m) hit=m;
    }
    s.lat=+hit.latitude.toFixed(4);
    s.lon=+hit.longitude.toFixed(4);
    if(hit.country_code) s.cc=hit.country_code.toUpperCase();
    if(!s.country && hit.country) s.country=hit.country;
    if(row){
      const cEl=row.querySelector('.f-country'); if(cEl && !cEl.value && s.country) cEl.value=s.country;
    }
    const where=[hit.name, hit.admin1, hit.country].filter(Boolean).join(', ');
    edMsg('✓ '+where+'  ·  '+s.lat+', '+s.lon,'ok');
  }catch(e){ edMsg('Location lookup failed — check your connection.','err'); }
}
function blankStop(arrive,depart){
  return {name:"",country:"",cc:"",lat:0,lon:0,arrive,depart,tentative:true};
}
function insertStopAfter(i){
  const cur=EDIT.stops[i];
  const next=EDIT.stops[i+1];
  const a=cur?.depart?parse(cur.depart):(cur?.arrive?parse(cur.arrive):TODAY);
  let d;
  if(next?.arrive){
    const end=parse(next.arrive);
    const gapDays=Math.floor((end-a)/DAY);
    d=gapDays>=2 ? new Date(a.getTime()+Math.floor(gapDays/2)*DAY) : new Date(a.getTime()+DAY);
  }else{
    d=new Date(a.getTime()+2*DAY);
  }
  EDIT.stops.splice(i+1,0,blankStop(formatISODate(a),formatISODate(d)));
  edFilter='all'; syncTabs(); edRows();
  const row=$('rowlist').querySelector('.erow[data-i="'+(i+1)+'"]');
  row?.scrollIntoView({behavior:'smooth',block:'center'});
  row?.querySelector('.f-name')?.focus();
  edMsg('Inserted a stop below #'+(i+1)+'. Fill place/country to locate it.','ok');
}
function newStop(){
  const last=EDIT.stops[EDIT.stops.length-1];
  const base=last?parse(last.depart):TODAY;
  const a=new Date(base.getTime()); const d=new Date(base.getTime()+3*DAY);
  EDIT.stops.push(blankStop(formatISODate(a),formatISODate(d)));
  edFilter='all'; syncTabs(); edRows();
  $('rowlist').lastElementChild?.scrollIntoView({behavior:'smooth',block:'center'});
}
function edMsg(t,cls){ const el=$('edMsg'); el.textContent=t||''; el.className='msg '+(cls||''); }
function syncTabs(){ $('tabAll').classList.toggle('on',edFilter==='all'); $('tabPast').classList.toggle('on',edFilter==='past'); $('tabFut').classList.toggle('on',edFilter==='fut'); }

let editorReturnFocus=null;
function openEditor(){
  editorReturnFocus=document.activeElement;
  EDIT=JSON.parse(JSON.stringify(DATA));
  edFilter='all'; syncTabs(); edRows(); edMsg('');
  refreshAuth();
  $('ovl').classList.add('open');
  $('ovl').setAttribute('aria-hidden','false');
  $('pageContent').setAttribute('inert','');
  document.body.style.overflow='hidden';
  $('closeEditor').focus();
}
function closeEditor(){
  $('ovl').classList.remove('open');
  $('ovl').setAttribute('aria-hidden','true');
  $('pageContent').removeAttribute('inert');
  document.body.style.overflow='';
  editorReturnFocus?.focus();
}

function tripPayload(){
  return {
    meta:EDIT.meta,
    stops:EDIT.stops.map(s=>{
      const o={name:s.name,country:s.country,cc:s.cc,lat:s.lat,lon:s.lon,arrive:s.arrive,depart:s.depart};
      if(s.note)o.note=s.note;
      if(s.tentative)o.tentative=true;
      return o;
    })
  };
}
function tripJson(payload=tripPayload()){ return JSON.stringify(payload, null, 2); }
function validPayload(payload){
  const errors=validateTrip(payload);
  if(!errors.length) return true;
  edMsg('✕ '+errors[0],'err');
  return false;
}

async function saveToGitHub(){
  if(!AUTH_LOGIN){
    edMsg('Sign in with GitHub first.','err');
    return;
  }
  const payload=tripPayload();
  if(!validPayload(payload)) return;
  $('saveGh').disabled=true; edMsg('Saving to GitHub…','busy');
  try{
    const r=await fetch('/.netlify/functions/save-trips',{
      method:'POST',
      credentials:'same-origin',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    });
    const j=await r.json().catch(()=>({}));
    if(!r.ok || !j.ok){
      if(r.status===401) throw new Error('Not signed in — use Sign in with GitHub.');
      if(r.status===403) throw new Error('This GitHub account is not allowed to save.');
      throw new Error(j.error || ('Save failed ('+r.status+')'));
    }
    DATA=JSON.parse(JSON.stringify(EDIT)); renderAll();
    edMsg('✓ Saved. Redeploy will be complete in about a minute.','ok');
  }catch(err){ edMsg('✕ '+err.message,'err'); }
  finally{ $('saveGh').disabled=false; }
}

function downloadJson(){
  const payload=tripPayload();
  if(!validPayload(payload)) return;
  const blob=new Blob([tripJson(payload)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download='trips.json'; a.click();
  URL.revokeObjectURL(url);
  edMsg('Downloaded trips.json — commit it to your repo to publish.','ok');
}
function previewTrip(){
  const payload=tripPayload();
  if(!validPayload(payload)) return;
  DATA=JSON.parse(JSON.stringify(payload));
  renderAll();
  edMsg('Previewing your edits on the map (not yet saved).','ok');
}

/* editor wiring */
$('openEditor').onclick=openEditor;
$('closeEditor').onclick=closeEditor;
$('ovl').addEventListener('click',e=>{ if(e.target===$('ovl')) closeEditor(); });
$('ghLogin').onclick=()=>{ location.href='/.netlify/functions/auth-login'; };
$('ghLogout').onclick=async()=>{
  const r=await fetch('/.netlify/functions/auth-logout',{method:'POST',credentials:'same-origin'});
  if(r.ok) location.href='/';
  else edMsg('Could not sign out — reload and try again.','err');
};
$('addStop').onclick=newStop;
$('saveGh').onclick=saveToGitHub;
$('applyLocal').onclick=previewTrip;
$('download').onclick=downloadJson;
$('revert').onclick=()=>{ openEditor(); edMsg('Reverted to last loaded data.',''); };
$('tabAll').onclick=()=>{edFilter='all';syncTabs();edRows();};
$('tabPast').onclick=()=>{edFilter='past';syncTabs();edRows();};
$('tabFut').onclick=()=>{edFilter='fut';syncTabs();edRows();};
document.addEventListener('keydown',e=>{ if(e.key==='Escape' && $('ovl').classList.contains('open')) closeEditor(); });
$('themeToggle').onclick=()=>{
  applyTheme(themeName()==='dusk'?'day':'dusk');
  if(TRIP) renderMap();
};

/* ============================================================
   BOOT
   ============================================================ */
async function loadData(){
  const r=await fetch('trips.json',{cache:'no-store'});
  if(!r.ok) throw new Error(`Could not load trips.json (${r.status})`);
  const data=await r.json();
  const errors=validateTrip(data);
  if(errors.length) throw new Error(errors[0]);
  return data;
}
(async()=>{
  initTheme();
  try{
    DATA=await loadData();
    renderAll();
    await refreshAuth();
    consumeAuthQuery();
  }catch(error){
    console.error(error);
    $('nowline').textContent='Journey data unavailable';
    $('localBanner').style.display='block';
    $('localBanner').textContent='Could not load trips.json. If you are viewing this locally, serve the folder over HTTP instead of opening index.html directly.';
    $('openEditor').disabled=true;
  }
})();
