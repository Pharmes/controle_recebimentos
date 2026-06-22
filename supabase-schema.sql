create schema if not exists controle_recebimentos;

create table if not exists controle_recebimentos.system_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into controle_recebimentos.system_settings (key, value)
values ('prazo_requisicao_atrasada_horas', '{"hours": 22}'::jsonb)
on conflict (key) do update
set
  value = excluded.value,
  updated_at = now();
