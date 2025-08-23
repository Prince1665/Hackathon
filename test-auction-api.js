const fetch = require('node-fetch');

async function testAuctionAPI() {
  try {
    console.log('🔍 Testing auction API...');
    
    // Test fetching active auctions
    const response = await fetch('http://localhost:3000/api/auctions?status=active');
    
    if (!response.ok) {
      console.error('❌ API request failed:', response.status, response.statusText);
      return;
    }
    
    const auctions = await response.json();
    console.log(`📊 API returned ${auctions.length} active auctions:`);
    
    auctions.forEach((auction, index) => {
      console.log(`${index + 1}. Auction ID: "${auction.id}" (type: ${typeof auction.id})`);
      console.log(`   Status: ${auction.status}`);
      console.log(`   Item ID: ${auction.item_id}`);
      console.log(`   Starting Price: ₹${auction.starting_price}`);
      console.log(`   Current Highest Bid: ${auction.current_highest_bid || 'None'}`);
      console.log(`   End Time: ${auction.end_time}`);
      console.log(`   ---`);
    });
    
    // Test a specific auction ID that we know exists
    if (auctions.length > 0) {
      const testAuctionId = auctions[0].id;
      console.log(`\n🎯 Testing bid placement on auction: ${testAuctionId}`);
      
      // This would require authentication, so we'll just test the GET endpoint
      const bidResponse = await fetch(`http://localhost:3000/api/auctions/${testAuctionId}/bids`);
      if (bidResponse.ok) {
        const bids = await bidResponse.json();
        console.log(`✅ Successfully fetched ${bids.length} bids for auction ${testAuctionId}`);
      } else {
        console.log(`❌ Failed to fetch bids: ${bidResponse.status}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testAuctionAPI();
