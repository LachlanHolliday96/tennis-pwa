// Rest timer with notification support

const REST_DURATIONS = {
  'Bulgarian split squat': 120,
  'Box jump (reactive)': 120,
  'Romanian deadlift (single-leg)': 120,
  'Med ball rotational slam': 120,
  'Lateral bound + stick': 90,
  'Cossack squat': 90,
  'Band lateral walk': 60,
  'Forearm pronation curl': 60,
  'Motorcycle revs': 60,
  'Supination-to-pronation (band)': 60,
  'Face pulls (cable)': 60,
  'Single-arm cable row': 90,
  'Wrist roller': 60,
};

export function getRestDuration(exName){
  return REST_DURATIONS[exName] || 90;
}

let activeTimer = null;

export function startRestTimer(exName, onTick, onComplete){
  stopRestTimer();
  const duration = getRestDuration(exName);
  let remaining = duration;
  onTick(remaining, duration);

  activeTimer = setInterval(() => {
    remaining--;
    onTick(remaining, duration);
    if(remaining <= 0){
      stopRestTimer();
      onComplete();
      fireNotification();
      playChime();
    }
  }, 1000);

  return duration;
}

export function stopRestTimer(){
  if(activeTimer){
    clearInterval(activeTimer);
    activeTimer = null;
  }
}

export function isTimerActive(){
  return activeTimer !== null;
}

export async function requestNotificationPermission(){
  if(!('Notification' in window)) return false;
  if(Notification.permission === 'granted') return true;
  if(Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

function fireNotification(){
  if(!('Notification' in window)) return;
  if(Notification.permission !== 'granted') return;
  new Notification('Rest complete 💪', {
    body: 'Start your next set',
    icon: '/icon.png',
    silent: false,
  });
}

function playChime(){
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const times = [0, 0.15, 0.3];
    const freqs = [880, 1100, 1320];
    times.forEach((t, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freqs[i];
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.4);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.4);
    });
  } catch(e){}
}