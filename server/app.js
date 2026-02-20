const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Files
app.use(express.static(path.join(__dirname, '../html')));

// Database Connection Pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'mysql_db',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test DB Connection
pool.getConnection()
    .then(conn => {
        console.log('Database connected successfully');
        conn.release();
    })
    .catch(err => {
        console.error('Database connection failed:', err);
    });

// API Routes

// Get Result by Token
app.get('/api/results/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const [rows] = await pool.query(
            `SELECT u.*, s.age, s.pension, s.savings, s.property_value_estimate as propertyValue, s.health_status as healthCost, s.result_asset_lifespan
             FROM users u
             JOIN simulations s ON u.id = s.user_id
             WHERE u.result_token = ?`,
            [token]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Result not found' });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error fetching result:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// Save Lead Data
app.post('/api/leads', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const {
            age, healthInfo, pension, savings, propertyValue, // User Basic Info
            city, landSize, buildingAge, // Property Details
            email, phone, // Contact Info
            route, services, contactTime, urgency, remarks, addressDetail // Lead Details
        } = req.body;

        await conn.beginTransaction();

        // Generate Token
        const token = crypto.randomBytes(32).toString('hex');

        // 1. Insert/Update User
        // Note: Ideally we check if user exists by email, but for MVP we insert new or update based on email logic if needed.
        // Simple Insert for now.
        const [userResult] = await conn.query(
            `INSERT INTO users 
            (email, phone, prefecture, city, land_size, building_age, address_detail, result_token, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [email, phone, '東京都', city, landSize, buildingAge, addressDetail, token]
        );

        const userId = userResult.insertId;

        // 2. Insert Simulation Result
        await conn.query(
            `INSERT INTO simulations
            (user_id, age, health_status, pension, savings, property_value_estimate, result_asset_lifespan, calculated_monthly_cost, calculated_initial_cost, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [userId, age, healthInfo.toString(), pension, savings, propertyValue, 0, 0, 0]
        );

        // 3. Insert Lead Info
        const selectedServicesStr = Array.isArray(services) ? services.join(',') : services;
        await conn.query(
            `INSERT INTO leads
            (user_id, route_type, selected_services, urgency, contact_time, note, sent_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [userId, route, selectedServicesStr, urgency, contactTime, remarks]
        );

        await conn.commit();
        res.json({ success: true, message: 'Data saved successfully', token: token });

    } catch (error) {
        await conn.rollback();
        console.error('Error saving data:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    } finally {
        conn.release();
    }
});

// Serve Index
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../html/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
