import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB || "smart-ewaste"

if (!uri) {
  // Not configured; consumers should guard calls behind env check
  // We still export a stub for type convenience
}

// Cache the client across hot-reloads in dev and across edge invocations
const globalForMongo = global as unknown as { _mongoClient?: MongoClient }

export const mongoClient: MongoClient | undefined = (() => {
  if (!uri) return undefined
  if (!globalForMongo._mongoClient) {
    globalForMongo._mongoClient = new MongoClient(uri)
  }
  return globalForMongo._mongoClient
})()

export async function getDb() {
  if (!mongoClient) throw new Error("MongoDB not configured: set MONGODB_URI")
  if (!mongoClient.topology) {
    await mongoClient.connect()
  }
  return mongoClient.db(dbName)
}

