-- Run this once in the Supabase SQL editor.

create extension if not exists vector;

-- RAG knowledge base chunks (uploads/*.md), embedded with text-embedding-3-small (1536 dims)
create table if not exists documents (
  id bigserial primary key,
  source text not null,
  chunk_index int not null,
  content text not null,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

create index if not exists documents_embedding_idx
  on documents using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- RLS on with no policies = only the service_role key (used server-side
-- only) can read/write; anon/authenticated keys are fully blocked.
alter table documents enable row level security;

create or replace function match_documents(
  query_embedding vector(1536),
  match_count int default 5
)
returns table (
  id bigint,
  source text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    id,
    source,
    content,
    1 - (embedding <=> query_embedding) as similarity
  from documents
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- Landing page consultation form submissions
create table if not exists leads (
  id bigserial primary key,
  name text,
  phone text,
  industry text,
  message text,
  created_at timestamptz not null default now()
);

alter table leads enable row level security;

-- Chatbot conversation log (best-effort, never blocks chat responses)
create table if not exists chat_logs (
  id bigserial primary key,
  question text,
  answer text,
  created_at timestamptz not null default now()
);

alter table chat_logs enable row level security;
