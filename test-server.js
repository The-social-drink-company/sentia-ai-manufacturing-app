import express from "express";
const app = express();
const PORT = process.env.PORT || 5002;
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", environment: process.env.NODE_ENV || "development", port: PORT, timestamp: new Date().toISOString() });
});
app.get("/api/production/overview", (req, res) => {
  res.json({ status: "success", message: "Production API working", data: { test: true }, timestamp: new Date().toISOString() });
});
app.listen(PORT, () => { console.log(`Test server running on port ${PORT}`); });
