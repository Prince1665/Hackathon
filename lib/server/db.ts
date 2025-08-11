import { neon } from "@neondatabase/serverless"
import { v4 as uuidv4 } from "uuid"

export type Role = "student" | "coordinator" | "admin" | "vendor"
export type ItemCategory = "Laptop" | "Monitor" | "Battery" | "Other"
export type ItemStatus = "Reported" | "Awaiting Pickup" | "Scheduled" | "Collected" | "Recycled" | "Refurbished" | "Safely Disposed"
export type Disposition = "Recyclable" | "Reusable" | "Hazardous" | null

export type Department = {
  id: number
  name: string
  location: string
}

export type Vendor = {
  id: string
  company_name: string
  contact_person: string
  email: string
  cpcb_registration_no: string
}

export type EwasteItem = {
  id: string
  name: string
  description?: string
  category: ItemCategory
  status: ItemStatus
  department_id: number
  reported_by: string
  reported_date: string
  disposed_date?: string | null
  disposition: Disposition
  qr_code_url: string
}

export type Pickup = {
  id: string
  vendor_id: string
  admin_id: string
  scheduled_date: string
  status: "Scheduled" | "Completed"
}

export type PickupItem = {
  id: string
  pickup_id: string
  item_id: string
}

export type Campaign = {
  id: string
  title: string
  date: string
  description?: string
}


export type User = {
  user_id: string
  name: string
  email: string
  password_hash: string | null
  role: Role
  department_id: number | null
}

const useNeon = !!process.env.DATABASE_URL
const sql = useNeon ? neon(process.env.DATABASE_URL as string) : null

// In-memory fallback for Next.js preview
const mem = {
  departments: new Map<number, Department>(),
  vendors: new Map<string, Vendor>(),
  items: new Map<string, EwasteItem>(),
  pickups: new Map<string, Pickup>(),
  pickupItems: new Map<string, PickupItem>(),
  users: new Map<string, User>(),
  campaigns: new Map<string, Campaign>(),
}

// Seed some memory data on first import
if (!useNeon && mem.departments.size === 0) {
  mem.departments.set(1, { id: 1, name: "Computer Science", location: "Block A" })
  mem.departments.set(2, { id: 2, name: "Electrical", location: "Block B" })
  mem.departments.set(3, { id: 3, name: "Mechanical", location: "Block C" })
  const v1: Vendor = {
    id: uuidv4(),
    company_name: "GreenCycle Pvt Ltd",
    contact_person: "Asha",
    email: "ops@greencycle.example",
    cpcb_registration_no: "CPCB-12345",
  }
  const v2: Vendor = {
    id: uuidv4(),
    company_name: "EcoWaste Solutions",
    contact_person: "Ravi",
    email: "contact@ecowaste.example",
    cpcb_registration_no: "CPCB-67890",
  }
  mem.vendors.set(v1.id, v1)
  mem.vendors.set(v2.id, v2)

  // Seed demo users for preview auth
  const demoUsers: User[] = [
    {
      user_id: "55555555-5555-5555-5555-555555555555",
      name: "Admin User",
      email: "admin@example.com",
      password_hash: "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9", // admin123
      role: "admin",
      department_id: 1,
    },
    {
      user_id: "66666666-6666-6666-6666-666666666666",
      name: "Student One",
      email: "student1@example.com",
      password_hash: "703b0a3d6ad75b649a28adde7d83c6251da457549263bc7ff45ec709b0a8448b", // student123
      role: "student",
      department_id: 1,
    },
    {
      user_id: "77777777-7777-7777-7777-777777777777",
      name: "Student Two",
      email: "student2@example.com",
      password_hash: "703b0a3d6ad75b649a28adde7d83c6251da457549263bc7ff45ec709b0a8448b", // student123
      role: "student",
      department_id: 2,
    },
    {
      user_id: "88888888-8888-8888-8888-888888888888",
      name: "Faculty One",
      email: "faculty1@example.com",
      password_hash: "27041f5856c7387a997252694afb048d1aa939228ffcdbd6285b979b8da20e7a", // faculty123
      role: "coordinator",
      department_id: 2,
    },
    {
      user_id: "99999999-9999-9999-9999-999999999999",
      name: "Vendor User",
      email: "vendor1@example.com",
      password_hash: "00fc1e6c602824793c9840e781e5e20747507e26ddf0d60fab996567a0327cdf", // vendor123
      role: "vendor",
      department_id: null,
    },
  ]
  for (const u of demoUsers) mem.users.set(u.user_id, u)

  // Seed a few ewaste items for demo/preview use
  const now = Date.now()
  const daysAgo = (n: number) => new Date(now - n * 24 * 60 * 60 * 1000).toISOString()
  const localOrigin = "http://localhost:3000"

  const i1: EwasteItem = {
    id: uuidv4(),
    name: "Dell Latitude 5400",
    description: "Old laptop from lab",
    category: "Laptop",
    status: "Reported",
    department_id: 1,
    reported_by: "student1",
    reported_date: daysAgo(10),
    disposed_date: null,
    disposition: null,
    qr_code_url: `${localOrigin}/item/${uuidv4()}`,
  }

  const i2: EwasteItem = {
    id: uuidv4(),
    name: "HP 24-inch Monitor",
    description: "Cracked screen",
    category: "Monitor",
    status: "Awaiting Pickup",
    department_id: 2,
    reported_by: "coordinator1",
    reported_date: daysAgo(20),
    disposed_date: null,
    disposition: null,
    qr_code_url: `${localOrigin}/item/${uuidv4()}`,
  }

  const i3: EwasteItem = {
    id: uuidv4(),
    name: "Li-ion Battery",
    description: "Swollen battery from old UPS",
    category: "Battery",
    status: "Recycled",
    department_id: 2,
    reported_by: "coordinator2",
    reported_date: daysAgo(40),
    disposed_date: daysAgo(5),
    disposition: "Recyclable",
    qr_code_url: `${localOrigin}/item/${uuidv4()}`,
  }

  const i4: EwasteItem = {
    id: uuidv4(),
    name: "Mixed Cables",
    description: "Assorted HDMI/ethernet cables",
    category: "Other",
    status: "Safely Disposed",
    department_id: 3,
    reported_by: "admin1",
    reported_date: daysAgo(60),
    disposed_date: daysAgo(2),
    disposition: "Hazardous",
    qr_code_url: `${localOrigin}/item/${uuidv4()}`,
  }

  mem.items.set(i1.id, i1)
  mem.items.set(i2.id, i2)
  mem.items.set(i3.id, i3)
  mem.items.set(i4.id, i4)
}

export async function listDepartments(): Promise<Department[]> {
  if (useNeon && sql) {
    const rows = await sql<Department>`select department_id as id, name, location from departments order by name;`
    return rows
  }
  return Array.from(mem.departments.values())
}

export async function listVendors(): Promise<Vendor[]> {
  if (useNeon && sql) {
    const rows = await sql<Vendor>`
      select vendor_id as id, company_name, contact_person, email, cpcb_registration_no
      from vendors order by company_name;`
    return rows
  }
  return Array.from(mem.vendors.values())
}

export async function createItem(input: {
  name: string
  description?: string
  category: ItemCategory
  department_id: number
  reported_by: string
  origin: string // to build QR URL
}): Promise<EwasteItem> {
  const id = uuidv4()
  const qrUrl = `${input.origin}/item/${id}`
  const now = new Date().toISOString()
  if (useNeon && sql) {
    const rows = await sql<EwasteItem>`
      insert into ewaste_items (item_id, name, description, category, status, department_id, reported_by_user_id, reported_date, qr_code_data)
      values (${id}, ${input.name}, ${input.description || null}, ${input.category}, 'Reported', ${input.department_id}, ${input.reported_by}, ${now}, ${qrUrl})
      returning item_id as id, name, description, category, status, department_id, reported_by_user_id as reported_by,
                reported_date, disposed_date, qr_code_data as qr_code_url, null as disposition;
    `
    return rows[0]
  }
  const item: EwasteItem = {
    id,
    name: input.name,
    description: input.description,
    category: input.category,
    status: "Reported",
    department_id: input.department_id,
    reported_by: input.reported_by,
    reported_date: now,
    disposed_date: null,
    disposition: null,
    qr_code_url: qrUrl,
  }
  mem.items.set(id, item)
  return item
}

export async function listItems(filter?: {
  status?: ItemStatus
  department_id?: number
  category?: ItemCategory
}): Promise<EwasteItem[]> {
  if (useNeon && sql) {
    const where: string[] = []
    const params: any[] = []
    if (filter?.status) {
      where.push(`status = $${params.length + 1}`)
      params.push(filter.status)
    }
    if (filter?.department_id) {
      where.push(`department_id = $${params.length + 1}`)
      params.push(filter.department_id)
    }
    if (filter?.category) {
      where.push(`category = $${params.length + 1}`)
      params.push(filter.category)
    }
    const query = `
      select item_id as id, name, description, category, status, department_id, reported_by_user_id as reported_by,
             reported_date, disposed_date, qr_code_data as qr_code_url, null as disposition
      from ewaste_items
      ${where.length ? `where ${where.join(" and ")}` : ""}
      order by reported_date desc;
    `
    const rows = await (sql as any)(query, params)
    return rows as EwasteItem[]
  }
  let items = Array.from(mem.items.values())
  if (filter?.status) items = items.filter((i) => i.status === filter.status)
  if (filter?.department_id) items = items.filter((i) => i.department_id === filter.department_id)
  if (filter?.category) items = items.filter((i) => i.category === filter.category)
  return items.sort((a, b) => (a.reported_date < b.reported_date ? 1 : -1))
}

export async function getItem(id: string): Promise<EwasteItem | null> {
  if (useNeon && sql) {
    const rows = await sql<EwasteItem>`
      select item_id as id, name, description, category, status, department_id, reported_by_user_id as reported_by,
             reported_date, disposed_date, qr_code_data as qr_code_url, null as disposition
      from ewaste_items where item_id = ${id} limit 1;`
    return rows[0] || null
  }
  return mem.items.get(id) || null
}

export async function updateItem(id: string, changes: Partial<Pick<EwasteItem, "status" | "description" | "category" | "disposed_date" | "disposition">>): Promise<EwasteItem | null> {
  if (useNeon && sql) {
    const current = await getItem(id)
    if (!current) return null
    const next = { ...current, ...changes }
    await sql`
      update ewaste_items
      set status = ${next.status},
          description = ${next.description || null},
          category = ${next.category},
          disposed_date = ${next.disposed_date || null}
      where item_id = ${id};
    `
    return next
  }
  const existing = mem.items.get(id)
  if (!existing) return null
  const updated: EwasteItem = { ...existing, ...changes }
  mem.items.set(id, updated)
  return updated
}

export async function schedulePickup(input: {
  admin_id: string
  vendor_id: string
  scheduled_date: string
  item_ids: string[]
}): Promise<Pickup> {
  const pickupId = uuidv4()
  const pickup: Pickup = {
    id: pickupId,
    admin_id: input.admin_id,
    vendor_id: input.vendor_id,
    scheduled_date: input.scheduled_date,
    status: "Scheduled",
  }
  if (useNeon && sql) {
    await sql`
      insert into pickups (pickup_id, vendor_id, admin_id, scheduled_date, status)
      values (${pickup.id}, ${pickup.vendor_id}, ${pickup.admin_id}, ${pickup.scheduled_date}, ${pickup.status});
    `
    for (const itemId of input.item_ids) {
      const pid = uuidv4()
      await sql`
        insert into pickup_items (id, pickup_id, item_id) values (${pid}, ${pickup.id}, ${itemId});
      `
      await updateItem(itemId, { status: "Scheduled" })
    }

    return pickup
  }
  mem.pickups.set(pickupId, pickup)
  for (const itemId of input.item_ids) {
    const id = uuidv4()
    mem.pickupItems.set(id, { id, pickup_id: pickupId, item_id: itemId })
    await updateItem(itemId, { status: "Scheduled" })
  }
  return pickup
}

export async function listCampaigns(): Promise<Campaign[]> {
  if (useNeon && sql) {
    const rows = await sql<Campaign>`select campaign_id as id, title, date, description from campaigns order by date desc;`
    return rows
  }
  return Array.from(mem.campaigns.values()).sort((a, b) => (a.date < b.date ? 1 : -1))
}

export async function createCampaign(input: { title: string; date: string; description?: string }): Promise<Campaign> {
  const id = uuidv4()
  const c: Campaign = { id, title: input.title, date: input.date, description: input.description }
  if (useNeon && sql) {
    await sql`insert into campaigns (campaign_id, title, date, description) values (${c.id}, ${c.title}, ${c.date}, ${c.description || null});`
    return c
  }
  mem.campaigns.set(id, c)
  return c
}


// Analytics (very simple demo aggregations)
export async function analyticsVolumeTrends(): Promise<{ month: string; count: number }[]> {
  const items = await listItems()
  const map = new Map<string, number>()
  for (const it of items) {
    const m = it.reported_date.slice(0, 7) // YYYY-MM
    map.set(m, (map.get(m) || 0) + 1)
  }
  return Array.from(map.entries())
    .sort((a, b) => (a[0] > b[0] ? 1 : -1))
    .map(([month, count]) => ({ month, count }))
}

export async function analyticsCategoryDistribution(): Promise<{ category: ItemCategory; count: number }[]> {
  const items = await listItems()
  const map = new Map<ItemCategory, number>()
  for (const it of items) {
    map.set(it.category, (map.get(it.category) || 0) + 1)
  }
  return Array.from(map.entries()).map(([category, count]) => ({ category, count }))
}

export async function analyticsRecoveryRate(): Promise<{ rate: number; recycled: number; disposed: number }> {
  const items = await listItems()
  const recycled = items.filter((i) => i.status === "Recycled").length
  const disposed = items.filter((i) => ["Recycled", "Refurbished", "Safely Disposed"].includes(i.status)).length
  const total = items.length
  const rate = total ? Math.round(((recycled / total) * 100 + Number.EPSILON) * 100) / 100 : 0
  return { rate, recycled, disposed }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  if (useNeon && sql) {
    const rows = await sql<User>`
      select user_id, name, email, password_hash, role, department_id
      from users where email = ${email} limit 1;`
    return rows[0] || null
  }
  const user = Array.from(mem.users.values()).find((u) => u.email.toLowerCase() === email.toLowerCase())
  return user || null
}
