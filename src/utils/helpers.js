import { format, parseISO, isBefore, addMonths } from 'date-fns'

export const fmt = (date, pattern = 'dd MMM yyyy') => {
  if (!date) return '—'
  try { return format(typeof date === 'string' ? parseISO(date) : date, pattern) }
  catch { return '—' }
}

export const fmtCurrency = (amount, currency = 'TRY') => {
  if (amount == null || amount === '') return '—'
  const sym = { TRY: '₺', USD: '$', EUR: '€', GBP: '£' }[currency] || currency
  return `${sym}${Number(amount).toLocaleString('tr-TR', { minimumFractionDigits: 0 })}`
}

export const daysOverdue = (dueDate) => {
  if (!dueDate) return 0
  return Math.floor((new Date() - parseISO(dueDate)) / 86400000)
}

export const generatePayments = (contract) => {
  if (!contract.start_date || !contract.monthly_rent) return []
  const payments = []
  const payDay = contract.payment_day || 1
  const start = parseISO(contract.start_date)
  const end = contract.end_date ? parseISO(contract.end_date) : addMonths(new Date(), 12)
  let cur = new Date(start.getFullYear(), start.getMonth(), payDay)
  if (isBefore(cur, start)) cur = addMonths(cur, 1)
  const today = new Date()
  while (!isBefore(end, cur)) {
    payments.push({
      contract_id: contract.id,
      user_id: contract.user_id,
      due_date: format(cur, 'yyyy-MM-dd'),
      amount: contract.monthly_rent,
      currency: contract.currency || 'TRY',
      status: isBefore(cur, today) ? 'pending' : 'upcoming',
    })
    cur = addMonths(cur, 1)
  }
  return payments
}

export const UNIT_TYPES = ['Studio', '1+1', '2+1', '3+1', '4+1', 'Duplex', 'Commercial', 'Other']
export const CURRENCIES = ['TRY', 'USD', 'EUR', 'GBP']
export const PAYMENT_METHODS = ['Bank Transfer (EFT)', 'Cash', 'Crypto', 'Other']
export const NATIONALITIES = ['Turkish', 'Syrian', 'Egyptian', 'Saudi', 'Emirati', 'Iraqi', 'Qatari', 'British', 'German', 'American', 'Russian', 'Other']
export const BUILDINGS = ['A', 'B', 'C', 'NLOGO', 'Other']

export const statusStyle = {
  unit: { vacant: 'badge-green', rented: 'badge-blue', maintenance: 'badge-amber' },
  payment: { paid: 'badge-green', pending: 'badge-amber', overdue: 'badge-red', upcoming: 'badge-slate' },
  contract: { active: 'badge-green', expired: 'badge-slate', terminated: 'badge-red' },
}
