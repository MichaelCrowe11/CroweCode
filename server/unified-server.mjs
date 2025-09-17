import next from 'next';
import http from 'http';
import os from 'os';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';

// ---- Environment & Config ----
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const JWT_SECRET = process.env.JWT_SECRET || '';
const ENABLE_AUTH = !!JWT_SECRET;
const PUSHGATEWAY_URL = process.env.PUSHGATEWAY_URL;
const PROMETHEUS_JOB_NAME = process.env.PROMETHEUS_JOB_NAME || 'unified_app';
const METRICS_PUSH_INTERVAL_MS = parseInt(process.env.METRICS_PUSH_INTERVAL_MS || '30000', 10);
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.WS_RATE_LIMIT_WINDOW_MS || '10000', 10);
const RATE_LIMIT_MAX_ACTIONS = parseInt(process.env.WS_RATE_LIMIT_MAX_ACTIONS || '100', 10);

// ---- Metrics State ----
const metrics = {
  connections: 0,
  messagesIn: 0,
  messagesOut: 0,
  authFailures: 0,
  rateLimited: 0,
  rooms: 0,
  startedAt: Date.now()
};

// ---- Rate Limiting (in-memory) ----
const rateMap = new Map();
function rateLimit(id) {
  const now = Date.now();
  let rec = rateMap.get(id);
  if (!rec || now > rec.resetAt) {
    rec = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateMap.set(id, rec);
  }
  rec.count++;
  if (rec.count > RATE_LIMIT_MAX_ACTIONS) {
    metrics.rateLimited++;
    return false;
  }
  return true;
}

// ---- Prometheus Metrics Formatting ----
function renderMetrics() {
  const upSeconds = (Date.now() - metrics.startedAt) / 1000;
  return [
    '# TYPE unified_connections gauge',
    `unified_connections ${metrics.connections}`,
    '# TYPE unified_messages_in counter',
    `unified_messages_in_total ${metrics.messagesIn}`,
    '# TYPE unified_messages_out counter',
    `unified_messages_out_total ${metrics.messagesOut}`,
    '# TYPE unified_auth_failures counter',
    `unified_auth_failures_total ${metrics.authFailures}`,
    '# TYPE unified_rate_limited counter',
    `unified_rate_limited_total ${metrics.rateLimited}`,
    '# TYPE unified_rooms gauge',
    `unified_rooms ${metrics.rooms}`,
    '# TYPE unified_process_uptime_seconds gauge',
    `unified_process_uptime_seconds ${upSeconds}`,
    '# TYPE unified_system_load_average gauge',
    `unified_system_load_average{period="1m"} ${os.loadavg()[0]}`,
    `unified_system_load_average{period="5m"} ${os.loadavg()[1]}`,
    `unified_system_load_average{period="15m"} ${os.loadavg()[2]}`
  ].join('\n');
}

async function pushMetrics() {
  if (!PUSHGATEWAY_URL) return;
  try {
    await fetch(`${PUSHGATEWAY_URL}/metrics/job/${encodeURIComponent(PROMETHEUS_JOB_NAME)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: renderMetrics() + '\n'
    });
  } catch (err) {
    console.error('Failed to push metrics:', err.message);
  }
}

// ---- Next.js Setup ----
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    if (req.url === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'healthy', uptime: process.uptime() }));
      return;
    }
    if (req.url === '/metrics') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(renderMetrics());
      return;
    }
    return handle(req, res);
  });

  // ---- Socket.IO Integration ----
  const io = new SocketIOServer(server, {
    cors: {
      origin: (process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) : '*')
    }
  });

  if (ENABLE_AUTH) {
    io.use((socket, next) => {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token || typeof token !== 'string') {
        metrics.authFailures++; return next(new Error('unauthorized'));
      }
      try {
        const payload = jwt.verify(token, JWT_SECRET);
        socket.data.user = payload;
        next();
      } catch {
        metrics.authFailures++; next(new Error('unauthorized'));
      }
    });
  }

  function attachNamespace(nsp, label) {
    nsp.on('connection', (socket) => {
      metrics.connections++; metrics.rooms = io.sockets.adapter.rooms.size;
      socket.on('disconnect', () => {
        metrics.connections--; metrics.rooms = io.sockets.adapter.rooms.size;
      });
      socket.on('join', (room) => {
        if (!rateLimit(socket.id)) return socket.emit('rate_limited');
        socket.join(room); metrics.rooms = io.sockets.adapter.rooms.size; socket.emit('joined', { room, namespace: label });
      });
      socket.on('leave', (room) => {
        if (!rateLimit(socket.id)) return socket.emit('rate_limited');
        socket.leave(room); metrics.rooms = io.sockets.adapter.rooms.size; socket.emit('left', { room, namespace: label });
      });
      socket.on('message', (payload) => {
        if (!rateLimit(socket.id)) return socket.emit('rate_limited');
        metrics.messagesIn++;
        if (payload && typeof payload === 'object' && payload.room) {
          const { room, data } = payload;
            socket.to(room).emit('message', { namespace: label, room, data });
        } else {
          socket.broadcast.emit('message', { namespace: label, data: payload });
        }
        metrics.messagesOut++;
      });
    });
  }

  attachNamespace(io.of('/collab'), 'collab');
  attachNamespace(io.of('/chat'), 'chat');
  attachNamespace(io.of('/system'), 'system');
  attachNamespace(io, 'root');

  server.listen(PORT, HOST, () => {
    console.log(`Unified Next + WebSocket server running at http://${HOST}:${PORT}`);
  });

  if (PUSHGATEWAY_URL) {
    setInterval(pushMetrics, METRICS_PUSH_INTERVAL_MS);
  }
}).catch(err => {
  console.error('Failed to start unified server:', err);
  process.exit(1);
});
