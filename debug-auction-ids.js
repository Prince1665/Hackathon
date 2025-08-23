const { MongoClient } = require('mongodb');

async function debugAuctionIds() {
  try {
    // Use the same connection as the app
    const uri = 'mongodb+srv://princesengupta166:mapraftel166@cluster0.eforz7s.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
    const dbName = 'smart-ewaste'

    console.log('Starting debug...')
    
    console.log('🔗 Connecting to MongoDB...')
    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db(dbName)
    
    console.log('🔍 Fetching all auctions...')
    
    // Get all auctions
    const auctions = await db.collection('auctions').find({}).toArray()
    
    console.log(`📊 Found ${auctions.length} auctions:`)
    
    auctions.forEach((auction, index) => {
      console.log(`${index + 1}. ID: "${auction._id}" (type: ${typeof auction._id})`)
      console.log(`   Status: ${auction.status}`)
      console.log(`   Item ID: ${auction.item_id}`)
      console.log(`   Created: ${auction.created_at}`)
      console.log(`   End Time: ${auction.end_time}`)
      console.log(`   ---`)
    })
    
    // Check for any auctions with simple numeric IDs
    const numericIdAuctions = auctions.filter(a => /^\d+$/.test(String(a._id)))
    if (numericIdAuctions.length > 0) {
      console.log(`⚠️  Found ${numericIdAuctions.length} auctions with numeric IDs:`)
      numericIdAuctions.forEach(a => {
        console.log(`   - ID: "${a._id}" Status: ${a.status}`)
      })
    }
    
    // Check for active auctions specifically
    const activeAuctions = auctions.filter(a => a.status && a.status.toLowerCase() === 'active')
    console.log(`\n🟢 Active auctions: ${activeAuctions.length}`)
    activeAuctions.forEach(a => {
      console.log(`   - ID: "${a._id}" End: ${a.end_time}`)
    })
    
    await client.close()
    console.log('\n✅ Debug complete')
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

debugAuctionIds().catch(console.error)
