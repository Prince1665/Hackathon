// Test the PDF API endpoint directly
import fetch from 'node-fetch';

async function testAPI() {
  try {
    console.log("Testing /api/reports/summary endpoint...");
    
    const response = await fetch('http://localhost:3000/api/reports/summary');
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ API Response received:");
      console.log(`  - Total items: ${data.total}`);
      console.log(`  - Environmental impact: ${data.environmentalImpact ? 'Present' : 'Missing'}`);
      
      if (data.environmentalImpact) {
        console.log(`  - Recovery rate: ${data.environmentalImpact.recoveryRate}%`);
        console.log(`  - Total processed: ${data.environmentalImpact.totalProcessed}`);
      }
      
      console.log(`  - Status breakdown:`, Object.keys(data.byStatus || {}).length, 'statuses');
      console.log(`  - Category breakdown:`, Object.keys(data.byCategory || {}).length, 'categories');
      
      return data;
    } else {
      console.error("❌ API request failed");
      const text = await response.text();
      console.error("Response body:", text);
      return null;
    }
  } catch (error) {
    console.error("❌ Error testing API:", error.message);
    return null;
  }
}

testAPI().then(() => {
  console.log("Test completed");
  process.exit(0);
}).catch(error => {
  console.error("Test failed:", error);
  process.exit(1);
});
