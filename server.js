const WebSocket = require('ws');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { log } = require('./middleware/logger');
const db = require('./db');
const { createUser, getUser, updateUser, deleteUser } = require('./handlers/userHandler');
const { registerUser, generateToken, verifyToken } = require('./handlers/authHandler');
require('dotenv').config();

const PORT = process.env.API_PORT || 3000;

const server = https.createServer({
  cert: fs.readFileSync(path.join(__dirname, './cert/server.crt')),
  key: fs.readFileSync(path.join(__dirname, './cert/server.key')),
});

const wss = new WebSocket.Server({ server });

server.listen(PORT, () => {
  console.log(`Secure WebSocket server running on wss://localhost:${PORT}`);
  log(`Server started on wss://localhost:${PORT}`);
});

wss.on('connection', (ws, req) => {
  const client_ip = req.socket.remoteAddress;
  const client_agent = req.headers['user-agent'];
  log(`Connection from ${client_ip}, Agent: ${client_agent}`);

  ws.on('message', async message => {
    try {
      const msg = JSON.parse(message);
      const { channel, payload, apiToken } = msg;
      let response;

      if (channel.startsWith('auth/')) {
        switch (channel) {
          case 'auth/register':
            response = await registerUser(payload);
            break;
          case 'auth/generateToken':
            response = await generateToken({ ...payload, client_ip, client_agent });
            break;
          default:
            response = { error: 'Invalid auth channel' };
        }
      } else {
        const userId = await verifyToken(apiToken);
        if (!userId) {
          ws.send(JSON.stringify({ error: 'Unauthorized or expired token' }));
          log(`Unauthorized request from ${client_ip} with token: ${apiToken}`);
          return;
        }

        switch (channel) {
          case 'user/create':
            response = await createUser(payload);
            break;
          case 'user/read':
            response = await getUser(payload.id);
            break;
          case 'user/update':
            response = await updateUser(payload);
            break;
          case 'user/delete':
            response = await deleteUser(payload.id);
            break;
          default:
            response = { error: 'Invalid channel' };
        }
      }

      ws.send(JSON.stringify(response));
      log(`Handled ${channel} request from ${client_ip}`);
    } catch (err) {
      ws.send(JSON.stringify({ error: err.message }));
      log(`Error handling message: ${err.message}`);
    }
  });
});
