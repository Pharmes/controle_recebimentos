create table if not exists public.system_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.system_settings (key, value)
values ('prazo_requisicao_atrasada_horas', '{"hours": 22}'::jsonb)
on conflict (key) do nothing;
