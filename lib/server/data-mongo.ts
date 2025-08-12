import { randomUUID } from "crypto"
import { getDb } from "./mongo"

export type Role = "student" | "coordinator" | "admin" | "vendor"
export type ItemCategory = "Laptop" | "Monitor" | "Battery" | "Other"
export type ItemStatus = "Reported" | "Awaiting Pickup" | "Scheduled" | "Collected" | "Recycled" | "Refurbished" | "Safely Disposed"
export type Disposition = "Recyclable" | "Reusable" | "Hazardous" | null

export type Department = { id: number; name: string; location: string }
export type Vendor = { id: string; company_name: string; contact_person: string; email: string; cpcb_registration_no: string }
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
export type Pickup = { id: string; vendor_id: string; admin_id: string; scheduled_date: string; status: "Scheduled" | "Completed" }
export type Campaign = { id: string; title: string; date: string; description?: string }

function mapId<T extends Record<string, any>>(doc: any, extra?: Partial<T>): T {
  if (!doc) return doc
  const { _id, ...rest } = doc
  return { id: String(_id), ...(rest as any), ...(extra || {}) }
}

// Departments
export async function listDepartments(): Promise<Department[]> {
  const db = await getDb()
  const rows = await db.collection("departments").find({}).project({ _id: 1, name: 1, location: 1 }).toArray()
  return rows.map((d: any) => ({ id: typeof d._id === "number" ? d._id : Number(d._id), name: d.name, location: d.location }))
}

// Vendors
export async function listVendors(): Promise<Vendor[]> {
  const db = await getDb()
  const rows = await db.collection("vendors").find({}).project({ _id: 1, company_name: 1, contact_person: 1, email: 1, cpcb_registration_no: 1 }).toArray()
  return rows.map((v: any) => ({ id: String(v._id), company_name: v.company_name, contact_person: v.contact_person, email: v.email, cpcb_registration_no: v.cpcb_registration_no }))
}

// Items
export async function createItem(input: { name: string; description?: string; category: ItemCategory; department_id: number; reported_by: string; origin: string }): Promise<EwasteItem> {
  const db = await getDb()
  const id = randomUUID()
  const now = new Date().toISOString()
  const qrUrl = `${input.origin}/item/${id}`
  const doc = {
    _id: id,
    name: input.name,
    description: input.description || null,
    category: input.category,
    status: "Reported" as ItemStatus,
    department_id: input.department_id,
    reported_by: input.reported_by,
    reported_date: now,
    disposed_date: null,
    disposition: null as Disposition,
    qr_code_url: qrUrl,
  }
  await db.collection("items").insertOne(doc)
  return mapId<EwasteItem>(doc)
}

export async function listItems(filter?: { status?: ItemStatus; department_id?: number; category?: ItemCategory }): Promise<EwasteItem[]> {
  const db = await getDb()
  const q: any = {}
  if (filter?.status) q.status = filter.status
  if (filter?.department_id) q.department_id = filter.department_id
  if (filter?.category) q.category = filter.category
  const rows = await db.collection("items").find(q).sort({ reported_date: -1 }).toArray()
  return rows.map((d: any) => mapId<EwasteItem>(d))
}

export async function getItem(id: string): Promise<EwasteItem | null> {
  const db = await getDb()
  const d = await db.collection("items").findOne({ _id: id })
  return d ? mapId<EwasteItem>(d) : null
}

export async function updateItem(id: string, changes: Partial<Pick<EwasteItem, "status" | "description" | "category" | "disposed_date" | "disposition">>): Promise<EwasteItem | null> {
  const db = await getDb()
  await db.collection("items").updateOne({ _id: id }, { $set: changes })
  const d = await db.collection("items").findOne({ _id: id })
  return d ? mapId<EwasteItem>(d) : null
}

// Pickups
export async function schedulePickup(input: { admin_id: string; vendor_id: string; scheduled_date: string; item_ids: string[] }): Promise<Pickup> {
  const db = await getDb()
  const id = randomUUID()
  const pick: Pickup = { id, admin_id: input.admin_id, vendor_id: input.vendor_id, scheduled_date: input.scheduled_date, status: "Scheduled" }
  await db.collection("pickups").insertOne({ _id: id, ...pick })
  if (input.item_ids?.length) {
    const ops = input.item_ids.map((item_id) => ({ _id: randomUUID(), pickup_id: id, item_id }))
    if (ops.length) await db.collection("pickup_items").insertMany(ops)
    await db.collection("items").updateMany({ _id: { $in: input.item_ids } }, { $set: { status: "Scheduled" } })
  }
  return pick
}

// Campaigns
export async function listCampaigns(): Promise<Campaign[]> {
  const db = await getDb()
  const rows = await db.collection("campaigns").find({}).sort({ date: -1 }).toArray()
  return rows.map((d: any) => mapId<Campaign>(d))
}

export async function createCampaign(input: { title: string; date: string; description?: string }): Promise<Campaign> {
  const db = await getDb()
  const id = randomUUID()
  const doc = { _id: id, title: input.title, date: input.date, description: input.description || null }
  await db.collection("campaigns").insertOne(doc)
  return mapId<Campaign>(doc)
}

// Analytics
export async function analyticsVolumeTrends(): Promise<{ month: string; count: number }[]> {
  const items = await listItems()
  const map = new Map<string, number>()
  for (const it of items) {
    const m = it.reported_date.slice(0, 7)
    map.set(m, (map.get(m) || 0) + 1)
  }
  return Array.from(map.entries()).sort((a, b) => (a[0] > b[0] ? 1 : -1)).map(([month, count]) => ({ month, count }))
}

export async function analyticsCategoryDistribution(): Promise<{ category: ItemCategory; count: number }[]> {
  const items = await listItems()
  const map = new Map<ItemCategory, number>()
  for (const it of items) map.set(it.category, (map.get(it.category) || 0) + 1)
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

