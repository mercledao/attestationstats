const express = require("express");
const app = express();
const port = 3000;
const pgp = require("pg-promise")();
require("dotenv").config(); // Load environment variables from .env file

const db = pgp(process.env.DATABASE_URL);

app.use(express.json());

// Serve static files (including index.html) from the "public" folder
app.use(express.static("public"));

// API to get data for the last 7 days
app.get("/api/last-7-days", async (req, res) => {
  try {
    const query = `
      SELECT *
      FROM event_rewards_log
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `;
    const result = await db.any(query);
    res.json(result);
  } catch (error) {
    console.error("Error fetching data for the last 7 days: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/last-30-days", async (req, res) => {
    try {
      const query = `
        SELECT *
        FROM event_rewards_log
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `;
      const result = await db.any(query);
      res.json(result);
    } catch (error) {
      console.error("Error fetching data for the last 30 days: ", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

// You can add more API endpoints for other data retrieval here
// ...

// API to get data between two dates
app.get("/api/data-between-dates", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
  
      // Ensure that both startDate and endDate are provided
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "Both startDate and endDate are required." });
      }
  
      // Convert startDate and endDate to Date objects
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
  
      // Ensure that startDate is before endDate
      if (startDateObj >= endDateObj) {
        return res.status(400).json({ error: "startDate must be before endDate." });
      }
  
      const query = `
        SELECT *
        FROM event_rewards_log
        WHERE created_at >= $1 AND created_at <= $2
      `;
  
      const result = await db.any(query, [startDateObj, endDateObj]);
      res.json(result);
    } catch (error) {
      console.error("Error fetching data between dates: ", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // ...

  
// Route the root URL ("/") to serve the index.html file
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});
