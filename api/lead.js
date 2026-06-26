import { saveLead } from '../lib/leads.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    if (!body.name || !String(body.name).trim() || !body.phone || !String(body.phone).trim()) {
      res.status(400).json({ error: '이름(상호)과 연락처를 입력해 주세요.' });
      return;
    }
    await saveLead(body);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[api/lead] error:', err);
    res.status(500).json({ error: '상담 신청 저장 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.' });
  }
}
