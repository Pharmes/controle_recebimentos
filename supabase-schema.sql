create schema if not exists "controle de recebimentos";

create table if not exists "controle de recebimentos".system_seting (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into "controle de recebimentos".system_seting (key, value)
values ('prazo_requisicao_atrasada_horas', '{"hours": 22}'::jsonb)
on conflict (key) do update
set
  value = excluded.value,
  updated_at = now();
