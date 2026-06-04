import { supabase } from '../lib/supabase'
import { format, isBefore, parseISO, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { SEED_OWNERS, SEED_TENANTS, SEED_UNITS } from '../data/seedData'

// ─── OWNERS ────────────────────────────────────
export const getOwners = async (uid) => {
  const { data, error } = await supabase.from('owners').select('*').eq('user_id', uid).order('name')
  if (error) throw error
  return data
}
export const saveOwner = async (uid, form, id) => {
  const payload = { ...form, user_id: uid }
  if (id) {
    const { data, error } = await supabase.from('owners').update(payload).eq('id', id).select().single()
    if (error) throw error; return data
  }
  const { data, error } = await supabase.from('owners').insert(payload).select().single()
  if (error) throw error; return data
}
export const deleteOwner = async (id) => {
  const { error } = await supabase.from('owners').delete().eq('id', id)
  if (error) throw error
}

// ─── TENANTS ───────────────────────────────────
export const getTenants = async (uid) => {
  const { data, error } = await supabase.from('tenants').select('*').eq('user_id', uid).order('name')
  if (error) throw error
  return data
}
export const saveTenant = async (uid, form, id) => {
  const payload = { ...form, user_id: uid }
  if (id) {
    const { data, error } = await supabase.from('tenants').update(payload).eq('id', id).select().single()
    if (error) throw error; return data
  }
  const { data, error } = await supabase.from('tenants').insert(payload).select().single()
  if (error) throw error; return data
}
export const deleteTenant = async (id) => {
  const { error } = await supabase.from('tenants').delete().eq('id', id)
  if (error) throw error
}

// ─── UNITS ─────────────────────────────────────
export const getUnits = async (uid) => {
  const { data, error } = await supabase
    .from('units')
    .select('*, owners(name, phone)')
    .eq('user_id', uid)
    .order('unit_number')
  if (error) throw error
  return data
}
export const saveUnit = async (uid, form, id) => {
  const payload = { ...form, user_id: uid }
  if (id) {
    const { data, error } = await supabase.from('units').update(payload).eq('id', id).select().single()
    if (error) throw error; return data
  }
  const { data, error } = await supabase.from('units').insert(payload).select().single()
  if (error) throw error; return data
}
export const deleteUnit = async (id) => {
  const { error } = await supabase.from('units').delete().eq('id', id)
  if (error) throw error
}

// ─── CONTRACTS ─────────────────────────────────
export const getContracts = async (uid) => {
  const { data, error } = await supabase
    .from('contracts')
    .select('*, units(unit_number, building, floor), tenants(name, phone)')
    .eq('user_id', uid)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export const createContract = async (uid, form) => {
  const payload = { ...form, user_id: uid }
  const { data, error } = await supabase.from('contracts').insert(payload).select().single()
  if (error) throw error
  // Mark unit rented
  await supabase.from('units').update({ status: 'rented' }).eq('id', form.unit_id)
  // Generate payments
  await generateContractPayments(data)
  return data
}

export const terminateContract = async (id, unitId) => {
  await supabase.from('contracts').update({ status: 'terminated' }).eq('id', id)
  await supabase.from('units').update({ status: 'vacant' }).eq('id', unitId)
  const today = format(new Date(), 'yyyy-MM-dd')
  await supabase.from('payments').delete().eq('contract_id', id).in('status', ['pending', 'upcoming']).gte('due_date', today)
}

const generateContractPayments = async (contract) => {
  if (!contract.start_date || !contract.monthly_rent) return
  const payDay = contract.payment_day || 1
  const start = parseISO(contract.start_date)
  const end = contract.end_date ? parseISO(contract.end_date) : addMonths(new Date(), 24)
  const payments = []
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
  if (payments.length > 0) {
    await supabase.from('payments').insert(payments)
  }
}

// ─── PAYMENTS ──────────────────────────────────
export const getPayments = async (uid, filters = {}) => {
  let q = supabase
    .from('payments')
    .select('*, contracts(currency, units(unit_number, building, owners(name)), tenants(name, phone))')
    .eq('user_id', uid)
    .order('due_date', { ascending: false })
  if (filters.contractId) q = q.eq('contract_id', filters.contractId)
  const { data, error } = await q
  if (error) throw error
  return data
}

export const markPaid = async (id, { paid_date, payment_method, notes }) => {
  const { data, error } = await supabase
    .from('payments')
    .update({ status: 'paid', paid_date, payment_method, notes })
    .eq('id', id).select().single()
  if (error) throw error
  return data
}

export const refreshOverdue = async (uid) => {
  const today = format(new Date(), 'yyyy-MM-dd')
  await supabase.from('payments').update({ status: 'overdue' })
    .eq('user_id', uid).eq('status', 'pending').lt('due_date', today)
}

// ─── DASHBOARD ─────────────────────────────────
export const getDashboard = async (uid) => {
  await refreshOverdue(uid)
  const today = format(new Date(), 'yyyy-MM-dd')
  const m1 = format(startOfMonth(new Date()), 'yyyy-MM-dd')
  const m2 = format(endOfMonth(new Date()), 'yyyy-MM-dd')

  const [units, contracts, overdueRes, monthRes] = await Promise.all([
    supabase.from('units').select('status').eq('user_id', uid),
    supabase.from('contracts').select('monthly_rent, currency, status').eq('user_id', uid),
    supabase.from('payments')
      .select('amount, currency, due_date, contracts(units(unit_number, building), tenants(name, phone))')
      .eq('user_id', uid).in('status', ['pending', 'overdue']).lt('due_date', today).order('due_date'),
    supabase.from('payments').select('amount, status, currency').eq('user_id', uid).gte('due_date', m1).lte('due_date', m2),
  ])

  const u = units.data || []
  const c = contracts.data || []
  const ov = overdueRes.data || []
  const mp = monthRes.data || []

  return {
    totalUnits: u.length,
    rentedUnits: u.filter(x => x.status === 'rented').length,
    vacantUnits: u.filter(x => x.status === 'vacant').length,
    maintenanceUnits: u.filter(x => x.status === 'maintenance').length,
    occupancyRate: u.length ? Math.round((u.filter(x => x.status === 'rented').length / u.length) * 100) : 0,
    activeContracts: c.filter(x => x.status === 'active').length,
    monthExpected: mp.reduce((s, p) => s + p.amount, 0),
    monthCollected: mp.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0),
    overdueCount: ov.length,
    overdueList: ov,
  }
}

export const getMonthlyChart = async (uid) => {
  const months = []
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(new Date(), i)
    const from = format(startOfMonth(d), 'yyyy-MM-dd')
    const to = format(endOfMonth(d), 'yyyy-MM-dd')
    const { data } = await supabase.from('payments').select('amount, status').eq('user_id', uid).gte('due_date', from).lte('due_date', to)
    const p = data || []
    months.push({
      month: format(d, 'MMM yy'),
      expected: p.reduce((s, x) => s + x.amount, 0),
      collected: p.filter(x => x.status === 'paid').reduce((s, x) => s + x.amount, 0),
    })
  }
  return months
}

// ─── SEED ──────────────────────────────────────
export const seedData = async (uid) => {
  // 1. Insert owners
  const { data: owners } = await supabase.from('owners').insert(
    SEED_OWNERS.map(o => ({ ...o, user_id: uid }))
  ).select()

  const ownerMap = {}
  owners.forEach(o => { ownerMap[o.name] = o.id })

  // 2. Insert tenants
  const tenantsToInsert = SEED_TENANTS.map(({ notes, ...t }) => ({ ...t, user_id: uid, notes: notes || null }))
  const { data: tenants } = await supabase.from('tenants').insert(tenantsToInsert).select()
  const tenantMap = {}
  tenants.forEach(t => { tenantMap[t.name] = t.id })

  // 3. Insert units + contracts
  for (const u of SEED_UNITS) {
    const { owner, tenant, start_date, monthly_rent, currency, payment_day, ...unitFields } = u

    const unitPayload = {
      ...unitFields,
      user_id: uid,
      owner_id: ownerMap[owner] || null,
    }
    const { data: unit } = await supabase.from('units').insert(unitPayload).select().single()

    if (start_date && monthly_rent && tenant && tenantMap[tenant]) {
      const endDate = new Date(parseISO(start_date))
      endDate.setFullYear(endDate.getFullYear() + 1)

      const contractPayload = {
        user_id: uid,
        unit_id: unit.id,
        tenant_id: tenantMap[tenant],
        start_date,
        end_date: format(endDate, 'yyyy-MM-dd'),
        monthly_rent,
        currency: currency || 'TRY',
        payment_day: payment_day || 1,
        status: 'active',
        deposit: 0,
        deposit_paid: false,
      }
      const { data: contract } = await supabase.from('contracts').insert(contractPayload).select().single()
      // Generate upcoming payments only (last 2 months + next 12 months)
      if (contract) {
        const payDay = contract.payment_day || 1
        const start = parseISO(contract.start_date)
        const rangeStart = subMonths(new Date(), 2)
        const rangeEnd = addMonths(new Date(), 12)
        const payments = []
        let cur = new Date(start.getFullYear(), start.getMonth(), payDay)
        if (isBefore(cur, start)) cur = addMonths(cur, 1)
        const today = new Date()
        while (isBefore(cur, rangeEnd)) {
          if (!isBefore(cur, rangeStart)) {
            payments.push({
              contract_id: contract.id,
              user_id: uid,
              due_date: format(cur, 'yyyy-MM-dd'),
              amount: contract.monthly_rent,
              currency: contract.currency || 'TRY',
              status: isBefore(cur, today) ? 'pending' : 'upcoming',
            })
          }
          cur = addMonths(cur, 1)
        }
        if (payments.length > 0) {
          await supabase.from('payments').insert(payments)
        }
      }
    }
  }
  return true
}
