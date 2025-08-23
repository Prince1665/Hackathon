import { randomUUID } from "crypto"
import { getDb } from "./mongo"
import { ObjectId } from "mongodb"

export type Role = "student" | "coordinator" | "admin" | "vendor"
export type ItemCategory = "Tablet" | "Microwave" | "Air Conditioner" | "TV" | "Washing Machine" | "Laptop" | "Smartphone" | "Refrigerator"
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
  brand?: string
  build_quality?: number
  user_lifespan?: number
  usage_pattern?: "Light" | "Moderate" | "Heavy"
  expiry_years?: number
  condition?: number
  original_price?: number
  used_duration?: number
  current_price?: number
  predicted_price?: number
  price_confirmed?: boolean
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

export type Auction = {
  id: string
  item_id: string
  created_by: string // User who created the auction
  starting_price: number // Minimum bid amount (user price + 50)
  current_highest_bid?: number
  current_highest_bidder?: string // Vendor ID
  status: "active" | "completed" | "cancelled"
  duration_hours: number // Duration in hours
  start_time: string // ISO date string
  end_time: string // ISO date string
  created_at: string
}

export type Bid = {
  id: string
  auction_id: string
  vendor_id: string
  amount: number
  bid_time: string
  status: "active" | "outbid" | "winning"
}

export type Campaign = { id: string; title: string; date: string; description?: string }

// Helper function for case-insensitive status comparison
export function isStatusEqual(status1: string | undefined, status2: string): boolean {
  return status1?.toLowerCase().trim() === status2.toLowerCase().trim()
}

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

export async function getVendorById(vendorId: string): Promise<Vendor | null> {
  const db = await getDb()
  const { ObjectId } = require("mongodb")

  try {
    // Try as ObjectId first (most common)
    let query: any = {}
    try {
      query = { _id: new ObjectId(vendorId) }
    } catch (e) {
      // vendorId is not a valid ObjectId hex string; fall back to string match
      query = { _id: vendorId }
    }

    // Also allow matching a stored string `id` field as a fallback
    const vendor = await db.collection("vendors").findOne(
      { $or: [query, { id: vendorId }] },
      { projection: { _id: 1, company_name: 1, contact_person: 1, email: 1, cpcb_registration_no: 1 } }
    )

    if (!vendor) {
      return null
    }

    return {
      id: String(vendor._id || vendor.id),
      company_name: vendor.company_name,
      contact_person: vendor.contact_person,
      email: vendor.email,
      cpcb_registration_no: vendor.cpcb_registration_no
    }
  } catch (error) {
    console.error("Error fetching vendor by ID:", error)
    return null
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
  predicted_price?: number;
  price_confirmed?: boolean;
}): Promise<EwasteItem> {
  const db = await getDb()
  const id = randomUUID()
  const now = new Date().toISOString()
  const qrUrl = `${input.origin}/item/${id}`
  
  // Predict current price if not provided
  const predictedPrice = await predictCurrentPrice({
    original_price: input.original_price,
    used_duration: input.used_duration,
    user_lifespan: input.user_lifespan,
    condition: input.condition,
    build_quality: input.build_quality,
    category: input.category,
    current_price: input.current_price
  })
  
  // Use provided current_price (user-entered price) or fallback to predicted price
  const finalCurrentPrice = input.current_price !== undefined && input.current_price !== null 
    ? Math.max(0, Number(input.current_price)) 
    : predictedPrice

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
    current_price: finalCurrentPrice, // User-entered price
    predicted_price: input.predicted_price ? Math.max(0, Number(input.predicted_price)) : predictedPrice, // ML prediction for reference
    price_confirmed: input.price_confirmed || false,
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
  const rows = await db.collection("items").find(q).sort({ reported_date: -1 }).toArray()
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
  const picks = await db.collection("pickups").find({ vendor_id }).sort({ scheduled_date: -1 }).toArray()
  const ids = picks.map((p: any) => String(p._id))
  const linkRows = ids.length ? await db.collection("pickup_items").find({ pickup_id: { $in: ids } }).toArray() : []
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

// Auction Management Functions
export async function createAuction(input: {
  item_id: string;
  created_by: string;
  starting_price: number;
  duration_hours: number;
}): Promise<Auction> {
  const db = await getDb()
  const id = randomUUID()
  const created_at = new Date().toISOString()
  const start_time = created_at
  const end_time = new Date(Date.now() + input.duration_hours * 60 * 60 * 1000).toISOString()
  
  const auction: Auction = {
    id,
    item_id: input.item_id,
    created_by: input.created_by,
    starting_price: input.starting_price,
    current_highest_bid: undefined,
    current_highest_bidder: undefined,
    duration_hours: input.duration_hours,
    start_time,
    end_time,
    created_at,
    status: "active"
  }
  
  await db.collection("auctions").insertOne({ _id: id as any, ...auction })
  return auction
}

export async function listAuctions(filter?: { 
  status?: "active" | "completed" | "cancelled"; 
  created_by?: string;
  item_id?: string;
}): Promise<Auction[]> {
  const db = await getDb()
  const query: any = {}
  
  // Case-insensitive status filtering
  if (filter?.status) {
    query.status = { $regex: new RegExp(`^${filter.status}$`, 'i') }
  }
  if (filter?.created_by) query.created_by = filter.created_by
  if (filter?.item_id) query.item_id = filter.item_id
  
  const auctions = await db.collection("auctions").find(query).sort({ created_at: -1 }).toArray()
  return auctions.map(a => {
    const { _id, ...rest } = a
    return { id: String(_id), ...rest } as Auction
  })
}

export async function getAuction(id: string): Promise<Auction | null> {
  const db = await getDb()
  const auction = await db.collection("auctions").findOne({ _id: id as any })
  if (!auction) return null
  
  const { _id, ...rest } = auction
  return { id: String(_id), ...rest } as Auction
}

export async function placeBid(input: {
  auction_id: string;
  vendor_id: string;
  amount: number;
}): Promise<Bid> {
  const db = await getDb()
  const id = randomUUID()
  
  // Check if auction exists and is active
  const auction = await getAuction(input.auction_id)
  if (!auction || !isStatusEqual(auction.status, "active")) {
    throw new Error("Auction is not active")
  }
  
  // Check if auction has expired
  if (new Date() > new Date(auction.end_time)) {
    throw new Error("Auction has expired")
  }
  
  // Check minimum bid requirement (starting price + 50Rs or current highest + 50Rs)
  const minBid = auction.current_highest_bid 
    ? auction.current_highest_bid + 50 
    : auction.starting_price + 50
    
  if (input.amount < minBid) {
    throw new Error(`Bid must be at least ₹${minBid}`)
  }
  
  const bid_time = new Date().toISOString()
  
  const bid: Bid = {
    id,
    auction_id: input.auction_id,
    vendor_id: input.vendor_id,
    amount: input.amount,
    bid_time,
    status: "winning"
  }
  
  // Mark previous highest bid as outbid
  if (auction.current_highest_bidder) {
    await db.collection("bids").updateMany(
      { auction_id: input.auction_id, vendor_id: auction.current_highest_bidder },
      { $set: { status: "outbid" } }
    )
  }
  
  // Insert new bid and update auction's current highest bid
  await db.collection("bids").insertOne({ _id: id as any, ...bid })
  await db.collection("auctions").updateOne(
    { _id: input.auction_id as any },
    { 
      $set: { 
        current_highest_bid: input.amount,
        current_highest_bidder: input.vendor_id
      } 
    }
  )
  
  return bid
}

export async function listBids(auction_id: string): Promise<Bid[]> {
  const db = await getDb()
  const bids = await db.collection("bids").find({ auction_id }).sort({ amount: -1, bid_time: 1 }).toArray()
  return bids.map(b => {
    const { _id, ...rest } = b
    return { id: String(_id), ...rest } as Bid
  })
}

export async function completeAuction(auction_id: string): Promise<boolean> {
  const db = await getDb()
  
  // Get highest bid
  const bids = await listBids(auction_id)
  const winningBid = bids.length > 0 ? bids[0] : null
  
  if (winningBid) {
    // Mark winning bid (should already be marked as winning)
    await db.collection("bids").updateOne(
      { _id: winningBid.id as any },
      { $set: { status: "winning" } }
    )
    
    // Mark other bids as outbid
    await db.collection("bids").updateMany(
      { auction_id, _id: { $ne: winningBid.id as any } },
      { $set: { status: "outbid" } }
    )
  }
  
  // Mark auction as completed
  await db.collection("auctions").updateOne(
    { _id: auction_id as any },
    { $set: { status: "completed" } }
  )
  
  return true
}

export async function checkExpiredAuctions(): Promise<void> {
  const db = await getDb()
  const now = new Date().toISOString()
  
  // Find active auctions that have expired (case-insensitive)
  const expiredAuctions = await db.collection("auctions").find({
    status: { $regex: /^active$/i },
    end_time: { $lt: now }
  }).toArray()
  
  console.log(`🔍 checkExpiredAuctions: found ${expiredAuctions.length} expired auctions`)
  
  // Complete each expired auction
  for (const auction of expiredAuctions) {
    await completeAuction(String(auction._id))
  }
  
  // Also check enhanced auctions
  try {
    const { checkExpiredEnhancedAuctions } = await import('./auction-proxy')
    await checkExpiredEnhancedAuctions()
  } catch (error) {
    console.error("Error checking enhanced auctions:", error)
  }
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
  const picks = await db.collection("pickups").find({}).sort({ scheduled_date: -1 }).toArray()
  
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
  const linkRows = pickupIds.length ? await db.collection("pickup_items").find({ pickup_id: { $in: pickupIds } }).toArray() : []
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
  const db = await getDb()
  const rows = await db.collection("campaigns").find({}).sort({ date: -1 }).toArray()
  return rows.map((d: any) => mapId<Campaign>(d))
}

export async function createCampaign(input: { title: string; date: string; description?: string }): Promise<Campaign> {
  const db = await getDb()
  const id = randomUUID()
  const doc = { _id: id, title: input.title, date: input.date, description: input.description || null }
  await db.collection("campaigns").insertOne(doc as any)
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
  const refurbished = items.filter((i) => i.status === "Refurbished").length
  const safelyDisposed = items.filter((i) => i.status === "Safely Disposed").length
  const disposed = recycled + refurbished + safelyDisposed
  const total = items.length
  const rate = total ? Math.round(((disposed / total) * 100 + Number.EPSILON) * 100) / 100 : 0
  return { rate, recycled, disposed }
}

