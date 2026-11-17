const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const authRoutes = require('./routes/auth.routes');
const sourcesRoutes = require('./routes/sources.routes');
const reportsRoutes = require('./routes/reports.routes');
const authorityRoutes = require('./routes/authority.routes');

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded field test and water source photos statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'JalSuraksha Water Contamination Reporting & Risk-Mapping API (Group G315)',
    database: 'PostgreSQL 18 (Local)',
    timestamp: new Date().toISOString(),
  });
});

// Mount core API modules
app.use('/api/auth', authRoutes);
app.use('/api/sources', sourcesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/authority', authorityRoutes);

// Serve built frontend bundle if available
const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
    if (err) next();
  });
});

if (require.main === module) {
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`[JalSuraksha API] Server running on http://127.0.0.1:${PORT}`);
  });
}

module.exports = app;
