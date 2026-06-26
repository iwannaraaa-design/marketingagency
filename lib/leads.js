import { getSupabaseClient } from './supabaseClient.js';

export async function saveLead({ name, phone, industry, message }) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('서버에 Supabase가 설정되어 있지 않아 상담 신청을 저장할 수 없어요.');
  }

  const { error } = await supabase.from('leads').insert({
    name: String(name || '').trim(),
    phone: String(phone || '').trim(),
    industry: String(industry || '').trim(),
    message: String(message || '').trim()
  });

  if (error) throw new Error(error.message);
}
