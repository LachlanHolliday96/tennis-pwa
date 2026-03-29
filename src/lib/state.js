import { sched, doneSet, feelLog, saveAll } from './storage.js';
import { splitSlots, PLAN_START, today } from '../data/schedule.js';

export function countDone(){
  let total=0, done=0;
  for(let w=0;w<6;w++) for(let d=0;d<7;d++){
    splitSlots(sched[w][d]).filter(k=>k&&k!=='rest'&&k!=='travel').forEach(k=>{
      total++;
      if(doneSet.has(`${w}-${d}-${k}`)) done++;
    });
  }
  return {total, done};
}

export function calcStreak(){
  let streak=0, dt=today();
  while(true){
    const diff=Math.floor((dt-PLAN_START)/86400000);
    const w=Math.floor(diff/7), d=diff%7;
    if(w<0||w>=6) break;
    const slots=splitSlots(sched[w][d]).filter(k=>k&&k!=='rest'&&k!=='travel');
    if(slots.length===0){ dt.setDate(dt.getDate()-1); continue; }
    const allDone=slots.every(k=>doneSet.has(`${w}-${d}-${k}`));
    if(!allDone) break;
    streak++;
    dt.setDate(dt.getDate()-1);
  }
  return streak;
}

export function toggleDone(key, w, d){
  const dk=`${w}-${d}-${key}`;
  if(doneSet.has(dk)) doneSet.delete(dk);
  else doneSet.add(dk);
  saveAll();
}

export function logFeel(key, w, d, feel, note){
  feelLog[`${w}-${d}-${key}`]={feel, note};
  saveAll();
}