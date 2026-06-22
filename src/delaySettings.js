export const DELAY_SETTING_KEY = "prazo_requisicao_atrasada_horas";
export const DEFAULT_DELAY_HOURS = 22;
export const ALLOWED_DELAY_HOURS = [22, 32, 48, 72];

export function normalizeDelayHours(value) {
  const parsed = Number.parseInt(String(value ?? ""), 10);

  return ALLOWED_DELAY_HOURS.includes(parsed) ? parsed : DEFAULT_DELAY_HOURS;
}
