#!/usr/bin/env node
// Unified Next.js + WebSocket server
import next from 'next';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import os from 'os';
import jwt from 'jsonwebtoken';

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3000', 10);
const host = process.env.HOST || '0.0.0.0';
const jwtSecret = process.env.JWT_SECRET || '';
const enableAuth = !!jwtSecret;

// Basic metrics
const metrics = {
  startedAt: Date.now(),
  wsConnections: 0,
  wsMessagesIn: 0,
  wsMessagesOut: 0,
  wsAuthFailures: 0,
  wsRateLimited: 0,
  wsRooms: 0,
};

const RATE_LIMIT_WINDOW_MS = parseInt(process.env.WS_RATE_LIMIT_WINDOW_MS || '10000', 10);
const RATE_LIMIT_MAX_ACTIONS = parseInt(process.env.WS_RATE_LIMIT_MAX_ACTIONS || '100', 10);
const rateMap = new Map(); // socket.id -> {count, resetAt}

function rateLimit(id) {
  const now = Date.now();
  let rec = rateMap.get(id);
  if (!rec || now > rec.resetAt) {
    rec = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateMap.set(id, rec);
  }
  rec.count++;
  if (rec.count > RATE_LIMIT_MAX_ACTIONS) {
    metrics.wsRateLimited++;
    return false;
  }
  return true;
}

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    // Inline metrics endpoint (avoid Next route overhead for scrape)
    if (req.url === '/metrics') {
      const upSeconds = (Date.now() - metrics.startedAt) / 1000;
      const load = os.loadavg();
      const lines = [
        '# TYPE process_uptime_seconds gauge',
        `process_uptime_seconds ${upSeconds}`,
        '# TYPE websocket_connections gauge',
        `websocket_connections ${metrics.wsConnections}`,
        '# TYPE websocket_messages_in counter',
        `websocket_messages_in_total ${metrics.wsMessagesIn}`,
        '# TYPE websocket_messages_out counter',
        `websocket_messages_out_total ${metrics.wsMessagesOut}`,
        '# TYPE websocket_auth_failures counter',
        `websocket_auth_failures_total ${metrics.wsAuthFailures}`,
        '# TYPE websocket_rate_limited counter',
        `websocket_rate_limited_total ${metrics.wsRateLimited}`,
        '# TYPE websocket_rooms gauge',
        `websocket_rooms ${metrics.wsRooms}`,
        '# TYPE system_load_average gauge',
        `system_load_average{period="1m"} ${load[0]}`,
        `system_load_average{period="5m"} ${load[1]}`,
        `system_load_average{period="15m"} ${load[2]}`,
      ];
      res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4' });
      res.end(lines.join('\n'));
      return;
    }
    // Fallback to Next handler
    handle(req, res);
  });

  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) : '*'
    }
  });

  if (enableAuth) {
    io.use((socket, next) => {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token || typeof token !== 'string') {
        metrics.wsAuthFailures++;
        return next(new Error('unauthorized'));
      }
      try {
        const payload = jwt.verify(token, jwtSecret);
        socket.data.user = payload;
        next();
      } catch {
        metrics.wsAuthFailures++;
        next(new Error('unauthorized'));
      }
    });
  }

  function attach(nsp, label) {
    nsp.on('connection', socket => {
      metrics.wsConnections++;
      metrics.wsRooms = io.sockets.adapter.rooms.size;

      socket.on('disconnect', () => {
        metrics.wsConnections--;
        metrics.wsRooms = io.sockets.adapter.rooms.size;
      });

      socket.on('join', room => {
        if (!rateLimit(socket.id)) return socket.emit('rate_limited');
        socket.join(room);
        metrics.wsRooms = io.sockets.adapter.rooms.size;
        socket.emit('joined', { room, namespace: label });
      });

      socket.on('leave', room => {
        if (!rateLimit(socket.id)) return socket.emit('rate_limited');
        socket.leave(room);
        metrics.wsRooms = io.sockets.adapter.rooms.size;
        socket.emit('left', { room, namespace: label });
      });

      socket.on('message', payload => {
        if (!rateLimit(socket.id)) return socket.emit('rate_limited');
        metrics.wsMessagesIn++;
        if (payload && typeof payload === 'object' && payload.room) {
          const { room, data } = payload;
            socket.to(room).emit('message', { namespace: label, room, data });
        } else {
          socket.broadcast.emit('message', { namespace: label, data: payload });
        }
        metrics.wsMessagesOut++;
      });
    });
  }

  attach(io.of('/collab'), 'collab');
  attach(io.of('/chat'), 'chat');
  attach(io.of('/system'), 'system');
  attach(io.of('/'), 'root');

  server.listen(port, host, () => {
    // eslint-disable-next-line no-console
    console.log(`Unified server listening on http://${host}:${port} (dev=${dev})`);
  });
}).catch(err => {
  console.error('Failed to start unified server', err);
  process.exit(1);
});
