import { schools } from "./db/schema.js";
import express from "express";
import morgan from "morgan";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";

const app = express();

app.use(morgan("dev"));

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  ssl: { rejectUnauthorized: false }, // Required for Aiven
});

const db = drizzle(connection);

app.post("/addSchool", async (req, res) => {
  const { name, address, longitude, latitude } = req.body;
  const errors = [];

  if (typeof name !== "string" || name.trim() === "") {
    errors.push("Name must be a non-empty string.");
  }

  if (typeof address !== "string" || address.trim() === "") {
    errors.push("Address must be a non-empty string.");
  }

  if (typeof longitude !== "number" || longitude < -180 || longitude > 180) {
    errors.push("Longitude must be a number between -180 and 180.");
  }

  if (typeof latitude !== "number" || latitude < -90 || latitude > 90) {
    errors.push("Latitude must be a number between -90 and 90.");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors: errors,
    });
  }

  try {
    await db.insert(schools).values({
      name,
      address,
      longitude,
      latitude,
    });

    res.status(201).json({
      message: "School added successfully",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/listSchools", async (req, res) => {
  try {
    const { latitude, longitude } = req.query;
    if (!latitude || !longitude) {
      const schools = await db.select().from(schools);
      res.status(200).json({
        success: true,
        data: schools,
      });
      return;
    }
    const schools = await db.select().from(schools);
    const distances = schools.map((school) => {
      const { longitude: schoolLongitude, latitude: schoolLatitude } = school;
      return {
        ...school,
        distance: Math.sqrt(
          Math.pow(schoolLongitude - longitude, 2) +
            Math.pow(schoolLatitude - latitude, 2),
        ),
      };
    });
    const sortedSchools = distances.sort((a, b) => a.distance - b.distance);
    res.status(200).json({
      success: true,
      data: sortedSchools,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
