const { MongoClient } = require('mongodb');

async function testVendorBidding() {
  try {
    const uri = 'mongodb+srv://princesengupta166:mapraftel166@cluster0.eforz7s.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
    const dbName = 'smart-ewaste'
    
    console.log('🔗 Connecting to MongoDB...')
    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db(dbName)
    
    console.log('🔍 Testing vendor bidding system...')
    
    // Check users and their vendor associations
    console.log('\n👥 Users with vendor role:')
    const vendorUsers = await db.collection('users').find({ role: 'vendor' }).toArray()
    
    for (const user of vendorUsers) {
      console.log(`  User: ${user.name} (${user.email})`)
      
      // Find associated vendor record
      const vendor = await db.collection('vendors').findOne({ email: user.email })
      if (vendor) {
        console.log(`    → Vendor: ${vendor.company_name} (${vendor.contact_person})`)
        console.log(`    → Vendor ID: ${vendor._id}`)
        
        // Check bids by this vendor
        const bids = await db.collection('bids').find({ vendor_id: String(vendor._id) }).toArray()
        console.log(`    → Bids placed: ${bids.length}`)
        
        bids.forEach(bid => {
          console.log(`      - Auction: ${bid.auction_id}, Amount: ₹${bid.amount}, Status: ${bid.status}`)
        })
      } else {
        console.log(`    → ⚠️  No vendor record found for this email`)
      }
      console.log('')
    }
    
    // Check active auctions
    console.log('\n🎯 Active auctions:')
    const activeAuctions = await db.collection('auctions').find({ status: 'active' }).toArray()
    
    for (const auction of activeAuctions) {
      console.log(`  Auction: ${auction._id}`)
      console.log(`    Item: ${auction.item_id}`)
      console.log(`    Starting Price: ₹${auction.starting_price}`)
      console.log(`    Current Highest: ₹${auction.current_highest_bid || 'No bids'}`)
      console.log(`    End Time: ${auction.end_time}`)
      
      // Get bids for this auction
      const auctionBids = await db.collection('bids').find({ auction_id: String(auction._id) }).toArray()
      console.log(`    Bids: ${auctionBids.length}`)
      
      for (const bid of auctionBids) {
        const vendor = await db.collection('vendors').findOne({ _id: bid.vendor_id })
        const vendorName = vendor ? `${vendor.company_name} (${vendor.contact_person})` : `Unknown (${bid.vendor_id})`
        console.log(`      - ${vendorName}: ₹${bid.amount} (${bid.status})`)
      }
      console.log('')
    }
    
    await client.close()
    console.log('✅ Test complete')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testVendorBidding()
