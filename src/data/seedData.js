// Real data extracted from client's Excel file
// Phone numbers normalized, rent amounts in full TL (small values × 1000)

export const SEED_OWNERS = [
  { name: 'MAHMOUD MARE',    phone: '+90 545 863 1895', notes: '' },
  { name: 'MOHAMED SADAKA',  phone: '+974 6669 1778',   notes: '' },
  { name: 'AHMED ELHELW',    phone: '+20 100 623 1981',  notes: '' },
  { name: 'AYMAN FOUAD',     phone: '+974 5098 9098',   notes: '' },
  { name: 'OMAR ADEL',       phone: '+20 111 800 0292', notes: 'Also listed as OMAR/ISLAM' },
  { name: 'EMAN ADEL',       phone: '',                 notes: 'Omar Adel\'s sister' },
  { name: 'NASSER HAMOUD',   phone: '+974 5553 5438',   notes: '' },
  { name: 'TAMER BAHAA',     phone: '+20 115 009 0003', notes: '' },
  { name: 'AHMED SAMY',      phone: '+20 111 077 7833', notes: '' },
  { name: 'YOUSSEF FOUAD',   phone: '+974 3311 3134',   notes: '' },
]

export const SEED_TENANTS = [
  { name: 'Kerem',         phone: '+90 552 493 0282', nationality: 'Turkish' },
  { name: 'Emir',          phone: '+90 501 605 5644', nationality: 'Turkish' },
  { name: 'Bem',           phone: '+90 536 608 7882', nationality: 'Turkish' },
  { name: 'İsimsiz',       phone: '+90 531 605 7754', nationality: 'Turkish' },
  { name: 'Asya',          phone: '+90 553 468 8828', nationality: 'Turkish' },
  { name: 'Azizpek',       phone: '+90 536 938 6189', nationality: 'Turkish' },
  { name: 'Emin',          phone: '+90 501 542 2702', nationality: 'Turkish' },
  { name: 'KIFAH GARİP',   phone: '+90 531 761 4139', nationality: 'Other' },
  { name: 'Yunus',         phone: '+90 554 023 6504', nationality: 'Turkish' },
  { name: 'Berkan',        phone: '+90 530 705 9613', nationality: 'Turkish' },
  { name: 'Muhammet',      phone: '+90 543 543 7470', nationality: 'Turkish', notes: 'A265' },
  { name: 'Çiğdem',        phone: '+90 546 820 9967', nationality: 'Turkish' },
  { name: 'Muhammet B.',   phone: '+90 506 860 9768', nationality: 'Turkish', notes: 'A595' },
  { name: 'Çağrı',         phone: '+90 532 633 7401', nationality: 'Turkish' },
  { name: 'Araz',          phone: '+90 552 705 1189', nationality: 'Turkish' },
  { name: 'EHSAN',         phone: '+90 501 673 1015', nationality: 'Other' },
  { name: 'Şahin',         phone: '+90 538 828 7371', nationality: 'Turkish' },
  { name: 'Sırrı',         phone: '+90 507 893 1030', nationality: 'Turkish' },
  { name: 'ZAİN MALİK',   phone: '+90 535 580 4971', nationality: 'Other' },
  { name: 'Yasser',        phone: '+90 531 836 6936', nationality: 'Other' },
  { name: 'MUHAMMAD AMMAR', phone: '+964 777 763 7514', nationality: 'Other' },
]

// Units: code, building (A/B/C/NLOGO), number, type, status
// Contracts: ownerName, tenantName, startDate, rentAmount, currency, paymentDay, notes
export const SEED_UNITS = [
  // ────────────── MAHMOUD MARE ──────────────
  {
    unit_number: 'B89', building: 'B', floor: null, type: '1+1', size_sqm: null,
    status: 'rented', notes: 'EŞYALI',
    owner: 'MAHMOUD MARE',
    tenant: 'Kerem',
    start_date: '2026-04-17', monthly_rent: 22000, currency: 'TRY', payment_day: 17,
  },
  {
    unit_number: 'B149', building: 'B', floor: null, type: '1+1', size_sqm: null,
    status: 'rented', notes: 'EŞYALI',
    owner: 'MAHMOUD MARE',
    tenant: 'Emir',
    start_date: '2025-08-14', monthly_rent: 21000, currency: 'TRY', payment_day: 14,
  },
  {
    unit_number: 'C97', building: 'C', floor: null, type: '1+1', size_sqm: null,
    status: 'rented', notes: 'EŞYALI',
    owner: 'MAHMOUD MARE',
    tenant: 'Bem',
    start_date: '2026-04-27', monthly_rent: 23000, currency: 'TRY', payment_day: 27,
  },
  {
    unit_number: 'B22', building: 'B', floor: null, type: '1+1', size_sqm: null,
    status: 'rented', notes: 'EŞYALI',
    owner: 'MAHMOUD MARE',
    tenant: 'İsimsiz',
    start_date: '2025-09-01', monthly_rent: 450, currency: 'USD', payment_day: 1,
  },
  {
    unit_number: 'C169', building: 'C', floor: null, type: '1+1', size_sqm: null,
    status: 'rented', notes: 'EŞYALI',
    owner: 'MAHMOUD MARE',
    tenant: 'Asya',
    start_date: '2025-08-01', monthly_rent: 20000, currency: 'TRY', payment_day: 1,
  },
  // ────────────── MOHAMED SADAKA ──────────────
  {
    unit_number: 'B14', building: 'B', floor: null, type: '1+1', size_sqm: null,
    status: 'rented', notes: 'EŞYALI',
    owner: 'MOHAMED SADAKA',
    tenant: 'Azizpek',
    start_date: '2024-11-13', monthly_rent: 17000, currency: 'TRY', payment_day: 13,
  },
  {
    unit_number: 'B161', building: 'B', floor: null, type: '1+1', size_sqm: null,
    status: 'rented', notes: 'EŞYALI',
    owner: 'MOHAMED SADAKA',
    tenant: 'Emin',
    start_date: '2025-06-05', monthly_rent: 19500, currency: 'TRY', payment_day: 5,
  },
  {
    unit_number: 'A152', building: 'A', floor: null, type: '1+1', size_sqm: null,
    status: 'rented', notes: 'EŞYALI',
    owner: 'MOHAMED SADAKA',
    tenant: 'KIFAH GARİP',
    start_date: '2026-02-01', monthly_rent: 21000, currency: 'TRY', payment_day: 1,
  },
  {
    unit_number: 'A361', building: 'A', floor: null, type: '1+1', size_sqm: null,
    status: 'rented', notes: 'EŞYALI',
    owner: 'MOHAMED SADAKA',
    tenant: 'Yunus',
    start_date: '2025-08-21', monthly_rent: 25000, currency: 'TRY', payment_day: 21,
  },
  // ────────────── AHMED ELHELW ──────────────
  {
    unit_number: 'C119', building: 'C', floor: null, type: '1+1', size_sqm: null,
    status: 'rented', notes: 'EŞYALI',
    owner: 'AHMED ELHELW',
    tenant: 'Berkan',
    start_date: '2026-02-22', monthly_rent: 22000, currency: 'TRY', payment_day: 22,
  },
  {
    unit_number: 'A265', building: 'A', floor: null, type: '1+1', size_sqm: null,
    status: 'rented', notes: 'EŞYALI',
    owner: 'AHMED ELHELW',
    tenant: 'Muhammet',
    start_date: '2025-08-01', monthly_rent: 10500, currency: 'TRY', payment_day: 1,
  },
  // ────────────── AYMAN FOUAD ──────────────
  {
    unit_number: 'B173', building: 'B', floor: null, type: '1+1', size_sqm: null,
    status: 'rented', notes: 'EŞYALI',
    owner: 'AYMAN FOUAD',
    tenant: 'Çiğdem',
    start_date: '2025-08-01', monthly_rent: 22000, currency: 'TRY', payment_day: 1,
  },
  {
    unit_number: 'A595', building: 'A', floor: null, type: '1+1', size_sqm: null,
    status: 'rented', notes: 'EŞYALI',
    owner: 'AYMAN FOUAD',
    tenant: 'Muhammet B.',
    start_date: '2025-07-28', monthly_rent: 14000, currency: 'TRY', payment_day: 28,
  },
  {
    unit_number: 'NLOGO183', building: 'NLOGO', floor: null, type: '1+1', size_sqm: null,
    status: 'rented', notes: 'EŞYALI — pending new tenant assignment',
    owner: 'AYMAN FOUAD',
    tenant: null,
    start_date: '2025-05-05', monthly_rent: 16500, currency: 'TRY', payment_day: 5,
  },
  {
    unit_number: 'A240', building: 'A', floor: null, type: '1+1', size_sqm: null,
    status: 'rented', notes: 'EŞYALI',
    owner: 'AYMAN FOUAD',
    tenant: 'Çağrı',
    start_date: '2025-10-01', monthly_rent: 14000, currency: 'TRY', payment_day: 1,
  },
  // ────────────── OMAR ADEL ──────────────
  {
    unit_number: 'B130', building: 'B', floor: null, type: '1+1', size_sqm: null,
    status: 'rented', notes: 'EŞYALI',
    owner: 'OMAR ADEL',
    tenant: 'Araz',
    start_date: '2025-09-18', monthly_rent: 22000, currency: 'TRY', payment_day: 18,
  },
  {
    unit_number: 'A390', building: 'A', floor: null, type: '1+1', size_sqm: null,
    status: 'vacant', notes: 'EŞYALI — New tenant expected soon',
    owner: 'OMAR ADEL',
    tenant: null,
    start_date: null, monthly_rent: null, currency: 'TRY', payment_day: 1,
  },
  // ────────────── EMAN ADEL ──────────────
  {
    unit_number: 'A391', building: 'A', floor: null, type: '1+1', size_sqm: null,
    status: 'rented', notes: 'EŞYALI',
    owner: 'EMAN ADEL',
    tenant: 'EHSAN',
    start_date: '2025-08-01', monthly_rent: 13000, currency: 'TRY', payment_day: 1,
  },
  // ────────────── NASSER HAMOUD ──────────────
  {
    unit_number: 'C134', building: 'C', floor: null, type: '1+1', size_sqm: null,
    status: 'rented', notes: 'EŞYALI',
    owner: 'NASSER HAMOUD',
    tenant: 'Şahin',
    start_date: '2025-12-20', monthly_rent: 21000, currency: 'TRY', payment_day: 20,
  },
  {
    unit_number: 'C63', building: 'C', floor: null, type: '1+1', size_sqm: null,
    status: 'rented', notes: 'EŞYALI',
    owner: 'NASSER HAMOUD',
    tenant: 'Sırrı',
    start_date: '2025-08-23', monthly_rent: 20000, currency: 'TRY', payment_day: 23,
  },
  // ────────────── TAMER BAHAA ──────────────
  {
    unit_number: 'A367', building: 'A', floor: null, type: '1+1', size_sqm: null,
    status: 'rented', notes: 'EŞYALI',
    owner: 'TAMER BAHAA',
    tenant: 'ZAİN MALİK',
    start_date: '2025-08-01', monthly_rent: 13000, currency: 'TRY', payment_day: 1,
  },
  // ────────────── AHMED SAMY ──────────────
  {
    unit_number: 'A212', building: 'A', floor: null, type: '1+1', size_sqm: null,
    status: 'rented', notes: 'EŞYALI',
    owner: 'AHMED SAMY',
    tenant: 'Yasser',
    start_date: '2025-07-01', monthly_rent: 15000, currency: 'TRY', payment_day: 1,
  },
  {
    unit_number: 'B83', building: 'B', floor: null, type: '1+1', size_sqm: null,
    status: 'rented', notes: 'EŞYALI — ⚠️ Tenant NOT PAYING',
    owner: 'AHMED SAMY',
    tenant: null,
    start_date: null, monthly_rent: null, currency: 'TRY', payment_day: 1,
  },
  {
    unit_number: 'C175', building: 'C', floor: null, type: '1+1', size_sqm: null,
    status: 'rented', notes: 'EŞYALI — ⚠️ Tenant NOT PAYING',
    owner: 'AHMED SAMY',
    tenant: null,
    start_date: null, monthly_rent: null, currency: 'TRY', payment_day: 1,
  },
  // ────────────── YOUSSEF FOUAD ──────────────
  {
    unit_number: 'A364', building: 'A', floor: null, type: '1+1', size_sqm: null,
    status: 'rented', notes: 'EŞYALI',
    owner: 'YOUSSEF FOUAD',
    tenant: 'MUHAMMAD AMMAR',
    start_date: '2025-10-08', monthly_rent: 14000, currency: 'TRY', payment_day: 8,
  },
]
