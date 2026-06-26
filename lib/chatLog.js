import { getSupabaseClient } from './supabaseClient.js';

// Best-effort logging — failures are swallowed so they never affect the
// chat response itself.
export async function logChatBestEffort(question, answer) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const { error } = await supabase.from('chat_logs').insert({ question, answer });
    if (error) throw error;
  } catch (err) {
    console.error('[chat_logs] 기록 실패 (무시됨):', err.message);
  }
}
