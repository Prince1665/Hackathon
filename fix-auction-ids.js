const { MongoClient, ObjectId } = require('mongodb');
const { randomUUID } = require('crypto');

async function fixAuctionIds() {
  try {
    const uri = 'mongodb+srv://princesengupta166:mapraftel166@cluster0.eforz7s.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
    const dbName = 'smart-ewaste'
    
    console.log('🔗 Connecting to MongoDB...')
    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db(dbName)
    
    console.log('🔍 Finding auctions with ObjectId format...')
    
    // Find all auctions
    const auctions = await db.collection('auctions').find({}).toArray()
    console.log(`📊 Found ${auctions.length} total auctions`)
    
    // Find auctions with ObjectId format (24 character hex strings)
    const objectIdAuctions = auctions.filter(a => 
      typeof a._id === 'object' || 
      (typeof a._id === 'string' && a._id.length === 24 && /^[0-9a-fA-F]{24}$/.test(a._id))
    )
    
    console.log(`🔧 Found ${objectIdAuctions.length} auctions with ObjectId format that need fixing`)
    
    if (objectIdAuctions.length === 0) {
      console.log('✅ No auctions need ID format fixing')
      await client.close()
      return
    }
    
    // Process each auction that needs fixing
    for (const auction of objectIdAuctions) {
      const oldId = auction._id
      const newId = randomUUID()
      
      console.log(`🔄 Converting auction ID: ${oldId} → ${newId}`)
      
      // Create new auction document with UUID
      const newAuction = { ...auction, _id: newId }
      delete newAuction._id // Remove old _id
      
      // Insert new auction with UUID
      await db.collection('auctions').insertOne({ _id: newId, ...newAuction })
      
      // Update all bids that reference this auction
      const bidUpdateResult = await db.collection('bids').updateMany(
        { auction_id: String(oldId) },
        { $set: { auction_id: newId } }
      )
      console.log(`  📝 Updated ${bidUpdateResult.modifiedCount} bids to reference new auction ID`)
      
      // Remove old auction
      await db.collection('auctions').deleteOne({ _id: oldId })
      
      console.log(`  ✅ Successfully converted auction ${oldId} to ${newId}`)
    }
    
    console.log(`\n🎉 Successfully converted ${objectIdAuctions.length} auctions to UUID format`)
    
    // Verify the results
    const updatedAuctions = await db.collection('auctions').find({}).toArray()
    console.log('\n📋 Final auction ID formats:')
    updatedAuctions.forEach(a => {
      const idType = typeof a._id === 'string' && a._id.includes('-') ? 'UUID' : 'Other'
      console.log(`  - ${a._id} (${idType})`)
    })
    
    await client.close()
    console.log('\n✅ Auction ID normalization complete')
    
  } catch (error) {
    console.error('❌ Error fixing auction IDs:', error)
  }
}

fixAuctionIds()
