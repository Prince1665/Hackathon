// Debug script to test PDF functionality
console.log("🔍 Starting PDF debug test...");

// Test 1: Check if we can fetch the API
async function testAPI() {
  try {
    console.log("📡 Testing API endpoint...");
    const response = await fetch('http://localhost:3000/api/reports/summary');
    console.log("API Response status:", response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ API data received:", data);
      return data;
    } else {
      console.error("❌ API request failed:", response.statusText);
      return null;
    }
  } catch (error) {
    console.error("❌ API error:", error);
    return null;
  }
}

// Test 2: Check if PDF libraries can be loaded
async function testPDFLibraries() {
  try {
    console.log("📦 Testing PDF libraries...");
    
    // Try to import jsPDF
    const jsPDFModule = await import('jspdf');
    console.log("✅ jsPDF loaded successfully");
    
    // Try to import jspdf-autotable
    const autoTableModule = await import('jspdf-autotable');
    console.log("✅ jspdf-autotable loaded successfully");
    
    return { jsPDF: jsPDFModule.jsPDF, autoTable: autoTableModule.default };
  } catch (error) {
    console.error("❌ PDF libraries error:", error);
    return null;
  }
}

// Test 3: Try to generate a simple PDF
async function testPDFGeneration(libraries) {
  try {
    console.log("📄 Testing PDF generation...");
    
    const { jsPDF } = libraries;
    const doc = new jsPDF();
    
    doc.text("Test PDF Generated Successfully!", 20, 20);
    doc.text("Date: " + new Date().toLocaleString(), 20, 30);
    
    // Try to save
    doc.save('test-debug.pdf');
    console.log("✅ PDF generation successful!");
    
    return true;
  } catch (error) {
    console.error("❌ PDF generation error:", error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log("🏃 Running all PDF tests...");
  
  // Test API
  const apiData = await testAPI();
  
  // Test PDF libraries
  const libraries = await testPDFLibraries();
  
  if (libraries) {
    // Test PDF generation
    const pdfSuccess = await testPDFGeneration(libraries);
    
    if (apiData && pdfSuccess) {
      console.log("🎉 All tests passed! PDF functionality should work.");
    } else {
      console.log("⚠️ Some tests failed. Check the errors above.");
    }
  }
}

// Auto-run when script loads
if (typeof window !== 'undefined') {
  // Browser environment
  window.addEventListener('load', runAllTests);
} else {
  // Node environment
  runAllTests();
}
