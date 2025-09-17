import { createServer } from 'http';
import { Server } from 'socket.io';
import os from 'os';
import jwt from 'jsonwebtoken';
// ----- Configuration -----
const JWT_SECRET = process.env.JWT_SECRET || '';
const ENABLE_AUTH = !!JWT_SECRET; // Enable auth middleware only if secret present
const PUSHGATEWAY_URL = process.env.PUSHGATEWAY_URL; // e.g. http://prom-pushgateway:9091
const PROMETHEUS_JOB_NAME = process.env.PROMETHEUS_JOB_NAME || 'websocket_server';
const METRICS_PUSH_INTERVAL_MS = parseInt(process.env.METRICS_PUSH_INTERVAL_MS || '30000', 10);
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.WS_RATE_LIMIT_WINDOW_MS || '10000', 10); // 10s window default
const RATE_LIMIT_MAX_ACTIONS = parseInt(process.env.WS_RATE_LIMIT_MAX_ACTIONS || '100', 10); // per window
// Basic in-process metrics counters (exported for Prometheus text formatting elsewhere if needed)
const metrics = {
    connections: 0,
    messagesIn: 0,
    messagesOut: 0,
    authFailures: 0,
    rateLimited: 0,
    rooms: 0,
    startedAt: Date.now(),
};
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
const PORT = parseInt(process.env.WS_PORT || process.env.PORT || '8080', 10);
const HOST = process.env.HOST || '0.0.0.0';
const httpServer = createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
        return;
    }
    if (req.url === '/metrics') {
        const upSeconds = (Date.now() - metrics.startedAt) / 1000;
        const lines = [
            '# TYPE websocket_connections gauge',
            `websocket_connections ${metrics.connections}`,
            '# TYPE websocket_messages_in counter',
            `websocket_messages_in_total ${metrics.messagesIn}`,
            '# TYPE websocket_messages_out counter',
            `websocket_messages_out_total ${metrics.messagesOut}`,
            '# TYPE websocket_auth_failures counter',
            `websocket_auth_failures_total ${metrics.authFailures}`,
            '# TYPE websocket_rate_limited counter',
            `websocket_rate_limited_total ${metrics.rateLimited}`,
            '# TYPE websocket_rooms gauge',
            `websocket_rooms ${metrics.rooms}`,
            '# TYPE websocket_process_uptime_seconds gauge',
            `websocket_process_uptime_seconds ${upSeconds}`,
            '# TYPE websocket_system_load_average gauge',
            `websocket_system_load_average{period="1m"} ${os.loadavg()[0]}`,
            `websocket_system_load_average{period="5m"} ${os.loadavg()[1]}`,
            `websocket_system_load_average{period="15m"} ${os.loadavg()[2]}`
        ];
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(lines.join('\n'));
        return;
    }
    res.writeHead(404);
    res.end();
});
const io = new Server(httpServer, {
    cors: {
        origin: (process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()) : '*') // simplified; allow string[] | '*'
    }
});
// Authentication middleware (optional)
if (ENABLE_AUTH) {
    io.use((socket, next) => {
        var _a, _b;
        const token = ((_a = socket.handshake.auth) === null || _a === void 0 ? void 0 : _a.token) || ((_b = socket.handshake.query) === null || _b === void 0 ? void 0 : _b.token);
        if (!token || typeof token !== 'string') {
            metrics.authFailures++;
            return next(new Error('unauthorized'));
        }
        try {
            const payload = jwt.verify(token, JWT_SECRET);
            socket.user = payload; // attach user
            return next();
        }
        catch (err) {
            metrics.authFailures++;
            return next(new Error('unauthorized'));
        }
    });
}
// Namespaces for isolation
const collabNs = io.of('/collab');
const chatNs = io.of('/chat');
const systemNs = io.of('/system');
function attachHandlers(nsp, label) {
    nsp.on('connection', (socket) => {
        metrics.connections++;
        metrics.rooms = io.sockets.adapter.rooms.size;
        socket.on('disconnect', () => {
            metrics.connections--;
            metrics.rooms = io.sockets.adapter.rooms.size;
        });
        socket.on('join', (room) => {
            if (!rateLimit(socket.id))
                return socket.emit('rate_limited');
            socket.join(room);
            metrics.rooms = io.sockets.adapter.rooms.size;
            socket.emit('joined', { room, namespace: label });
        });
        socket.on('leave', (room) => {
            if (!rateLimit(socket.id))
                return socket.emit('rate_limited');
            socket.leave(room);
            metrics.rooms = io.sockets.adapter.rooms.size;
            socket.emit('left', { room, namespace: label });
        });
        socket.on('message', (payload) => {
            if (!rateLimit(socket.id))
                return socket.emit('rate_limited');
            metrics.messagesIn++;
            // Broadcast to room if specifying {room}
            if (typeof payload === 'object' && payload && payload.room) {
                const { room, data } = payload;
                socket.to(room).emit('message', { namespace: label, room, data });
                metrics.messagesOut++;
            }
            else {
                socket.broadcast.emit('message', { namespace: label, data: payload });
                metrics.messagesOut++;
            }
        });
    });
}
attachHandlers(collabNs, 'collab');
attachHandlers(chatNs, 'chat');
attachHandlers(systemNs, 'system');
// Root namespace (fallback/general)
io.on('connection', (socket) => {
    metrics.connections++;
    metrics.rooms = io.sockets.adapter.rooms.size;
    socket.on('disconnect', () => {
        metrics.connections--;
        metrics.rooms = io.sockets.adapter.rooms.size;
    });
    socket.on('join', (room) => {
        socket.join(room);
        metrics.rooms = io.sockets.adapter.rooms.size;
        socket.emit('joined', room);
    });
    socket.on('leave', (room) => {
        socket.leave(room);
        metrics.rooms = io.sockets.adapter.rooms.size;
        socket.emit('left', room);
    });
    socket.on('message', (payload) => {
        if (!rateLimit(socket.id))
            return socket.emit('rate_limited');
        metrics.messagesIn++;
        socket.broadcast.emit('message', { namespace: 'root', data: payload });
        metrics.messagesOut++;
    });
});
httpServer.listen(PORT, HOST, () => {
    // eslint-disable-next-line no-console
    console.log(`Websocket server listening on http://${HOST}:${PORT}`);
});
// Optional: Push metrics to Prometheus Pushgateway
async function pushMetrics() {
    if (!PUSHGATEWAY_URL)
        return;
    const upSeconds = (Date.now() - metrics.startedAt) / 1000;
    const body = [
        `websocket_connections ${metrics.connections}`,
        `websocket_messages_in_total ${metrics.messagesIn}`,
        `websocket_messages_out_total ${metrics.messagesOut}`,
        `websocket_auth_failures_total ${metrics.authFailures}`,
        `websocket_rate_limited_total ${metrics.rateLimited}`,
        `websocket_rooms ${metrics.rooms}`,
        `websocket_process_uptime_seconds ${upSeconds}`
    ].join('\n') + '\n';
    try {
        await fetch(`${PUSHGATEWAY_URL}/metrics/job/${encodeURIComponent(PROMETHEUS_JOB_NAME)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body,
        });
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to push metrics:', err.message);
    }
}
if (PUSHGATEWAY_URL) {
    setInterval(pushMetrics, METRICS_PUSH_INTERVAL_MS);
}
