const express = require('express');
const router = require('./src/routes/api');
const app = express();

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const path = require('path');
const { DATABASE_URL } = require("./src/config/config");
const chalk = require('chalk');

// MongoDB connection
const URL = `${DATABASE_URL}`;
let options = {
    autoIndex: false, 
    serverSelectionTimeoutMS: 30000,
};

mongoose.connect(URL, options)
    .then((result) => {
        console.log(chalk.yellow('DB connection ' + chalk.green("Success")));
    }).catch((err) => {
        console.log('DB connection error' + err);
    });

// --- Core Middleware ---

app.use(cookieParser());

const corsOptions = {
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions)); 

app.use(helmet());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000 
});
app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// --- API Routing ---

// API router setup
app.use('/api/v1', router);

// --- API 404 Not Found Handler ---
// <-- NEW SECTION
// This middleware will catch any request that starts with /api/v1
// but was not handled by the 'router'.
app.all('/api/v1/*', (req, res) => {
    res.status(404).json({
        status: "fail",
        message: "API Route Not Found"
    });
});
// --- END NEW SECTION ---


// --- Frontend Hosting ---

// Serve React frontend static files
// This must be AFTER the API 404 handler
app.use(express.static('client/dist'));

// React frontend routing: "catch-all" handler for SPAs
// This must be the LAST route handler
app.get('*', function (req, res) {
    res.sendFile(path.resolve(__dirname, 'client', 'dist', 'index.html'));
});

module.exports = app;