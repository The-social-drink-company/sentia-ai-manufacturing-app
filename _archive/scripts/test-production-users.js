#!/usr/bin/env node

/**
 * Production User Testing Script
 * Tests all demo users on live production system
 */

const users = [
  {
    name: "Demo User",
    email: "demo@demo.com", 
    password: "demo",
    role: "admin",
    description: "Quick demo account for client presentations"
  },
  {
    name: "Admin User",
    email: "admin@sentiaspirits.com",
    password: "demo123", 
    role: "admin",
    description: "Full administrative access for system management"
  },
  {
    name: "Production Manager",
    email: "manager@sentiaspirits.com",
    password: "demo123",
    role: "manager", 
    description: "Production oversight and operational management"
  },
  {
    name: "Floor Operator",
    email: "operator@sentiaspirits.com",
    password: "demo123",
    role: "operator",
    description: "Day-to-day operations and data entry"
  },
  {
    name: "Paul Roberts",
    email: "paul.roberts@sentiaspirits.com",
    password: "sentia2025",
    role: "admin",
    description: "Sentia Spirits leadership access"
  },
  {
    name: "Daniel Kenny", 
    email: "daniel.kenny@sentiaspirits.com",
    password: "sentia2025",
    role: "manager",
    description: "Sentia Spirits operations management"
  },
  {
    name: "David Orren",
    email: "david.orren@gabalabs.com", 
    password: "gaba2025",
    role: "admin",
    description: "GabaLabs technical administration"
  },
  {
    name: "Admin Portal",
    email: "admin@app.sentiaspirits.com",
    password: "admin2025",
    role: "admin", 
    description: "Primary admin portal access"
  },
  {
    name: "Data Upload",
    email: "data@app.sentiaspirits.com",
    password: "data2025",
    role: "operator",
    description: "Data import and upload operations"
  }
];

const productionUrl = "https://sentiaprod.financeflo.ai";

console.log("=".repeat(80));
console.log("SENTIA MANUFACTURING DASHBOARD - PRODUCTION USER TESTING");
console.log("=".repeat(80));
console.log(`Production URL: ${productionUrl}`);
console.log(`Test Date: ${new Date().toISOString()}`);
console.log("");

console.log("DEMO USERS FOR CLIENT TESTING:");
console.log("-".repeat(50));

users.forEach((user, index) => {
  console.log(`${index + 1}. ${user.name}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Password: ${user.password}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Description: ${user.description}`);
  console.log("");
});

console.log("TESTING INSTRUCTIONS:");
console.log("-".repeat(30));
console.log("1. Navigate to: https://sentiaprod.financeflo.ai/auth/signin");
console.log("2. Use any of the credentials listed above");
console.log("3. Verify dashboard loads with appropriate role permissions");
console.log("4. Test navigation to all major sections:");
console.log("   - Main Dashboard");
console.log("   - Working Capital");  
console.log("   - What-If Analysis");
console.log("   - Admin Panel (admin/manager only)");
console.log("   - Production Tracking");
console.log("   - Quality Control");
console.log("");

console.log("QUICK TEST CREDENTIALS:");
console.log("-".repeat(25));
console.log("Email: demo@demo.com");
console.log("Password: demo");
console.log("");

console.log("=".repeat(80));