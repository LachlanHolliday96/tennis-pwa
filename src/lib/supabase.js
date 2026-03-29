export const SB_URL = 'https://dmfsuklgkcjlaljicbee.supabase.co';
export const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtZnN1a2xna2NqbGFsamljYmVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMTI2ODIsImV4cCI6MjA4OTg4ODY4Mn0.bObJqI7CCbF64xiYuvnzclF9DCdOFIDK-2ZgQXnFy78';
export const SB_USER = 'lachie';

const HEADERS = {
  'apikey': SB_KEY,
  'Authorization': `Bearer ${SB_KEY}`,
  'Content-Type': 'application/json',
};

export async function sbGet(table, query = '') {
  const res = await fetch(`${SB_URL}/rest/v1/${table}?${query}`, { headers: HEADERS });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function sbUpsert(table, body) {
  const res = await fetch(`${SB_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...HEADERS, 'Prefer': 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return true;
}

export async function loadAppState() {
  try {
    const rows = await sbGet('tennis_plan', `user_id=eq.${SB_USER}&select=app_state,updated_at&limit=1`);
    if (rows.length && rows[0].app_state) return rows[0];
  } catch(e) {}
  return null;
}

export async function saveAppState(state) {
  try {
    await sbUpsert('tennis_plan', {
      user_id: SB_USER,
      app_state: state,
      updated_at: new Date().toISOString(),
    });
    return true;
  } catch(e) { return false; }
}

export async function loadWorkoutLogs() {
  try {
    return await sbGet('workout_logs', `user_id=eq.${SB_USER}&select=exercise_name,logged_date,sets&order=logged_date.desc`);
  } catch(e) { return []; }
}

export async function saveWorkoutLog(sessionKey, exerciseResults) {
  const today = new Date().toISOString().slice(0, 10);
  const inserts = exerciseResults.map(({ name, sets }) => ({
    user_id: SB_USER,
    session_key: sessionKey,
    exercise_name: name,
    logged_date: today,
    sets,
  }));
  return sbUpsert('workout_logs', inserts);
}