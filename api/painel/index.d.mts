/** Tipos da API do painel (index.mjs), para os testes em TypeScript. */
type Item = { nome: string; total: number }
type Totais = Record<string, number>
export const CONTATOS: Set<string>
export function horaLocal(iso: string): { dia: string; hora: number; semana: number }
export function origemDe(referrer: string, utm?: Record<string, string>): string
export function aparelhoDe(ua?: string): string
export function validarEvento(corpo: unknown, ua: string | undefined, agora?: string): Record<string, unknown> | null
export function indicadores(
  eventos: Record<string, unknown>[],
  dias: number,
  hojeIso?: string,
): { totais: Totais; serie: unknown[]; origens: Item[]; origensContato: Item[]; [k: string]: unknown }
export function assinar(dados: Record<string, unknown>, segredo?: string, horas?: number): string
export function verificar(token: string, segredo?: string): Record<string, unknown> | null
export function hashSenha(senha: string, sal?: string): { sal: string; hash: string }
export function confere(senha: string, sal: string, hash: string): boolean
export function handler(evento: unknown): Promise<{ statusCode: number; body?: string }>
