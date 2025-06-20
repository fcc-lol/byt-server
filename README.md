# Byt Server

Identifier: byt-server

Created: Fri Jun 20 14:54:56 UTC 2025

### API

#### Send Notification

- **Endpoint**: `POST /notify`
- **Content-Type**: `application/json`
- **Description**: Sends a notification to all connected clients
- **Request Body**: Any JSON object that represents your notification
- **Example Request**:
  ```bash
  curl -X POST http://localhost:3000/notify \
    -H "Content-Type: application/json" \
    -d '{
      "title": "New Message",
      "message": "You have a new message",
      "type": "info",
      "data": {
        "userId": "123",
        "messageId": "456"
      }
    }'
  ```
- **Success Response**:
  ```json
  {
    "message": "Notification sent successfully",
    "recipients": 2
  }
  ```
- **Error Response**:
  ```json
  {
    "error": "Failed to send notification",
    "message": "Error details..."
  }
  ```

#### Health Check

- `GET /health`: Check server status
  ```json
  {
    "status": "healthy",
    "connections": 2,
    "uptime": 3600
  }
  ```

### Socket.IO Events

Connect to the Socket.IO server using:

```javascript
// Browser
<script src="https://cdn.socket.io/4.7.4/socket.io.min.js"></script>
<script>
  const socket = io('http://localhost:3000');

  // Listen for notifications
  socket.on('notification', (data) => {
    console.log('Received notification:', data);
  });

  // Listen for connection status
  socket.on('connection_status', (data) => {
    console.log('Connection status:', data);
  });
</script>

// Node.js
import { io } from 'socket.io-client';
const socket = io('http://localhost:3000');
```

Available events:

- `connection_status`: Received upon successful connection
- `notification`: Received when a notification is sent via `/notify` endpoint
- `message`: Received when another client sends a message
- `error`: Received when an error occurs

## Note on ES Modules

This project uses ES Modules (`import`/`export`) instead of CommonJS (`require`). This means:

- All imports use the `import` syntax
- The `package.json` includes `"type": "module"`
- You can use top-level `await` if needed
- When importing local files, you need to use the `.js` extension
