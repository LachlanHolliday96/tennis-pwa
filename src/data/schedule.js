export const PLAN_START = new Date(2026,2,23);
export const T1S = new Date(2026,3,1);
export const T1E = new Date(2026,3,6);
export const T2S = new Date(2026,3,8);
export const T2E = new Date(2026,3,20);

export function inTravel(d){ return (d>=T1S&&d<=T1E)||(d>=T2S&&d<=T2E); }
export function getDate(w,d){ const dt=new Date(PLAN_START); dt.setDate(PLAN_START.getDate()+w*7+d); return dt; }
export function fmtD(dt){ return dt.toLocaleDateString('en-AU',{day:'numeric',month:'short'}); }
export function fmtDow(dt){ return ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][dt.getDay()===0?6:dt.getDay()-1]; }
export function today(){ const t=new Date(); t.setHours(0,0,0,0); return t; }
export function getWeekDay(){
  const td=today(), start=new Date(PLAN_START);
  const diff=Math.floor((td-start)/86400000);
  const w=Math.floor(diff/7), d=diff%7;
  if(w<0||w>=6) return null;
  return {w,d};
}

export const DEFAULT_SCHED = [
  ['','morningcardio+afternoonlegs','kdv','hill+pronation','singles','hotel15','rest'],
  ['liam','morningcardio+afternoonlegs','kdv','hill+pronation','travel','travel','travel'],
  ['travel','morningcardio+afternoonlegs','travel','travel','travel','travel','travel'],
  ['travel','travel','travel','travel','travel','travel','travel'],
  ['liam','morningcardio+afternoonlegs','kdv','hill+pronation','singles','hotel15','rest'],
  ['liam','morningcardio+afternoonlegs','kdv','hill+pronation','singles','hotel15','rest'],
];

export const WEEK_LABELS = ['Mar 23','Mar 30','Apr 6','Apr 13','Apr 20','Apr 27'];
export const IS_CP = [false,false,true,false,false,true];

export const TYPE_COLOR = {
  's-tennis':'var(--tennis)','s-gym':'var(--gym)','s-hill':'var(--hill)',
  's-cardio':'var(--cardio)','s-hotel':'var(--travel)','s-travel':'var(--travel)','s-rest':'var(--muted)'
};
export function dotColor(type){ return TYPE_COLOR[type]||'var(--muted)'; }
export function splitSlots(s){ return s?s.split('+').filter(Boolean):[]; }
export function joinSlots(a){ return a.join('+'); }