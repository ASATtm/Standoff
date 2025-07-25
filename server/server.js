// server/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import './firebase.js';

import withdrawRoute from './api/withdraw.js';
import lockRoute from './api/lock.js';
import releaseRoute from './api/release.js';
import userRoute from './api/user.js';
import cryptoRoute from './api/crypto.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Health check routes
app.get('/ping', (req, res) => res.send('pong'));
app.get('/api/test', (req, res) => res.send('✅ /api/test route from server.js works'));

// ✅ Debug route to verify server is handling requests
app.get('/api/debug/ping', (req, res) => {
  res.send('✅ API server is handling this request.');
});

try {
  app.use('/api/withdraw', withdrawRoute);
  app.use('/withdraw', withdrawRoute);
  console.log('✅ /api/withdraw & /withdraw route mounted');
} catch (err) {
  console.error('❌ Failed to mount withdraw routes:', err.message);
}

try {
  app.use('/api/lock', lockRoute);
  console.log('✅ /api/lock route mounted');
} catch (err) {
  console.error('❌ Failed to mount /api/lock:', err.message);
}

try {
  app.use('/api/release', releaseRoute);
  console.log('✅ /api/release route mounted');
} catch (err) {
  console.error('❌ Failed to mount /api/release:', err.message);
}

try {
  app.use('/api/user', userRoute);
  console.log('✅ /api/user route mounted');
} catch (err) {
  console.error('❌ Failed to mount /api/user:', err.message);
}

try {
  app.use('/api/crypto', cryptoRoute);
  console.log('✅ /api/crypto route mounted');
} catch (err) {
  console.error('❌ Failed to mount /api/crypto:', err.message);
}

// 🧪 Enhanced route logger (safe)
function printRoutes(app) {
  try {
    const stack = app?._router?.stack || [];
    console.log('✅ Registered API endpoints:');
    stack.forEach((middleware) => {
      if (middleware.route) {
        const methods = Object.keys(middleware.route.methods).join(', ').toUpperCase();
        console.log(`${methods} ${middleware.route.path}`);
      } else if (middleware.name === 'router' && middleware.handle.stack) {
        middleware.handle.stack.forEach((handler) => {
          if (handler.route) {
            const methods = Object.keys(handler.route.methods).join(', ').toUpperCase();
            console.log(`${methods} ${handler.route.path}`);
          }
        });
      }
    });
  } catch (err) {
    console.warn('⚠️ Could not print routes:', err.message);
  }
}
printRoutes(app);

const PORT = process.env.PORT || 3001;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
}).on('error', (err) => {
  console.error('❌ Server failed to start:', err.message);
});
