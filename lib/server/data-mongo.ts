import { randomUUID } from "crypto"
import { getDb } from "./mongo"
import { ObjectId } from "mongodb"

export type Role = "student" | "coordinator" | "admin" | "vendor"
export type ItemCategory = "Tablet" | "Microwave" | "Air Conditioner" | "TV" | "Washing Machine" | "Laptop" | "Smartphone" | "Refrigerator"
export type ItemStatus = "Reported" | "Awaiting Pickup" | "Scheduled" | "Collected" | "Recycled" | "Refurbished" | "Safely Disposed"
export type Disposition = "Recyclable" | "Reusable" | "Hazardous" | null

export type AuctionStatus = "active" | "completed" | "cancelled"
export type BidStatus = "active" | "outbid" | "winning"
export type AuctionEventType = "auction_started" | "new_bid" | "auction_ended" | "winner_selected"

export type Department = { id: number; name: string; location: string }
export type Vendor = { id: string; company_name: string; contact_person: string; email: string; cpcb_registration_no: string }

export type Auction = {
  id: number
  item_id: string
  created_by: string
  starting_price: number
  current_highest_bid: number
  auction_duration_hours: number
  start_time: string
  end_time: string
  status: AuctionStatus
  winning_vendor_id?: string | null
  winning_bid?: number | null
  created_at: string
  updated_at: string
}

export type Bid = {
  id: number
  auction_id: number
  vendor_id: string
  bid_amount: number
  bid_time: string
  status: BidStatus
}

export type AuctionEvent = {
  id: number
  auction_id: number
  event_type: AuctionEventType
  user_id: string
  details: any
  created_at: string
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
  brand?: string
  build_quality?: number
  user_lifespan?: number
  usage_pattern?: "Light" | "Moderate" | "Heavy"
  expiry_years?: number
  condition?: number
  original_price?: number
  used_duration?: number
  current_price?: number
}
export type Pickup = { 
  id: string; 
  vendor_id: string; 
  admin_id: string; 
  scheduled_date: string; 
  status: "Scheduled" | "Completed" | "Vendor_Accepted" | "Vendor_Rejected";
  vendor_response?: "Accepted" | "Rejected" | null;
  vendor_response_date?: string | null;
  vendor_response_note?: string | null;
}
export type Campaign = { id: string; title: string; date: string; description?: string }

function mapId<T extends Record<string, any>>(doc: any, extra?: Partial<T>): T {
  if (!doc) return doc
  const { _id, ...rest } = doc
  return { id: String(_id), ...(rest as any), ...(extra || {}) }
}

// Helper function to predict current price
async function predictCurrentPrice(itemData: any): Promise<number> {
  try {
    // If current_price is already provided, use it
    if (itemData.current_price && itemData.current_price > 0) {
      return Math.max(0, Number(itemData.current_price))
    }

    // Basic heuristic calculation for price prediction
    const {
      original_price = 50000,
      used_duration = 2,
      user_lifespan = 5,
      condition = 3,
      build_quality = 3,
      category = "Laptop"
    } = itemData

    // Basic depreciation calculation
    let depreciationRate = 0.15 // 15% per year base rate
    
    // Adjust depreciation based on category
    const categoryMultipliers: Record<string, number> = {
      'Laptop': 0.2,
      'Smartphone': 0.25,
      'Tablet': 0.18,
      'TV': 0.12,
      'Refrigerator': 0.08,
      'Washing Machine': 0.1,
      'Air Conditioner': 0.12,
      'Microwave': 0.15
    }
    
    depreciationRate = categoryMultipliers[category] || 0.15
    
    // Adjust for condition (1-5 scale)
    const conditionMultiplier = Math.max(0.1, condition / 5)
    
    // Adjust for build quality (1-5 scale)
    const qualityMultiplier = Math.max(0.8, 0.8 + (build_quality - 3) * 0.1)
    
    // Calculate depreciated value
    const yearsUsed = Math.min(used_duration, user_lifespan)
    const depreciatedValue = original_price * Math.pow(1 - depreciationRate, yearsUsed)
    
    // Apply condition and quality adjustments
    let currentPrice = depreciatedValue * conditionMultiplier * qualityMultiplier
    
    // Ensure minimum value (5% of original price)
    currentPrice = Math.max(currentPrice, original_price * 0.05)
    
    return Math.round(currentPrice)
  } catch (error) {
    console.error("Error predicting price:", error)
    return 0
  }
}

// Departments
export async function listDepartments(): Promise<Department[]> {
  try {
    const db = await getDb()
    const rows = await db.collection("departments").find({}).project({ _id: 1, name: 1, location: 1 }).toArray()
    return rows.map((d: any) => ({ id: typeof d._id === "number" ? d._id : Number(d._id), name: d.name, location: d.location }))
  } catch (error) {
    console.error("Error listing departments:", error)
    return []
  }
}

// Vendors
export async function listVendors(): Promise<Vendor[]> {
  try {
    const db = await getDb()
    const rows = await db.collection("vendors").find({}).project({ _id: 1, company_name: 1, contact_person: 1, email: 1, cpcb_registration_no: 1 }).toArray()
    return rows.map((v: any) => ({ id: String(v._id), company_name: v.company_name, contact_person: v.contact_person, email: v.email, cpcb_registration_no: v.cpcb_registration_no }))
  } catch (error) {
    console.error("Error listing vendors:", error)
    return []
  }
}

// Items
export async function createItem(input: { 
  name: string; 
  description?: string; 
  category: ItemCategory; 
  department_id: number; 
  reported_by: string; 
  origin: string; 
  disposition?: Disposition;
  brand?: string;
  build_quality?: number;
  user_lifespan?: number;
  usage_pattern?: "Light" | "Moderate" | "Heavy";
  expiry_years?: number;
  condition?: number;
  original_price?: number;
  used_duration?: number;
  current_price?: number;
  price_source?: string;
  predicted_price?: number;
}): Promise<EwasteItem> {
  const db = await getDb()
  const id = randomUUID()
  const now = new Date().toISOString()
  const qrUrl = `${input.origin}/item/${id}`
  
  // Predict current price if not provided or calculate based on source
  const predictedPrice = await predictCurrentPrice({
    original_price: input.original_price,
    used_duration: input.used_duration,
    user_lifespan: input.user_lifespan,
    condition: input.condition,
    build_quality: input.build_quality,
    category: input.category,
    current_price: input.current_price
  })
  
  // Determine final current price based on source
  let finalCurrentPrice = 0;
  if (input.price_source === "user_provided" && input.current_price) {
    finalCurrentPrice = Math.max(0, Number(input.current_price))
  } else if (input.price_source === "ml_predicted" && input.predicted_price) {
    finalCurrentPrice = Math.max(0, Number(input.predicted_price))
  }
  
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
    disposition: (input.disposition ?? null) as Disposition,
    qr_code_url: qrUrl,
    brand: input.brand || null,
    build_quality: input.build_quality ? Math.max(0, Number(input.build_quality)) : null,
    user_lifespan: input.user_lifespan ? Math.max(0, Number(input.user_lifespan)) : null,
    usage_pattern: input.usage_pattern || null,
    expiry_years: input.expiry_years ? Math.max(0, Number(input.expiry_years)) : null,
    condition: input.condition ? Math.max(0, Number(input.condition)) : null,
    original_price: input.original_price ? Math.max(0, Number(input.original_price)) : null,
    used_duration: input.used_duration ? Math.max(0, Number(input.used_duration)) : null,
    current_price: finalCurrentPrice,
    price_source: input.price_source || "ml_predicted",
    predicted_price: input.predicted_price ? Math.max(0, Number(input.predicted_price)) : predictedPrice,
  }
  await db.collection("items").insertOne(doc as any)
  return mapId<EwasteItem>(doc)
}

export async function listItems(filter?: { status?: ItemStatus; department_id?: number; category?: ItemCategory; disposition?: Disposition }): Promise<EwasteItem[]> {
  const db = await getDb()
  const q: any = {}
  if (filter?.status) q.status = filter.status
  if (filter?.department_id) q.department_id = filter.department_id
  if (filter?.category) q.category = filter.category
  if (typeof filter?.disposition !== "undefined") q.disposition = filter.disposition
  
  // Use projection to only fetch needed fields for better performance
  const rows = await db.collection("items")
    .find(q)
    .project({
      name: 1, description: 1, category: 1, status: 1, department_id: 1,
      reported_by: 1, reported_date: 1, disposed_date: 1, disposition: 1,
      qr_code_url: 1, brand: 1, build_quality: 1, user_lifespan: 1,
      usage_pattern: 1, expiry_years: 1, condition: 1, original_price: 1,
      used_duration: 1, current_price: 1
    })
    .sort({ reported_date: -1 })
    .toArray()
  return rows.map((d: any) => mapId<EwasteItem>(d))
}

export async function getItem(id: string): Promise<EwasteItem | null> {
  const db = await getDb()
  const d = await db.collection("items").findOne({ _id: id as any })
  return d ? mapId<EwasteItem>(d) : null
}

export async function updateItem(id: string, changes: Partial<Pick<EwasteItem, "status" | "description" | "category" | "disposed_date" | "disposition">>): Promise<EwasteItem | null> {
  const db = await getDb()
  await db.collection("items").updateOne({ _id: id as any }, { $set: changes })
  const d = await db.collection("items").findOne({ _id: id as any })
  return d ? mapId<EwasteItem>(d) : null
}

// Pickups
export async function schedulePickup(input: { admin_id: string; vendor_id: string; scheduled_date: string; item_ids: string[] }): Promise<Pickup> {
  const db = await getDb()
  const id = randomUUID()
  const pick: Pickup = { 
    id, 
    admin_id: input.admin_id, 
    vendor_id: input.vendor_id, 
    scheduled_date: input.scheduled_date, 
    status: "Scheduled",
    vendor_response: null,
    vendor_response_date: null,
    vendor_response_note: null
  }
  await db.collection("pickups").insertOne({ _id: id as any, ...pick })
  if (input.item_ids?.length) {
    const ops = input.item_ids.map((item_id) => ({ _id: randomUUID() as any, pickup_id: id, item_id }))
    if (ops.length) await db.collection("pickup_items").insertMany(ops as any)
    await db.collection("items").updateMany({ _id: { $in: input.item_ids as any } }, { $set: { status: "Scheduled" } })
  }
  return pick
}

export async function listVendorPickups(vendor_id: string): Promise<Array<{ id: string; scheduled_date: string; status: string; vendor_response?: string | null; vendor_response_note?: string | null; contact_emails: string[]; items: Array<{ id: string; name: string; category: ItemCategory; current_price?: number; original_price?: number; brand?: string; condition?: number; build_quality?: number; usage_pattern?: string; used_duration?: number; user_lifespan?: number; reported_by: string; reporter_email: string; }> }>> {
  console.log("🔍 listVendorPickups called with vendor_id:", vendor_id)
  const db = await getDb()
  const picks = await db.collection("pickups").find({ vendor_id })
    .project({ _id: 1, vendor_id: 1, scheduled_date: 1, status: 1, notes: 1 })
    .sort({ scheduled_date: -1 })
    .toArray()
  const ids = picks.map((p: any) => String(p._id))
  const linkRows = ids.length ? await db.collection("pickup_items")
    .find({ pickup_id: { $in: ids } })
    .project({ pickup_id: 1, item_id: 1, _id: 1 })
    .toArray() : []
  const itemIds = linkRows.map((r: any) => r.item_id)
  const items = itemIds.length ? await db.collection("items").find({ _id: { $in: itemIds } }).project({ 
    _id: 1, 
    name: 1, 
    category: 1, 
    current_price: 1, 
    original_price: 1, 
    brand: 1, 
    condition: 1, 
    build_quality: 1, 
    usage_pattern: 1, 
    used_duration: 1, 
    user_lifespan: 1,
    reported_by: 1
  }).toArray() : []
  
  // DEBUG: Log sample item data
  if (items.length > 0) {
    console.log("Sample item data:", {
      id: items[0]._id,
      name: items[0].name,
      reported_by: items[0].reported_by,
      reported_by_type: typeof items[0].reported_by
    })
  }
  
  // Get unique reported_by user IDs to fetch their email addresses
  const reporterIds = [...new Set(items.map((item: any) => item.reported_by))]
  console.log("Reporter IDs to lookup:", reporterIds)
  
  // Try to find users - handle both string and ObjectId formats
  let reporters: any[] = []
  if (reporterIds.length > 0) {
    try {
      // Try multiple approaches to find the users
      
      // Approach 1: Try as ObjectIds
      const objectIds = reporterIds.map(id => {
        try {
          return new ObjectId(String(id))
        } catch {
          return null
        }
      }).filter(Boolean) as ObjectId[]
      
      if (objectIds.length > 0) {
        reporters = await db.collection("users").find({ 
          _id: { $in: objectIds } 
        }).project({ _id: 1, email: 1, name: 1 }).toArray()
        console.log("Found reporters by ObjectId:", reporters.length)
      }
      
      // Approach 2: If no results, try as strings
      if (reporters.length === 0) {
        reporters = await db.collection("users").find({ 
          _id: { $in: reporterIds as any } 
        }).project({ _id: 1, email: 1, name: 1 }).toArray()
        console.log("Found reporters by string ID:", reporters.length)
      }
      
      // Approach 3: If still no results, try looking up by email field if reported_by contains emails
      if (reporters.length === 0) {
        const emailLookingIds = reporterIds.filter(id => String(id).includes('@'))
        if (emailLookingIds.length > 0) {
          reporters = await db.collection("users").find({ 
            email: { $in: emailLookingIds } 
          }).project({ _id: 1, email: 1, name: 1 }).toArray()
          console.log("Found reporters by email:", reporters.length)
        }
      }
      
      // Approach 4: If still no results, get all users and log them for debugging
      if (reporters.length === 0) {
        const allUsers = await db.collection("users").find({}).limit(5).project({ _id: 1, email: 1, name: 1 }).toArray()
        console.log("Sample users in database:", allUsers.map(u => ({ id: String(u._id), email: u.email, name: u.name })))
        console.log("Trying to match these reported_by IDs:", reporterIds)
        
        // Try a broad match to see if any user ID contains part of the reported_by
        for (const reporterId of reporterIds) {
          const userMatch = allUsers.find(u => String(u._id).includes(String(reporterId)) || String(reporterId).includes(String(u._id)))
          if (userMatch) {
            reporters.push(userMatch)
            console.log("Found partial match:", { reporterId, userMatch: { id: String(userMatch._id), email: userMatch.email } })
          }
        }
      }
      
    } catch (error) {
      console.log("Error fetching reporters:", error)
    }
  }
  
  console.log("Found reporters:", reporters.map(r => ({ id: r._id, email: r.email })))
  
  const reporterEmailMap = new Map(reporters.map((user: any) => [String(user._id), user.email]))
  console.log("Reporter email mapping:", Array.from(reporterEmailMap.entries()))
  
  const itemMap = new Map(items.map((it: any) => [String(it._id), { 
    id: String(it._id), 
    name: it.name, 
    category: it.category,
    current_price: it.current_price,
    original_price: it.original_price,
    brand: it.brand,
    condition: it.condition,
    build_quality: it.build_quality,
    usage_pattern: it.usage_pattern,
    used_duration: it.used_duration,
    user_lifespan: it.user_lifespan,
    reported_by: String(it.reported_by),
    reporter_email: reporterEmailMap.get(String(it.reported_by)) || "Unknown"
  }]))
  
  return picks.map((p: any) => {
    const pickupItems = linkRows.filter((r: any) => String(r.pickup_id) === String(p._id)).map((r: any) => itemMap.get(String(r.item_id))).filter(Boolean) as any
    const contactEmails = [...new Set(pickupItems.map((item: any) => reporterEmailMap.get(item.reported_by)).filter(Boolean))] as string[]
    
    return {
      id: String(p._id),
      scheduled_date: p.scheduled_date,
      status: p.status,
      vendor_response: p.vendor_response,
      vendor_response_note: p.vendor_response_note,
      contact_emails: contactEmails,
      items: pickupItems,
    }
  })
}

export async function updateVendorResponse(pickup_id: string, vendor_id: string, response: "Accepted" | "Rejected", note?: string): Promise<boolean> {
  const db = await getDb()
  const now = new Date().toISOString()
  const status = response === "Accepted" ? "Vendor_Accepted" : "Vendor_Rejected"
  
  // Update the pickup record
  const result = await db.collection("pickups").updateOne(
    { _id: pickup_id as any, vendor_id },
    { 
      $set: { 
        vendor_response: response,
        vendor_response_date: now,
        vendor_response_note: note || null,
        status: status
      } 
    }
  )
  
  // If vendor rejected the pickup, reset all associated items back to "Reported" status
  if (response === "Rejected" && result.modifiedCount > 0) {
    try {
      // Get all item IDs associated with this pickup
      const pickupItems = await db.collection("pickup_items").find({ pickup_id }).toArray()
      const itemIds = pickupItems.map((pi: any) => pi.item_id)
      
      if (itemIds.length > 0) {
        // Reset items back to "Reported" status so they can be rescheduled
        await db.collection("items").updateMany(
          { _id: { $in: itemIds as any } }, 
          { $set: { status: "Reported" } }
        )
      }
    } catch (error) {
      console.error("Error resetting item status after rejection:", error)
    }
  }
  
  return result.modifiedCount > 0
}

export async function listAdminPickups(): Promise<Array<{ 
  id: string; 
  scheduled_date: string; 
  status: string; 
  vendor_response?: string | null; 
  vendor_response_date?: string | null;
  vendor_response_note?: string | null;
  vendor: { name: string; company: string; email: string; cpcb_registration_no: string };
  items: Array<{ id: string; name: string; category: ItemCategory }> 
}>> {
  const db = await getDb()
  const picks = await db.collection("pickups").find({})
    .project({ _id: 1, vendor_id: 1, scheduled_date: 1, status: 1, notes: 1 })
    .sort({ scheduled_date: -1 })
    .toArray()
  
  // Get vendor information - try both string and ObjectId conversion for vendor_id
  const vendorIds = [...new Set(picks.map((p: any) => p.vendor_id))]
  let vendors: any[] = []
  
  if (vendorIds.length > 0) {
    // Try ObjectId lookup first
    try {
      const { ObjectId } = await import('mongodb')
      const objectIds = vendorIds.map(id => {
        try {
          return new ObjectId(String(id))
        } catch {
          return id
        }
      })
      
      vendors = await db.collection("vendors").find({ 
        _id: { $in: objectIds as any } 
      }).project({ _id: 1, contact_person: 1, company_name: 1, email: 1, cpcb_registration_no: 1 }).toArray()
      
    } catch (error) {
      console.warn("ObjectId lookup failed, trying string lookup:", error)
      // Fallback to string lookup
      vendors = await db.collection("vendors").find({ 
        _id: { $in: vendorIds as any } 
      }).project({ _id: 1, contact_person: 1, company_name: 1, email: 1, cpcb_registration_no: 1 }).toArray()
    }
  }
  
  const vendorMap = new Map(vendors.map((v: any) => [String(v._id), { 
    name: v.contact_person || "Unknown", 
    company: v.company_name || "Unknown", 
    email: v.email || "Unknown",
    cpcb_registration_no: v.cpcb_registration_no || "Not Available"
  }]))
  
  // Get pickup items
  const pickupIds = picks.map((p: any) => String(p._id))
  const linkRows = pickupIds.length ? await db.collection("pickup_items")
    .find({ pickup_id: { $in: pickupIds } })
    .project({ pickup_id: 1, item_id: 1, _id: 1 })
    .toArray() : []
  const itemIds = linkRows.map((r: any) => r.item_id)
  const items = itemIds.length ? await db.collection("items").find({ _id: { $in: itemIds } }).project({ _id: 1, name: 1, category: 1 }).toArray() : []
  const itemMap = new Map(items.map((it: any) => [String(it._id), { 
    id: String(it._id), 
    name: it.name, 
    category: it.category 
  }]))
  
  return picks.map((p: any) => ({
    id: String(p._id),
    scheduled_date: p.scheduled_date,
    status: p.status,
    vendor_response: p.vendor_response,
    vendor_response_date: p.vendor_response_date,
    vendor_response_note: p.vendor_response_note,
    vendor: vendorMap.get(String(p.vendor_id)) || { name: "Unknown", company: "Unknown", email: "Unknown", cpcb_registration_no: "Not Available" },
    items: linkRows.filter((r: any) => String(r.pickup_id) === String(p._id)).map((r: any) => itemMap.get(String(r.item_id))).filter(Boolean) as any,
  }))
}

// Campaigns
export async function listCampaigns(): Promise<Campaign[]> {
  try {
    const db = await getDb()
    const rows = await db.collection("campaigns").find({})
      .project({ _id: 1, title: 1, description: 1, date: 1, status: 1, department_id: 1 })
      .sort({ date: -1 })
      .toArray()
    return rows.map((d: any) => mapId<Campaign>(d))
  } catch (error) {
    console.error("Error listing campaigns:", error)
    return []
  }
}

export async function createCampaign(input: { title: string; date: string; description?: string }): Promise<Campaign> {
  try {
    const db = await getDb()
    const id = randomUUID()
    const doc = { _id: id, title: input.title, date: input.date, description: input.description || null }
    await db.collection("campaigns").insertOne(doc as any)
    return mapId<Campaign>(doc)
  } catch (error) {
    console.error("Error creating campaign:", error)
    throw error
  }
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
  const refurbished = items.filter((i) => i.status === "Refurbished").length
  const safelyDisposed = items.filter((i) => i.status === "Safely Disposed").length
  const disposed = recycled + refurbished + safelyDisposed
  const total = items.length
  const rate = total ? Math.round(((disposed / total) * 100 + Number.EPSILON) * 100) / 100 : 0
  return { rate, recycled, disposed }
}

// Auction Functions
export async function createAuction(input: {
  item_id: string
  created_by: string
  starting_price: number
  auction_duration_hours: number
}): Promise<Auction> {
  const db = await getDb()
  const now = new Date()
  const endTime = new Date(now.getTime() + (input.auction_duration_hours * 60 * 60 * 1000))
  
  // Get next auction ID
  const lastAuction = await db.collection("auctions").findOne({}, { sort: { id: -1 } })
  const nextId = lastAuction ? (lastAuction.id + 1) : 1
  
  const auction = {
    id: nextId,
    item_id: input.item_id,
    created_by: input.created_by,
    starting_price: input.starting_price,
    current_highest_bid: 0,
    auction_duration_hours: input.auction_duration_hours,
    start_time: now.toISOString(),
    end_time: endTime.toISOString(),
    status: 'active' as AuctionStatus,
    winning_vendor_id: null,
    winning_bid: null,
    created_at: now.toISOString(),
    updated_at: now.toISOString()
  }

  await db.collection("auctions").insertOne(auction)
  
  // Log auction creation event
  await db.collection("auction_events").insertOne({
    auction_id: nextId,
    event_type: 'auction_started' as AuctionEventType,
    user_id: input.created_by,
    details: { starting_price: input.starting_price, duration_hours: input.auction_duration_hours },
    created_at: now.toISOString()
  })

  return auction
}

export async function placeBid(input: {
  auction_id: number
  vendor_id: string
  bid_amount: number
}): Promise<{ success: boolean; message: string; bid?: Bid }> {
  const db = await getDb()
  const now = new Date()

  // Get auction details
  const auction = await db.collection("auctions").findOne({ id: input.auction_id })
  if (!auction) {
    return { success: false, message: "Auction not found" }
  }

  if (auction.status !== 'active') {
    return { success: false, message: "Auction is not active" }
  }

  if (new Date(auction.end_time) < now) {
    return { success: false, message: "Auction has ended" }
  }

  if (input.bid_amount <= auction.current_highest_bid) {
    return { success: false, message: `Bid must be higher than current highest bid of ₹${auction.current_highest_bid}` }
  }

  const minimumIncrement = 50
  if (input.bid_amount < auction.current_highest_bid + minimumIncrement) {
    return { success: false, message: `Minimum bid increment is ₹${minimumIncrement}` }
  }

  // Mark previous bids as outbid
  await db.collection("bids").updateMany(
    { auction_id: input.auction_id, status: 'winning' },
    { $set: { status: 'outbid' } }
  )

  // Create new bid
  const bid = {
    auction_id: input.auction_id,
    vendor_id: input.vendor_id,
    bid_amount: input.bid_amount,
    bid_time: now.toISOString(),
    status: 'winning' as BidStatus
  }

  const bidResult = await db.collection("bids").insertOne(bid)
  
  // Update auction with new highest bid
  await db.collection("auctions").updateOne(
    { id: input.auction_id },
    { 
      $set: { 
        current_highest_bid: input.bid_amount,
        updated_at: now.toISOString()
      }
    }
  )

  // Log bid event
  await db.collection("auction_events").insertOne({
    auction_id: input.auction_id,
    event_type: 'new_bid' as AuctionEventType,
    user_id: input.vendor_id,
    details: { bid_amount: input.bid_amount },
    created_at: now.toISOString()
  })

  return { 
    success: true, 
    message: "Bid placed successfully",
    bid: { id: Number(bidResult.insertedId), ...bid }
  }
}

export async function getActiveAuctions(): Promise<Auction[]> {
  const db = await getDb()
  const auctions = await db.collection("auctions")
    .find({ status: 'active', end_time: { $gt: new Date().toISOString() } })
    .sort({ created_at: -1 })
    .toArray()

  return auctions.map(a => ({ 
    id: a.id || Number(a._id), 
    item_id: a.item_id,
    created_by: a.created_by,
    starting_price: a.starting_price,
    current_highest_bid: a.current_highest_bid,
    auction_duration_hours: a.auction_duration_hours,
    start_time: a.start_time,
    end_time: a.end_time,
    status: a.status,
    winning_vendor_id: a.winning_vendor_id,
    winning_bid: a.winning_bid,
    created_at: a.created_at,
    updated_at: a.updated_at
  })) as Auction[]
}

export async function getUserAuctions(userId: string): Promise<Auction[]> {
  const db = await getDb()
  const auctions = await db.collection("auctions")
    .find({ created_by: userId })
    .sort({ created_at: -1 })
    .toArray()

  return auctions.map(a => ({ 
    id: a.id || Number(a._id), 
    item_id: a.item_id,
    created_by: a.created_by,
    starting_price: a.starting_price,
    current_highest_bid: a.current_highest_bid,
    auction_duration_hours: a.auction_duration_hours,
    start_time: a.start_time,
    end_time: a.end_time,
    status: a.status,
    winning_vendor_id: a.winning_vendor_id,
    winning_bid: a.winning_bid,
    created_at: a.created_at,
    updated_at: a.updated_at
  })) as Auction[]
}

export async function getAuctionById(auctionId: number): Promise<Auction | null> {
  const db = await getDb()
  const auction = await db.collection("auctions").findOne({ id: auctionId })
  
  if (!auction) return null
  
  return {
    id: auction.id || Number(auction._id),
    item_id: auction.item_id,
    created_by: auction.created_by,
    starting_price: auction.starting_price,
    current_highest_bid: auction.current_highest_bid,
    auction_duration_hours: auction.auction_duration_hours,
    start_time: auction.start_time,
    end_time: auction.end_time,
    status: auction.status,
    winning_vendor_id: auction.winning_vendor_id,
    winning_bid: auction.winning_bid,
    created_at: auction.created_at,
    updated_at: auction.updated_at
  } as Auction
}

export async function getAuctionBids(auctionId: number): Promise<Bid[]> {
  const db = await getDb()
  const bids = await db.collection("bids")
    .find({ auction_id: auctionId })
    .sort({ bid_amount: -1, bid_time: 1 })
    .toArray()

  return bids.map(b => ({ 
    id: Number(b._id), 
    auction_id: b.auction_id,
    vendor_id: b.vendor_id,
    bid_amount: b.bid_amount,
    bid_time: b.bid_time,
    status: b.status
  })) as Bid[]
}

export async function processExpiredAuctions(): Promise<void> {
  const db = await getDb()
  const now = new Date()
  
  const expiredAuctions = await db.collection("auctions")
    .find({ 
      status: 'active', 
      end_time: { $lt: now.toISOString() }
    })
    .toArray()

  for (const auction of expiredAuctions) {
    const winningBid = await db.collection("bids")
      .findOne(
        { auction_id: auction.id, status: 'winning' },
        { sort: { bid_amount: -1, bid_time: 1 } }
      )

    if (winningBid) {
      // Update auction with winner
      await db.collection("auctions").updateOne(
        { id: auction.id },
        {
          $set: {
            status: 'completed',
            winning_vendor_id: winningBid.vendor_id,
            winning_bid: winningBid.bid_amount,
            updated_at: now.toISOString()
          }
        }
      )

      // Log auction end event
      await db.collection("auction_events").insertOne({
        auction_id: auction.id,
        event_type: 'winner_selected' as AuctionEventType,
        user_id: winningBid.vendor_id,
        details: { winning_bid: winningBid.bid_amount },
        created_at: now.toISOString()
      })

      // Update item status
      await db.collection("items").updateOne(
        { _id: auction.item_id },
        { $set: { status: 'Awaiting Pickup', updated_at: now.toISOString() } }
      )
    } else {
      // No bids, mark as completed without winner
      await db.collection("auctions").updateOne(
        { id: auction.id },
        {
          $set: {
            status: 'completed',
            updated_at: now.toISOString()
          }
        }
      )
    }
  }
}

