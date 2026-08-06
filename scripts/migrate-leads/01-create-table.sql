-- Cria a tabela leads (rodar no Supabase SQL Editor)
create table if not exists public.leads (
  id text primary key,
  nome text not null,
  whatsapp text,
  website text,
  endereco text,
  mensagem_inicial text,
  mensagem_personalizada text,
  status text not null default 'pending',
  na_fila boolean not null default false,
  data_envio timestamptz,
  data_resposta timestamptz,
  erro text,
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;

-- Politica para permitir leitura/escrita via service_role (necessario com RLS ativo)
create policy "service_role full access"
  on public.leads for all
  to service_role
  using (true)
  with check (true);
