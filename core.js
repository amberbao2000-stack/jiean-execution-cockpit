export const STATUS = {
  done: { icon: "✅", label: "到位", export: "✅ 到位" },
  formal: { icon: "🟡", label: "形式完成", export: "🟡 形式完成" },
  missed: { icon: "❌", label: "漏做", export: "❌ 漏做" },
  none: { icon: "○", label: "未记录", export: "○ 未记录" },
  off: { icon: "—", label: "非应做日", export: "— 非应做日" },
  pending: { icon: "？", label: "待确认", export: "？待确认" }
};

export function pad2(n){ return String(n).padStart(2,'0'); }
export function dateKey(date){ return `${date.getFullYear()}-${pad2(date.getMonth()+1)}-${pad2(date.getDate())}`; }
export function parseLocalDate(key){ const [y,m,d]=key.split('-').map(Number); return new Date(y,m-1,d,12,0,0,0); }
export function weekdayCN(date){ return ['日','一','二','三','四','五','六'][date.getDay()]; }
export function dateLabel(date){ return `${date.getFullYear()}年${date.getMonth()+1}月${date.getDate()}日 · 星期${weekdayCN(date)}`; }
export function calendarDayDiff(date,anchor){
  const a=typeof anchor==='string'?parseLocalDate(anchor):anchor;
  const one=Date.UTC(date.getFullYear(),date.getMonth(),date.getDate());
  const two=Date.UTC(a.getFullYear(),a.getMonth(),a.getDate());
  return Math.round((one-two)/86400000);
}
export function isTaskDue(task,date){
  const s=task.schedule || {};
  if(s.type==='daily') return true;
  if(s.type==='weekdays') return (s.days||[]).includes(date.getDay());
  if(s.type==='every_n_days'){
    const n=Number(s.intervalDays||1); const diff=calendarDayDiff(date,s.anchor);
    return diff>=0 && diff%n===0;
  }
  return false;
}

export function dueTasks(tasks,date){ return tasks.filter(t=>isTaskDue(t,date)); }
export function mondayOf(date){ const d=new Date(date.getFullYear(),date.getMonth(),date.getDate(),12); const day=d.getDay(); d.setDate(d.getDate() - ((day+6)%7)); return d; }
export function weekDays(date){ const m=mondayOf(date); return Array.from({length:7},(_,i)=>{const d=new Date(m);d.setDate(m.getDate()+i);return d;}); }
export function weekKey(date){ return dateKey(mondayOf(date)); }
export function taskStatusForDate(task,date,statuses){
  if(!isTaskDue(task,date)) return STATUS.off.export;
  return STATUS[statuses?.[dateKey(date)]?.[task.id] || 'none'].export;
}
export function normalizeImportedData(raw){
  if(!raw || typeof raw!=='object') throw new Error('JSON 根对象无效');
  const out={version:2,statuses:{},realityCalls:[],weeklyEvents:[]};
  if(raw.statuses && typeof raw.statuses==='object') out.statuses=raw.statuses;
  if(Array.isArray(raw.realityCalls)) out.realityCalls=raw.realityCalls.filter(x=>x && typeof x==='object');
  if(Array.isArray(raw.weeklyEvents)) out.weeklyEvents=raw.weeklyEvents.filter(x=>x && typeof x==='object');
  return out;
}
export function callsInRange(calls,start,end){
  const a=dateKey(start), b=dateKey(end);
  return calls.filter(x=>x.date>=a && x.date<=b);
}
export function weeklyQuotaCount(calls,date,kind='slogan-reality'){ const days=weekDays(date); const subset=callsInRange(calls,days[0],days[6]); return subset.filter(x=>x.kind===kind).length; }
export function weeklyEventCount(events,date,kind){ const days=weekDays(date); const subset=callsInRange(events,days[0],days[6]); return subset.filter(x=>x.kind===kind).length; }
export function formatTodayExport(date,tasks,statuses,calls,weeklyEvents=[]){
  const dk=dateKey(date);
  const lines=[`${dk} 解案执行`, ''];
  for(const task of tasks) lines.push(`- ${task.title}：${taskStatusForDate(task,date,statuses)}`);
  const todayEvents=weeklyEvents.filter(x=>x.date===dk);
  for(const e of todayEvents) lines.push(`- ${e.title||e.kind}：✅ 本周累计 +1`);
  const todayCalls=calls.filter(x=>x.date===dk);
  if(todayCalls.length){
    lines.push('', '⭐ 现实调用：');
    for(const c of todayCalls){
      const bits=[c.scene?`场景：${c.scene}`:'',c.theme?`调用：${c.theme}`:'',c.action?`行动：${c.action}`:'',c.result?`结果：${c.result}`:''].filter(Boolean);
      lines.push(bits.join('；'));
    }
  }
  return lines.join('\n');
}
export function formatWeekExport(date,tasks,statuses,calls,weeklyEvents=[],quotas=[]){
  const days=weekDays(date); const lines=[`${dateKey(days[0])} 至 ${dateKey(days[6])} 解案执行周记录`];
  for(const d of days){
    lines.push('', `${dateKey(d)} 星期${weekdayCN(d)}`);
    const due=tasks.filter(t=>isTaskDue(t,d));
    if(!due.length) lines.push('- 固定任务：无');
    for(const task of due){
      const st=STATUS[statuses?.[dateKey(d)]?.[task.id] || 'none'].export;
      lines.push(`- ${task.title}：${st}`);
    }
    const es=weeklyEvents.filter(x=>x.date===dateKey(d));
    for(const e of es) lines.push(`- ${e.title||e.kind}：✅ 本周累计 +1`);
    const cs=calls.filter(x=>x.date===dateKey(d));
    for(const c of cs){ lines.push(`⭐ ${c.scene||'现实调用'}｜${c.theme||'未选主题'}｜${c.action||''}${c.result?`｜${c.result}`:''}`); }
  }
  if(quotas.length){
    lines.push('', '本周累计：');
    for(const q of quotas){
      const count=q.counter==='weeklyEvents' ? weeklyEventCount(weeklyEvents,date,q.kind) : weeklyQuotaCount(calls,date,q.kind);
      lines.push(`- ${q.title}：${count}（${q.target}）`);
    }
  }
  return lines.join('\n');
}
