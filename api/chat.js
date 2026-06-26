import { getChatReply } from '../lib/chat.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const reply = await getChatReply(body.messages);
    res.status(200).json({ reply });
  } catch (err) {
    console.error('[api/chat] error:', err);
    res.status(500).json({ error: '챗봇 응답 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.' });
  }
}
