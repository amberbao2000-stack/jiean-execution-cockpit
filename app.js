import {SECTIONS,ORIGINAL_PARAGRAPHS,CORE_1007,TASKS,WEEKLY_QUOTA,REALITY_ITEMS,FRAGMENT_BUCKETS,PENDING_ITEMS} from './content.js';
import {STATUS,dateKey,dateLabel,weekdayCN,isTaskDue,dueTasks,weekDays,weekKey,normalizeImportedData,weeklyQuotaCount,weeklyEventCount,formatTodayExport,formatWeekExport} from './core.js';

const app=document.querySelector('#app');
const titleEl=document.querySelector('#page-title');
const weekBtn=document.querySelector('#week-button');
const sheetRoot=document.querySelector('#sheet-root');
const toast=document.querySelector('#toast');
const STORAGE_KEY='jiean-cockpit-v1';
let nowOverride=null;
let lastDateKey='';
let timerState={id:null,seconds:0,interval:null};

function now(){ return nowOverride ? new Date(nowOverride) : new Date(); }
function defaultData(){ return {version:2,statuses:{},realityCalls:[],weeklyEvents:[]}; }
function loadData(){
  try{ const raw=localStorage.getItem(STORAGE_KEY); if(!raw) return defaultData(); return normalizeImportedData(JSON.parse(raw)); }
  catch(e){ return defaultData(); }
}
let data=loadData();
function saveData(){ localStorage.setItem(STORAGE_KEY,JSON.stringify(data)); }
function esc(s=''){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function attr(s=''){ return esc(s).replace(/`/g,'&#96;'); }
function showToast(msg){ toast.textContent=msg; toast.classList.add('show'); clearTimeout(showToast.t); showToast.t=setTimeout(()=>toast.classList.remove('show'),1700); }
function routeInfo(){
  const raw=(location.hash||'#today').slice(1); const [path,qs='']=raw.split('?'); return {path:path||'today',params:new URLSearchParams(qs)};
}
function go(route,params={}){ const qs=new URLSearchParams(params).toString(); location.hash=route+(qs?'?'+qs:''); }
function navActive(route){ document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.route===route)); }
function setTitle(t){ titleEl.textContent=t; }
function sourceLabelForP(p){ const sec=SECTIONS.find(s=>s.start<=p&&p<=s.end); return sec ? `${sec.title}｜${sec.page}｜原文段落 P${p}` : `原文段落 P${p}`; }
function dueStatus(task,date){ return data.statuses?.[dateKey(date)]?.[task.id] || 'none'; }
function setStatus(taskId,status,date=now()){
  const dk=dateKey(date); data.statuses[dk] ||= {}; if(data.statuses[dk][taskId]===status) delete data.statuses[dk][taskId]; else data.statuses[dk][taskId]=status; saveData(); render();
}
function statusButtons(task,date){ const current=dueStatus(task,date); return `<div class="status-label">状态：${STATUS[current].icon} ${STATUS[current].label}</div><div class="status-row">${['done','formal','missed'].map(s=>`<button class="status-btn ${current===s?'active':''}" data-action="status" data-task="${task.id}" data-status="${s}">${STATUS[s].icon} ${STATUS[s].label}</button>`).join('')}</div>`; }
function taskCard(task,date){
  return `<article class="card task-card" data-task-card="${task.id}"><h2>${esc(task.title)}</h2><div class="muted tiny">${esc(task.subtitle)}</div><div class="meta"><span class="pill">${esc(task.duration)}</span>${task.sound?`<span class="pill">${esc(task.sound)}</span>`:''}</div><div class="button-row"><button class="primary-btn" data-action="start" data-task="${task.id}">开始</button><button class="secondary-btn" data-action="method" data-task="${task.id}">查看方法</button><button class="ghost-btn" data-action="source" data-p="${task.sourceP}">查看原文</button></div>${statusButtons(task,date)}<div class="source-line">来源：${esc(task.sourceLabel)}</div></article>`;
}
function renderToday(taskSet=TASKS){
  setTitle('今天'); navActive('today'); const d=now(); const due=dueTasks(taskSet,d);
  app.innerHTML=`<div class="section-kicker">TODAY</div><div class="hero-date">今天 · 星期${weekdayCN(d)}</div><p class="hero-sub">${dateLabel(d)}｜只显示按当前已确认安排今天要做的事。</p><div class="quick-grid"><button class="quick-link" data-route-jump="fragments"><b>🚇 碎片时间</b><span>按现在能不能做来找</span></button><button class="quick-link" data-action="open-reality"><b>⭐ 现实调用</b><span>5 秒留下场景记录</span></button><button class="quick-link" data-route-jump="week"><b>📅 本周安排</b><span>周一到周日一眼看清</span></button><button class="quick-link" data-route-jump="source"><b>⌕ 搜原文</b><span>关键词直达对应段落</span></button></div><div class="quiet-note">这里不做连续打卡、积分或人格评价。状态只用于观察与导出。</div><h2 class="section-title">今天要做</h2>${due.length?due.map(t=>taskCard(t,d)).join(''):`<div class="empty">今天没有已确认的固定任务。现实调用与日常练仍可按场景使用。</div>`}<h2 class="section-title">安排仍待确认</h2><div class="card compact"><b>有 ${PENDING_ITEMS.length} 项没有被强行塞进 Today。</b><p class="muted tiny">包括日口号“每天用力读”与默念/出声关系、运动具体项目与每次时长、AI 常规任务等。去“本周”查看完整待确认清单。</p><button class="secondary-btn" data-route-jump="week">查看待确认</button></div>`;
}
function renderWeek(){
  setTitle('本周安排'); navActive(''); const d=now(); const days=weekDays(d);
  const fixed=TASKS.filter(t=>t.group==='fixed'||t.group==='interval'); const daily=TASKS.filter(t=>t.group==='daily');
  const quotaCount=q=>q.counter==='weeklyEvents'?weeklyEventCount(data.weeklyEvents,d,q.kind):weeklyQuotaCount(data.realityCalls,d,q.kind);
  app.innerHTML=`<div class="section-kicker">WEEK</div><div class="hero-date">📅 本周安排</div><p class="hero-sub">固定日程、每天可做、按间隔安排、每周累计、现实中随时调用、待确认分开显示。</p><h2 class="section-title">周一 → 周日</h2>${days.map(day=>`<article class="card compact week-day ${dateKey(day)===dateKey(d)?'today-marker':''}"><div class="dayname">周${weekdayCN(day)}<br><span class="tiny muted">${day.getMonth()+1}/${day.getDate()}</span></div><div><ul>${fixed.filter(t=>isTaskDue(t,day)).map(t=>`<li>${esc(t.title)}</li>`).join('')||'<li class="muted">无固定 / 间隔任务</li>'}</ul><div class="tiny muted" style="margin-top:7px">每天：${daily.map(t=>esc(t.title)).join('；')}</div></div></article>`).join('')}<h2 class="section-title">每天可做 / 每天安排</h2>${daily.map(t=>`<article class="card compact"><b>${esc(t.title)}</b><p class="muted tiny">${esc(t.subtitle)}｜${esc(t.duration)}</p><button class="ghost-btn mini-btn" data-action="source" data-p="${t.sourceP}">查看原文</button></article>`).join('')}<h2 class="section-title">本周需要累计</h2>${WEEKLY_QUOTA.map(q=>{const count=quotaCount(q);return `<article class="card"><h3>${esc(q.title)}</h3><div class="meta"><span class="pill">${esc(q.target)}</span><span class="pill">${esc(q.duration)}</span></div><p>${esc(q.note)}</p><p class="muted tiny">本周已记录：${count}${q.counter==='weeklyEvents'?' 次':' 件'}。这里仅做累计观察，不做完成率惩罚。</p><div class="button-row">${q.action==='slogan-reality'?`<button class="primary-btn" data-action="slogan-reality">${esc(q.actionLabel)}</button>`:`<button class="primary-btn" data-action="weekly-event" data-kind="${attr(q.kind)}" data-title="${attr(q.title)}">${esc(q.actionLabel)}</button><button class="ghost-btn" data-action="weekly-event-undo" data-kind="${attr(q.kind)}">撤销最近一次</button>`}<button class="ghost-btn" data-action="source" data-p="${q.sourceP}">查看原文</button></div></article>`;}).join('')}<h2 class="section-title">现实中随时调用</h2><div class="card">${REALITY_ITEMS.map(x=>`<div class="fragment-item"><b>${esc(x.title)}</b><p>${esc(x.short)}</p><button class="ghost-btn mini-btn" data-action="source" data-p="${x.sourceP}">原文</button></div>`).join('')}</div><h2 class="section-title">⚠️ 待确认</h2>${PENDING_ITEMS.map(p=>`<details class="card pending-card"><summary><div class="core-summary"><b>${esc(p.title)}</b><span class="chev">⌄</span></div></summary>${p.quotes.map(q=>`<blockquote>${esc(q)}</blockquote>`).join('')}<p>${esc(p.question)}</p><div class="source-line">来源：${esc(p.sourceLabel)}</div><button class="ghost-btn mini-btn" data-action="source" data-p="${p.sourceP}">查看原文</button></details>`).join('')}`;
}
function renderFragments(){
  setTitle('碎片时间'); navActive('fragments');
  app.innerHTML=`<div class="section-kicker">NOW</div><div class="hero-date">🚇 碎片时间</div><p class="hero-sub">不是把所有训练切碎，而是先判断：此刻这个场景，原文允许怎么练。</p>${FRAGMENT_BUCKETS.map(b=>`<section class="bucket"><h2>${esc(b.bucket)}</h2><div class="card">${b.items.map(x=>`<div class="fragment-item"><b>${x.pending?'⚠️ ':''}${esc(x.title)}</b><p>${esc(x.note)}</p><div class="button-row">${x.taskId?`<button class="primary-btn mini-btn" data-action="start" data-task="${x.taskId}">开始</button>`:''}${x.action==='reality'?`<button class="primary-btn mini-btn" data-action="open-reality">记录现实调用</button>`:''}${x.action==='slogan-reality'?`<button class="primary-btn mini-btn" data-action="slogan-reality">记录一次</button>`:''}${Number.isInteger(x.sourceP)?`<button class="ghost-btn mini-btn" data-action="source" data-p="${x.sourceP}">查看原文</button>`:''}</div></div>`).join('')}</div></section>`).join('')}`;
}
function renderCore(){
  setTitle('1007 核心'); navActive('core');
  app.innerHTML=`<div class="section-kicker">1007 CORE</div><div class="hero-date">🧭 1007 核心</div><p class="hero-sub">默认只露出一句话核心；需要时再展开“什么时候用”，完整内容始终回到原文。</p>${CORE_1007.map(c=>`<details class="card core-card"><summary><div class="core-summary"><div><h2>${esc(c.title)}</h2><div class="core-one">${esc(c.core)}</div></div><span class="chev">⌄</span></div></summary><div class="when"><b>什么时候用</b><br>${esc(c.when)}</div><div class="details-actions button-row"><button class="primary-btn" data-action="open-reality" data-theme="${attr(c.title)}">现实调用</button><button class="ghost-btn" data-action="source" data-p="${c.sourceP}">进入完整原文</button></div><div class="source-line">来源：${esc(c.sourceLabel)}</div></details>`).join('')}`;
}
function detectSubheading(text){ return /^(第一部分|第二部分|第三部分|[abcd](?:\s|[一二三四五六七八九十])|[0-9]+[\.、）)]|第[一二三四五六七八九十]+[，、.]|关于|当务之急|===|解案要点|运动继续|我要时不时念叨)/.test(text.trim()); }
function groupParagraphs(ps){
  const groups=[]; let cur={title:'正文',items:[]};
  for(const p of ps){
    if(detectSubheading(p.text) && cur.items.length){ groups.push(cur); cur={title:p.text,items:[p]}; }
    else cur.items.push(p);
  }
  if(cur.items.length) groups.push(cur); return groups;
}
function sourceSearch(q){
  const term=q.trim(); if(!term) return [];
  const coreHits=CORE_1007.filter(c=>(c.title+c.core+c.when).includes(term)).map(c=>({type:'theme',title:c.title,text:c.core,p:c.sourceP}));
  const taskHits=TASKS.filter(t=>(t.title+t.subtitle+t.method.join('')).includes(term)).map(t=>({type:'task',title:t.title,text:t.method[0]||'',p:t.sourceP}));
  const paraHits=ORIGINAL_PARAGRAPHS.filter(p=>p.text.includes(term)).slice(0,24).map(p=>({type:'原文',title:SECTIONS.find(s=>s.id===p.section)?.title||'原文',text:p.text,p:p.p}));
  const seen=new Set(); return [...coreHits,...taskHits,...paraHits].filter(x=>{const k=x.type+'|'+x.p+'|'+x.title;if(seen.has(k))return false;seen.add(k);return true;});
}
function hi(text,q){ if(!q) return esc(text); const safe=esc(text); const re=new RegExp(esc(q).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'); return safe.replace(re,m=>`<mark>${m}</mark>`); }
function renderSource(params=new URLSearchParams()){
  setTitle('原文'); navActive('source'); const pNum=Number(params.get('p')); const secParam=params.get('section'); const sec=(Number.isFinite(pNum)&&SECTIONS.find(s=>s.start<=pNum&&pNum<=s.end)) || SECTIONS.find(s=>s.id===secParam) || null;
  if(!sec){
    app.innerHTML=`<div class="section-kicker">SOURCE</div><div class="hero-date">📖 原文</div><p class="hero-sub">完整原文保留在这里。目录只负责导航，不替代原文。</p><div class="search-wrap"><input id="source-search" class="search-input" type="search" placeholder="搜索原文，例如：恐惧" autocomplete="off" /></div><div id="search-results"></div><h2 class="section-title">章节目录</h2><div class="toc-grid">${SECTIONS.map(s=>`<button class="toc-btn" data-source-section="${s.id}"><b>${esc(s.title)}</b><small>${esc(s.page)} · 段落 P${s.start}–P${s.end}</small></button>`).join('')}</div>`;
    return;
  }
  const ps=ORIGINAL_PARAGRAPHS.filter(p=>p.section===sec.id); const groups=groupParagraphs(ps);
  app.innerHTML=`<div class="reader-head"><div><div class="section-kicker">ORIGINAL</div><h2 class="reader-section-title">${esc(sec.title)}</h2><div class="tiny muted">${esc(sec.page)} · 原文段落 P${sec.start}–P${sec.end}</div></div><button class="icon-button" data-action="source-home">目录</button></div><div class="search-wrap"><input id="source-search" class="search-input" type="search" placeholder="在完整原文中搜索" autocomplete="off" /></div><div id="search-results"></div><div id="reader-body">${groups.map((g,idx)=>`<details class="source-group" ${idx<2?'open':''}><summary>${esc(g.title)} <span class="tiny muted">(${g.items.length})</span></summary><div class="source-group-body">${g.items.map(p=>`<p id="src-p${p.p}" class="original-p ${p.p===pNum?'highlight':''}"><span class="para-num">P${p.p}</span>${esc(p.text)}</p>`).join('')}</div></details>`).join('')}</div><div class="button-row"><button class="ghost-btn" data-action="top">回到顶部</button><button class="secondary-btn" data-action="source-home">章节目录</button></div>`;
  if(Number.isFinite(pNum)) setTimeout(()=>{const el=document.querySelector(`#src-p${pNum}`); if(el){ let d=el.closest('details'); if(d)d.open=true; el.scrollIntoView({block:'center'});}},30);
}
function searchResultsMarkup(q){ const hits=sourceSearch(q); if(!q.trim()) return ''; if(!hits.length) return `<div class="card compact muted">没有找到“${esc(q)}”。</div>`; return `<div class="card">${hits.map(h=>`<div class="search-result"><div class="tiny muted">${esc(h.type)} · ${esc(sourceLabelForP(h.p))}</div><b>${hi(h.title,q)}</b><div class="tiny" style="margin:5px 0">${hi(h.text.length>150?h.text.slice(0,150)+'…':h.text,q)}</div><button class="ghost-btn mini-btn" data-action="source" data-p="${h.p}">跳到原文</button></div>`).join('')}</div>`; }
function renderRecords(){
  setTitle('记录'); navActive('records'); const d=now(); const dk=dateKey(d); const todays=data.realityCalls.filter(x=>x.date===dk).slice().reverse(); const todayWeekly=(data.weeklyEvents||[]).filter(x=>x.date===dk).slice().reverse();
  app.innerHTML=`<div class="section-kicker">LOG</div><div class="hero-date">记录</div><p class="hero-sub">只保留执行状态、简短现实调用和可迁移数据；不再建立第二套知识库。</p><article class="card"><h2>⭐ 现实调用</h2><form id="reality-form"><input type="hidden" name="kind" value="reality"/><div class="form-field"><label>场景</label><textarea name="scene" required placeholder="例如：补 IB 课程"></textarea></div><div class="form-field"><label>我想起了</label><select name="theme"><option value="">选择解案主题</option>${CORE_1007.map(c=>`<option>${esc(c.title)}</option>`).join('')}<option>日口号</option></select></div><div class="form-field"><label>我实际怎么做了</label><textarea name="action" required placeholder="一句或两句即可"></textarea></div><div class="form-field"><label>结果 / 反馈</label><textarea name="result" placeholder="可留空"></textarea></div><button class="primary-btn" type="submit" style="width:100%">保存现实调用</button></form></article><article class="card"><h2>复制记录</h2><div class="data-actions"><button class="secondary-btn" data-action="copy-today">复制今日记录</button><button class="secondary-btn" data-action="copy-week">复制本周记录</button></div></article><article class="card"><h2>备份 / 恢复</h2><p class="muted tiny">状态、现实调用和周累计记录保存在浏览器本地。换设备前可导出 JSON；新设备再导入。</p><div class="data-actions"><button class="ghost-btn" data-action="export-json">导出全部记录 JSON</button><label class="file-label">导入记录 JSON<input id="import-json" type="file" accept="application/json,.json"/></label></div></article><h2 class="section-title">今天的现实调用</h2>${todays.length?`<div class="card">${todays.map(c=>recordMarkup(c)).join('')}</div>`:`<div class="empty">今天还没有现实调用记录。</div>`}<h2 class="section-title">今天的周累计记录</h2>${todayWeekly.length?`<div class="card">${todayWeekly.map(e=>weeklyEventMarkup(e)).join('')}</div>`:`<div class="empty">今天还没有周累计记录。</div>`}`;
}
function recordMarkup(c){ return `<div class="record"><time>${esc(c.date)} · ⭐ 现实调用</time><p><b>场景：</b>${esc(c.scene||'')}</p><p><b>调用：</b>${esc(c.theme||'')}</p><p><b>行动：</b>${esc(c.action||'')}</p>${c.result?`<p><b>结果：</b>${esc(c.result)}</p>`:''}<button class="ghost-btn mini-btn danger-btn" data-action="delete-call" data-id="${attr(c.id)}">删除这条</button></div>`; }
function weeklyEventMarkup(e){ return `<div class="record"><time>${esc(e.date)} · 本周累计</time><p><b>${esc(e.title||e.kind)}：</b>+1</p><button class="ghost-btn mini-btn danger-btn" data-action="delete-weekly-event" data-id="${attr(e.id)}">删除这条</button></div>`; }
function addWeeklyEvent(kind,title){ data.weeklyEvents ||= []; data.weeklyEvents.push({id:`${Date.now()}-${Math.random().toString(36).slice(2,7)}`,date:dateKey(now()),kind,title,createdAt:new Date().toISOString()}); saveData(); showToast(`${title}：本周累计 +1`); render(); }
function undoWeeklyEvent(kind){ const days=weekDays(now()); const a=dateKey(days[0]),b=dateKey(days[6]); const indices=[]; (data.weeklyEvents||[]).forEach((e,i)=>{if(e.kind===kind&&e.date>=a&&e.date<=b)indices.push(i);}); if(!indices.length){showToast('本周还没有可撤销记录');return;} data.weeklyEvents.splice(indices[indices.length-1],1); saveData(); showToast('已撤销最近一次'); render(); }
function render(){
  const {path,params}=routeInfo();
  if(path==='today')renderToday(); else if(path==='week')renderWeek(); else if(path==='fragments')renderFragments(); else if(path==='core')renderCore(); else if(path==='source')renderSource(params); else if(path==='records')renderRecords(); else go('today');
  lastDateKey=dateKey(now());
}
function openMethod(task,startMode=false){
  const method=task.method||[]; const timer=task.id==='meditation'?`<div class="timer-options"><button class="mini-btn active" data-timer-min="5">5 分钟</button><button class="mini-btn" data-timer-min="8">8 分钟</button></div><div class="timer" id="timer-display">05:00</div><div class="button-row"><button class="primary-btn" data-action="timer-toggle">开始计时</button><button class="ghost-btn" data-action="timer-reset">重置</button></div>`:'';
  sheetRoot.innerHTML=`<div class="sheet-backdrop" data-action="close-sheet"><section class="sheet" role="dialog" aria-modal="true" aria-label="${attr(task.title)}"><div class="sheet-handle"></div><h2>${esc(task.title)}</h2><div class="muted tiny">${esc(task.subtitle)}｜${esc(task.duration)}</div>${timer}<ol class="method-list">${method.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><div class="source-line">来源：${esc(task.sourceLabel)}</div><div class="button-row">${task.readingRange?`<button class="primary-btn" data-action="reading" data-task="${task.id}">进入原文阅读</button>`:''}${task.id==='review-1007'?`<button class="primary-btn" data-route-jump="core">进入 1007 核心</button>`:''}${task.realityPreferred?`<button class="primary-btn" data-action="open-reality" data-theme="微观想透">记录现实调用</button>`:''}<button class="ghost-btn" data-action="source" data-p="${task.sourceP}">查看原文</button></div><button class="ghost-btn sheet-close" data-action="close-sheet">关闭</button></section></div>`;
  clearTimer();
}
function openReading(task){ closeSheet(); const p=task.readingRange?.[0]??task.sourceP; go('source',{p:String(p)}); }
function openReality(prefill={}){
  const theme=prefill.theme||''; const kind=prefill.kind||'reality'; closeSheet();
  sheetRoot.innerHTML=`<div class="sheet-backdrop" data-action="close-sheet"><section class="sheet" role="dialog" aria-modal="true" aria-label="现实调用"><div class="sheet-handle"></div><h2>⭐ 现实调用</h2><form id="reality-sheet-form"><input type="hidden" name="kind" value="${attr(kind)}"/><div class="form-field"><label>场景</label><textarea name="scene" required></textarea></div><div class="form-field"><label>我想起了</label><select name="theme"><option value="">选择解案主题</option>${CORE_1007.map(c=>`<option ${c.title===theme?'selected':''}>${esc(c.title)}</option>`).join('')}<option ${theme==='日口号'?'selected':''}>日口号</option></select></div><div class="form-field"><label>我实际怎么做了</label><textarea name="action" required></textarea></div><div class="form-field"><label>结果 / 反馈</label><textarea name="result"></textarea></div><button class="primary-btn" type="submit" style="width:100%">保存</button></form><button class="ghost-btn sheet-close" data-action="close-sheet">关闭</button></section></div>`;
}
function closeSheet(){ clearTimer(); sheetRoot.innerHTML=''; }
function saveReality(form){
  const fd=new FormData(form); const item={id:`${Date.now()}-${Math.random().toString(36).slice(2,7)}`,date:dateKey(now()),kind:fd.get('kind')||'reality',scene:String(fd.get('scene')||'').trim(),theme:String(fd.get('theme')||'').trim(),action:String(fd.get('action')||'').trim(),result:String(fd.get('result')||'').trim(),createdAt:new Date().toISOString()};
  data.realityCalls.push(item); saveData(); closeSheet(); showToast('已保存现实调用'); if(routeInfo().path==='records')renderRecords();
}
function clearTimer(){ if(timerState.interval)clearInterval(timerState.interval); timerState={id:null,seconds:0,interval:null}; }
function setTimerMinutes(min){ clearTimer(); timerState.seconds=min*60; updateTimerDisplay(); document.querySelectorAll('[data-timer-min]').forEach(b=>b.classList.toggle('active',Number(b.dataset.timerMin)===min)); }
function updateTimerDisplay(){ const el=document.querySelector('#timer-display'); if(!el)return; const m=Math.floor(timerState.seconds/60),s=timerState.seconds%60; el.textContent=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; }
function toggleTimer(btn){ if(timerState.seconds<=0)setTimerMinutes(5); if(timerState.interval){clearInterval(timerState.interval);timerState.interval=null;btn.textContent='继续';return;} btn.textContent='暂停'; timerState.interval=setInterval(()=>{timerState.seconds--;updateTimerDisplay();if(timerState.seconds<=0){clearTimer();showToast('计时结束');btn.textContent='开始计时';}},1000); }
async function copyText(text){
  try{ await navigator.clipboard.writeText(text); showToast('已复制'); }
  catch(e){ const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();showToast('已复制'); }
}
function exportJson(){ const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`jiean-cockpit-backup-${dateKey(now())}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);showToast('备份文件已生成'); }
async function importJson(file){ try{const raw=JSON.parse(await file.text());data=normalizeImportedData(raw);saveData();showToast('记录已导入');render();}catch(e){showToast(`导入失败：${e.message}`);} }

document.addEventListener('click',e=>{
  const b=e.target.closest('button,[data-route-jump],[data-source-section]'); if(!b)return;
  if(b.dataset.route) return go(b.dataset.route);
  if(b.dataset.routeJump){closeSheet();return go(b.dataset.routeJump);}
  if(b.dataset.sourceSection) return go('source',{section:b.dataset.sourceSection});
  const a=b.dataset.action;
  if(a==='status')return setStatus(b.dataset.task,b.dataset.status);
  if(a==='method'||a==='start'){const t=TASKS.find(x=>x.id===b.dataset.task);if(t)return openMethod(t,a==='start');}
  if(a==='source'){closeSheet();return go('source',{p:b.dataset.p});}
  if(a==='source-home')return go('source');
  if(a==='open-reality')return openReality({theme:b.dataset.theme||''});
  if(a==='slogan-reality')return openReality({theme:'日口号',kind:'slogan-reality'});
  if(a==='weekly-event')return addWeeklyEvent(b.dataset.kind,b.dataset.title);
  if(a==='weekly-event-undo')return undoWeeklyEvent(b.dataset.kind);
  if(a==='reading'){const t=TASKS.find(x=>x.id===b.dataset.task);if(t)return openReading(t);}
  if(a==='close-sheet'){if(e.target===b||b.classList.contains('sheet-close'))return closeSheet();}
  if(a==='top')return window.scrollTo({top:0,behavior:'smooth'});
  if(a==='copy-today')return copyText(formatTodayExport(now(),TASKS,data.statuses,data.realityCalls,data.weeklyEvents));
  if(a==='copy-week')return copyText(formatWeekExport(now(),TASKS,data.statuses,data.realityCalls,data.weeklyEvents,WEEKLY_QUOTA));
  if(a==='export-json')return exportJson();
  if(a==='delete-call'){data.realityCalls=data.realityCalls.filter(x=>x.id!==b.dataset.id);saveData();renderRecords();showToast('已删除');return;}
  if(a==='delete-weekly-event'){data.weeklyEvents=(data.weeklyEvents||[]).filter(x=>x.id!==b.dataset.id);saveData();renderRecords();showToast('已删除');return;}
  if(a==='timer-toggle')return toggleTimer(b);
  if(a==='timer-reset'){const active=document.querySelector('[data-timer-min].active');return setTimerMinutes(Number(active?.dataset.timerMin||5));}
  if(b.dataset.timerMin!==undefined)return setTimerMinutes(Number(b.dataset.timerMin));
});
document.addEventListener('submit',e=>{ if(e.target.matches('#reality-form,#reality-sheet-form')){e.preventDefault();saveReality(e.target);} });
document.addEventListener('input',e=>{ if(e.target.id==='source-search'){document.querySelector('#search-results').innerHTML=searchResultsMarkup(e.target.value);} });
document.addEventListener('change',e=>{ if(e.target.id==='import-json'&&e.target.files?.[0])importJson(e.target.files[0]); });
weekBtn.addEventListener('click',()=>go('week'));
window.addEventListener('hashchange',()=>{window.scrollTo(0,0);render();});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&dateKey(now())!==lastDateKey)render();});
setInterval(()=>{if(dateKey(now())!==lastDateKey)render();},60000);

if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));}
window.__cockpitTest={
  setNowOverride(v){nowOverride=v;render();}, clearNowOverride(){nowOverride=null;render();},
  getData(){return JSON.parse(JSON.stringify(data));}, setData(v){data=normalizeImportedData(v);saveData();render();},
  dueOn(v){return dueTasks(TASKS,new Date(v)).map(x=>x.id);}, search:q=>sourceSearch(q), route:go, renderTodayEmpty(){renderToday([]);}
};
render();
