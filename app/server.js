const express = require('express');
const Redis = require('ioredis');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/style.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'style.css'));
});
app.get('/app.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'app.js'));
});

const PORT = process.env.PORT || 8080;
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '6379', 10);
const DB_PASSWORD = process.env.DB_PASSWORD || undefined;
const POD_NAME = process.env.POD_NAME || require('os').hostname();
const ENVIRONMENT = process.env.NODE_ENV || 'production';

let isRedisConnected = false;
let chaosModeActive = false;

// Initialize Redis client
const redisClient = new Redis({
  host: DB_HOST,
  port: DB_PORT,
  password: DB_PASSWORD,
  connectTimeout: 5000,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 10) return null;
    return Math.min(times * 200, 2000);
  }
});

redisClient.on('connect', () => {
  console.log(`[REDIS OK] Connected to Redis instance at ${DB_HOST}:${DB_PORT}`);
  if (!chaosModeActive) isRedisConnected = true;
});

redisClient.on('error', (err) => {
  console.error(`[REDIS ERROR] Issue connecting to ${DB_HOST}:${DB_PORT}:`, err.message);
  isRedisConnected = false;
});

// Liveness Probe (Is process alive?)
app.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'ALIVE',
    timestamp: new Date().toISOString(),
    pod: POD_NAME
  });
});

// Readiness Probe (Is app ready including DB connection?)
app.get('/readyz', async (req, res) => {
  if (chaosModeActive || !isRedisConnected) {
    return res.status(500).json({
      status: 'UNREADY',
      reason: chaosModeActive ? 'Chaos Engineering Fault Injected' : `DB Inactive (${DB_HOST}:${DB_PORT})`,
      timestamp: new Date().toISOString(),
      pod: POD_NAME
    });
  }

  try {
    const pingResult = await redisClient.ping();
    if (pingResult === 'PONG') {
      return res.status(200).json({ status: 'READY', database: 'CONNECTED', pod: POD_NAME });
    }
    throw new Error(`Unexpected ping: ${pingResult}`);
  } catch (err) {
    return res.status(500).json({ status: 'UNREADY', error: err.message, pod: POD_NAME });
  }
});

// API Endpoints
app.get('/api/v1/status', (req, res) => {
  res.status(200).json({
    service: 'k8s-devops-fullstack',
    version: '1.0.0',
    environment: ENVIRONMENT,
    pod: POD_NAME,
    databaseHost: DB_HOST,
    databasePort: DB_PORT,
    dbConnected: isRedisConnected && !chaosModeActive,
    uptime: process.uptime()
  });
});

app.post('/api/v1/data', async (req, res) => {
  const { key, value } = req.body;
  if (!key || !value) {
    return res.status(400).json({ error: 'Both key and value are required' });
  }
  if (chaosModeActive || !isRedisConnected) {
    return res.status(500).json({ error: 'Database connection offline' });
  }
  try {
    await redisClient.set(key, JSON.stringify(value));
    res.status(201).json({ message: 'Key saved successfully', key, pod: POD_NAME });
  } catch (err) {
    res.status(500).json({ error: 'Failed to write to Redis', details: err.message });
  }
});

app.get('/api/v1/data/:key', async (req, res) => {
  if (chaosModeActive || !isRedisConnected) {
    return res.status(500).json({ error: 'Database connection offline' });
  }
  try {
    const data = await redisClient.get(req.params.key);
    if (!data) return res.status(404).json({ error: 'Key not found' });
    res.status(200).json({ key: req.params.key, value: JSON.parse(data), pod: POD_NAME });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read from Redis', details: err.message });
  }
});

// Chaos endpoints
app.post('/api/v1/chaos/fail', (req, res) => {
  chaosModeActive = true;
  console.warn(`[CHAOS SIMULATION] Readiness probe failure triggered on pod ${POD_NAME}`);
  res.status(200).json({ message: 'Chaos mode enabled. Readiness probe failing.' });
});

app.post('/api/v1/chaos/restore', (req, res) => {
  chaosModeActive = false;
  isRedisConnected = true;
  console.log(`[CHAOS REMEDIATION] Health restored on pod ${POD_NAME}`);
  res.status(200).json({ message: 'Chaos mode disabled. Readiness probe healthy.' });
});

app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(`redis_connected_status ${isRedisConnected && !chaosModeActive ? 1 : 0}`);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[FULLSTACK RUNNING] Frontend & Backend active on http://0.0.0.0:${PORT} (Pod: ${POD_NAME})`);
});
