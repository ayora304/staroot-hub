export function formatMoney(amount: number | null | undefined, currency: string | null | undefined): string {
  if (amount == null) return ''
  return `${currency ?? 'KES'} ${amount.toLocaleString('en-KE', { maximumFractionDigits: 2 })}`
}
export const formatWhen = (iso: string) => new Date(iso).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })
