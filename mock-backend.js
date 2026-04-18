const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// In-memory data storage
const users = new Map();
const emergencies = new Map();
const allocations = new Map();
let emergencyId = 1;
let allocationId = 1;

// Sample hospitals data (same as backend)
const hospitals = [
  { id: 1, name: "AIIMS New Delhi", city: "Delhi", latitude: 28.5672, longitude: 77.2100, totalBeds: 2500, ventilators: 150, icuBeds: 45, ambulances: 20, staff: 15, specialties: "Multi-specialty, Trauma, Oncology" },
  { id: 2, name: "Safdarjung Hospital", city: "Delhi", latitude: 28.5685, longitude: 77.2064, totalBeds: 2900, ventilators: 50, icuBeds: 60, ambulances: 10, staff: 12, specialties: "Trauma, General Surgery, Cardiac" },
  { id: 3, name: "Max Super Specialty Saket", city: "Delhi", latitude: 28.5275, longitude: 77.2117, totalBeds: 500, ventilators: 85, icuBeds: 30, ambulances: 12, staff: 10, specialties: "Cardiac, Neuro, Ortho" },
  { id: 4, name: "Indraprastha Apollo", city: "Delhi", latitude: 28.5414, longitude: 77.2847, totalBeds: 700, ventilators: 120, icuBeds: 40, ambulances: 15, staff: 14, specialties: "Transplant, Cardiac, Critical Care" },
  { id: 5, name: "Sir Ganga Ram Hospital", city: "Delhi", latitude: 28.6385, longitude: 77.1895, totalBeds: 675, ventilators: 95, icuBeds: 25, ambulances: 8, staff: 9, specialties: "Gastro, Nephro, General" },
  { id: 6, name: "Tata Memorial Hospital", city: "Mumbai", latitude: 19.0039, longitude: 72.8427, totalBeds: 700, ventilators: 15, icuBeds: 85, ambulances: 4, staff: 6, specialties: "Oncology, Radiology, Surgery" },
  { id: 7, name: "Lilavati Hospital", city: "Mumbai", latitude: 19.0514, longitude: 72.8270, totalBeds: 323, ventilators: 60, icuBeds: 25, ambulances: 10, staff: 8, specialties: "Cardiac, Neuro, Nephro" },
  { id: 8, name: "Fortis Bannerghatta", city: "Bangalore", latitude: 12.8950, longitude: 77.5980, totalBeds: 400, ventilators: 70, icuBeds: 30, ambulances: 10, staff: 9, specialties: "Cardiac, Pulmonology, Neuro" },
  { id: 9, name: "Manipal Hospital Old Airport Rd", city: "Bangalore", latitude: 12.9592, longitude: 77.6446, totalBeds: 600, ventilators: 110, icuBeds: 40, ambulances: 15, staff: 12, specialties: "Multi-specialty, Transplant" },
  { id: 10, name: "NIMHANS", city: "Bangalore", latitude: 12.9461, longitude: 77.5925, totalBeds: 800, ventilators: 20, icuBeds: 120, ambulances: 5, staff: 6, specialties: "Neurology, Psychiatry, Neurosurgery" }
];

const jwtSecret = 'your-secret-key-change-in-production';

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);
  
  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Auth endpoints
app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  
  if (users.has(email)) {
    return res.status(400).json({ message: 'Email already in use' });
  }
  
  users.set(email, { email, password, name });
  res.json({ message: 'User registered successfully' });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = users.get(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  const token = jwt.sign({ email, name: user.name }, jwtSecret, { expiresIn: '24h' });
  res.json({ token, name: user.name, email });
});

// Hospital endpoints
app.get('/api/hospital', (req, res) => {
  res.json(hospitals);
});

app.get('/api/hospital/all', (req, res) => {
  res.json(hospitals);
});

app.get('/api/hospital/:id', (req, res) => {
  const hospital = hospitals.find(h => h.id === parseInt(req.params.id));
  if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
  res.json(hospital);
});

app.post('/api/hospital/available', (req, res) => {
  const { city, severity } = req.body;
  const cityHospitals = hospitals.filter(h => h.city === city);
  res.json(cityHospitals.sort((a, b) => b.icuBeds - a.icuBeds));
});

// Emergency endpoints
app.post('/api/emergency/report', (req, res) => {
  const { patientName, phone, location, severity, latitude, longitude, type } = req.body;
  
  const id = emergencyId++;
  const emergency = {
    id,
    patientName,
    phone,
    location,
    severity,
    latitude,
    longitude,
    type,
    status: 'PENDING',
    createdAt: new Date(),
    allocatedHospital: null
  };
  
  emergencies.set(id, emergency);
  res.json({ id, message: 'Emergency reported', ...emergency });
});

app.get('/api/emergency', (req, res) => {
  res.json(Array.from(emergencies.values()));
});

app.get('/api/emergency/all', authenticateToken, (req, res) => {
  res.json(Array.from(emergencies.values()));
});

app.get('/api/emergency/:id', (req, res) => {
  const emergency = emergencies.get(parseInt(req.params.id));
  if (!emergency) return res.status(404).json({ message: 'Emergency not found' });
  res.json(emergency);
});

app.put('/api/emergency/:id/status', authenticateToken, (req, res) => {
  const { status } = req.body;
  const emergency = emergencies.get(parseInt(req.params.id));
  if (!emergency) return res.status(404).json({ message: 'Emergency not found' });
  
  emergency.status = status;
  res.json(emergency);
});

// Allocation endpoints
app.post('/api/allocate', authenticateToken, (req, res) => {
  const { emergencyId: eId, hospitalId } = req.body;
  
  const emergency = emergencies.get(eId);
  const hospital = hospitals.find(h => h.id === hospitalId);
  
  if (!emergency || !hospital) {
    return res.status(404).json({ message: 'Emergency or hospital not found' });
  }
  
  const id = allocationId++;
  const allocation = {
    id,
    emergencyId: eId,
    hospitalId,
    hospitalName: hospital.name,
    status: 'CONFIRMED',
    createdAt: new Date(),
    allocatedBy: req.user.email
  };
  
  allocations.set(id, allocation);
  emergency.status = 'ALLOCATED';
  emergency.allocatedHospital = hospital.name;
  
  res.json(allocation);
});

app.get('/api/allocate/list', authenticateToken, (req, res) => {
  res.json(Array.from(allocations.values()));
});

app.get('/api/allocate/:id', authenticateToken, (req, res) => {
  const allocation = allocations.get(parseInt(req.params.id));
  if (!allocation) return res.status(404).json({ message: 'Allocation not found' });
  res.json(allocation);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Backend running' });
});

const PORT = 8081;
app.listen(PORT, () => {
  console.log(`\n✅ Mock Backend Server running on http://localhost:${PORT}`);
  console.log(`📍 Frontend: http://localhost:5173`);
  console.log(`\nTest credentials:`);
  console.log(`  Email: test@example.com`);
  console.log(`  Password: password123\n`);
});
