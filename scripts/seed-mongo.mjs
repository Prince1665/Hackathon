import { readFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import path from "node:path"
import bcrypt from "bcryptjs"
import { MongoClient } from "mongodb"

async function loadEnv() {
  // Load .env.local (Next.js style) for Node script
  const envPath = path.resolve(process.cwd(), ".env.local")
  if (!existsSync(envPath)) return
  const raw = await readFile(envPath, "utf8")
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

async function main() {
  await loadEnv()

  const uri = process.env.MONGODB_URI
  const dbName = process.env.MONGODB_DB || "smart-ewaste"

  if (!uri) {
    console.error("MONGODB_URI is not set. Add it to .env.local and try again.")
    process.exit(1)
  }

  const client = new MongoClient(uri)
  try {
    console.log("Connecting to MongoDB ...")
    await client.connect()
    const db = client.db(dbName)
    console.log(`Connected. DB=\"${dbName}\"`)

    // Ensure unique index on email
    try {
      await db.collection("users").createIndex({ email: 1 }, { unique: true })
    } catch {}

    const users = [
      { name: "Admin User", email: "admin@example.com", password: "admin123", role: "admin", department_id: 0 },
      { name: "Vendor One", email: "vendor1@example.com", password: "vendor123", role: "vendor", department_id: 0 },
      { name: "Student One", email: "student1@example.com", password: "student123", role: "student", department_id: 0 },
      { name: "Faculty One", email: "faculty1@example.com", password: "faculty123", role: "coordinator", department_id: 0 },
    ]

    let created = 0
    let skipped = 0

    for (const u of users) {
      const exists = await db.collection("users").findOne({ email: u.email })
      if (exists) {
        console.log(`Skipping existing: ${u.email}`)
        skipped++
        continue
      }
      const passwordHash = await bcrypt.hash(u.password, 12)
      await db.collection("users").insertOne({
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role,
        department_id: u.department_id,
      })
      console.log(`Created: ${u.email}`)
      created++
    }

    console.log("Seed complete.", { created, skipped })
    console.log("You can now login with:")
    console.log(" - Admin:    admin@example.com / admin123")
    console.log(" - Vendor:   vendor1@example.com / vendor123")
    console.log(" - Student:  student1@example.com / student123")
    console.log(" - Faculty:  faculty1@example.com / faculty123")
  } catch (err) {
    console.error(err)
    process.exitCode = 1
  } finally {
    try { await client.close() } catch {}
  }
}

main()
