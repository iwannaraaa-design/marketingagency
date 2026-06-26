import { getSupabaseClient } from './supabaseClient.js';
import { createEmbedding } from './embeddings.js';

const MATCH_COUNT = 5;

// Returns the concatenated text of the top matching chunks, or null when
// Supabase isn't configured or no relevant chunks were found — callers
// should fall back to injecting the full knowledge base in that case.
export async function retrieveRelevantChunks(question) {
  const supabase = getSupabaseClient();
  if (!supabase || !question) return null;

  try {
    const embedding = await createEmbedding(question);
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_count: MATCH_COUNT
    });

    if (error) throw error;
    if (!data || data.length === 0) return null;

    return data.map((row) => `--- 문서: ${row.source} ---\n${row.content}`).join('\n\n');
  } catch (err) {
    console.error('[rag] 검색 실패, 전체 문서로 폴백합니다:', err.message);
    return null;
  }
}
