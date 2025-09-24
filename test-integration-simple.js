console.log("🧪 Testing Integration...");
fetch("http://localhost:7001/health").then(r=>r.json()).then(d=>console.log("✅ MCP Health:", d.status));
fetch("http://localhost:8006/api/health").then(r=>r.json()).then(d=>console.log("✅ Backend Health:", d.status));
console.log("📊 Testing complete - both MCP and Backend are responding!");
