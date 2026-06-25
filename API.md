# GEAMS API Documentation

## Overview

GEAMS provides RESTful API endpoints and Socket.IO WebSocket events for real-time communication.

## Base URL

- **Development:** `http://localhost:3000`
- **Production:** `https://yourdomain.com`

## Authentication

Currently uses session-based authentication. JWT can be implemented in future versions.

All requests should include:

```
Content-Type: application/json
```

---

## REST API Endpoints

### Rooms API

#### Create Room

Create a new meeting room.

**Endpoint:** `POST /api/rooms/create`

**Request:**

```json
{
  "createdBy": "John Doe"
}
```

**Response:**

```json
{
  "roomId": "550e8400-e29b-41d4-a716-446655440000",
  "roomName": "Meeting - 12/20/2024 2:30:45 PM",
  "createdAt": "2024-12-20T14:30:45.000Z"
}
```

**Status Codes:**

- `200` - Success
- `400` - Invalid input
- `500` - Server error

---

#### Get Room Info

Get information about a meeting room.

**Endpoint:** `GET /api/rooms/:roomId`

**Parameters:**

- `roomId` (path) - Room ID

**Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "roomName": "Meeting - 12/20/2024 2:30:45 PM",
  "isActive": true,
  "participants": [
    {
      "id": "user-1",
      "username": "John Doe",
      "joinedAt": "2024-12-20T14:35:00.000Z"
    },
    {
      "id": "user-2",
      "username": "Jane Smith",
      "joinedAt": "2024-12-20T14:35:30.000Z"
    }
  ]
}
```

**Status Codes:**

- `200` - Success
- `404` - Room not found
- `500` - Server error

---

#### Join Room

Join an existing meeting room.

**Endpoint:** `POST /api/rooms/:roomId/join`

**Parameters:**

- `roomId` (path) - Room ID

**Request:**

```json
{
  "username": "Jane Smith"
}
```

**Response:**

```json
{
  "participantId": "participant-123",
  "joinedAt": "2024-12-20T14:35:00.000Z"
}
```

**Status Codes:**

- `200` - Success
- `404` - Room not found
- `400` - Invalid input
- `500` - Server error

---

#### Leave Room

Leave a meeting room.

**Endpoint:** `POST /api/rooms/:roomId/leave`

**Parameters:**

- `roomId` (path) - Room ID

**Request:**

```json
{
  "userId": "user-1"
}
```

**Response:**

```json
{
  "message": "Left room successfully"
}
```

**Status Codes:**

- `200` - Success
- `404` - Room or participant not found
- `500` - Server error

---

### Health Check

#### Server Health

Check if server is running.

**Endpoint:** `GET /health`

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2024-12-20T14:30:00.000Z",
  "uptime": 3600
}
```

**Status Codes:**

- `200` - Healthy
- `503` - Unhealthy

---

## Socket.IO WebSocket Events

### Client → Server Events

#### join-room

Join a meeting room.

**Emit:**

```javascript
socket.emit('join-room', {
  roomId: 'room-id',
  username: 'John Doe',
});
```

**Listen for response:**

```javascript
socket.on('join-room-response', (data) => {
  console.log('Participant ID:', data.participantId);
  console.log('Other participants:', data.participants);
});
```

---

#### leave-room

Leave a meeting room.

**Emit:**

```javascript
socket.emit('leave-room', {
  roomId: 'room-id',
  participantId: 'participant-id',
});
```

---

#### create-transport

Create a WebRTC transport.

**Emit:**

```javascript
socket.emit('create-transport', {
  roomId: 'room-id',
  participantId: 'participant-id',
  direction: 'send', // or 'recv'
});
```

**Listen for response:**

```javascript
socket.on('transport-created', (data) => {
  console.log('Transport ID:', data.transportId);
  console.log('ICE Parameters:', data.iceParameters);
  console.log('DTLS Parameters:', data.dtlsParameters);
});
```

---

#### connect-transport

Connect a WebRTC transport.

**Emit:**

```javascript
socket.emit('connect-transport', {
  transportId: 'transport-id',
  dtlsParameters: dtlsParams,
});
```

**Listen for response:**

```javascript
socket.on('transport-connected', (data) => {
  console.log('Transport connected:', data.transportId);
});
```

---

#### produce

Start producing audio/video.

**Emit:**

```javascript
socket.emit('produce', {
  transportId: 'transport-id',
  kind: 'video', // 'audio' or 'video'
  rtpParameters: rtpParams,
  roomId: 'room-id',
  participantId: 'participant-id',
});
```

**Listen for response:**

```javascript
socket.on('produce-response', (data) => {
  console.log('Producer ID:', data.producerId);
});
```

---

#### consume

Start consuming audio/video from another participant.

**Emit:**

```javascript
socket.emit('consume', {
  transportId: 'transport-id',
  producerId: 'producer-id',
  rtpCapabilities: rtpCaps,
  roomId: 'room-id',
  participantId: 'participant-id',
});
```

**Listen for response:**

```javascript
socket.on('consume-response', (data) => {
  console.log('Consumer ID:', data.consumerId);
  console.log('RTP Parameters:', data.rtpParameters);
});
```

---

#### send-message

Send a chat message.

**Emit:**

```javascript
socket.emit('send-message', {
  roomId: 'room-id',
  user: 'John Doe',
  text: 'Hello everyone!',
});
```

**Broadcast event:**

```javascript
socket.on('chat-message', (data) => {
  console.log(`${data.user}: ${data.text}`);
});
```

---

#### camera-toggle

Toggle camera on/off.

**Emit:**

```javascript
socket.emit('camera-toggle', {
  roomId: 'room-id',
  participantId: 'participant-id',
  enabled: true,
});
```

**Broadcast event:**

```javascript
socket.on('camera-toggled', (data) => {
  console.log(`${data.participantId} camera:`, data.enabled ? 'on' : 'off');
});
```

---

#### mic-toggle

Toggle microphone on/off.

**Emit:**

```javascript
socket.emit('mic-toggle', {
  roomId: 'room-id',
  participantId: 'participant-id',
  enabled: true,
});
```

**Broadcast event:**

```javascript
socket.on('mic-toggled', (data) => {
  console.log(`${data.participantId} mic:`, data.enabled ? 'on' : 'off');
});
```

---

#### screen-share-start

Start screen sharing.

**Emit:**

```javascript
socket.emit('screen-share-start', {
  roomId: 'room-id',
  participantId: 'participant-id',
});
```

**Broadcast event:**

```javascript
socket.on('screen-share-started', (data) => {
  console.log(`${data.participantId} started screen share`);
});
```

---

#### screen-share-stop

Stop screen sharing.

**Emit:**

```javascript
socket.emit('screen-share-stop', {
  roomId: 'room-id',
  participantId: 'participant-id',
});
```

**Broadcast event:**

```javascript
socket.on('screen-share-stopped', (data) => {
  console.log(`${data.participantId} stopped screen share`);
});
```

---

### Server → Client Events

#### participant-joined

Broadcast when a new participant joins.

**Listen:**

```javascript
socket.on('participant-joined', (data) => {
  console.log(`${data.username} joined`);
});
```

---

#### participant-left

Broadcast when a participant leaves.

**Listen:**

```javascript
socket.on('participant-left', (data) => {
  console.log(`Participant ${data.participantId} left`);
});
```

---

#### new-producer

Notify about new media producer.

**Listen:**

```javascript
socket.on('new-producer', (data) => {
  console.log(`New ${data.kind} producer:`, data.producerId);
});
```

---

#### error

Error event from server.

**Listen:**

```javascript
socket.on('error', (data) => {
  console.error('Error:', data.message);
});
```

---

## Error Responses

All error responses follow this format:

```json
{
  "statusCode": 400,
  "timestamp": "2024-12-20T14:30:00.000Z",
  "path": "/api/rooms/invalid-id",
  "method": "GET",
  "error": "BadRequestException",
  "message": "Invalid room ID"
}
```

### Common Error Codes

| Code | Meaning                            |
| ---- | ---------------------------------- |
| 400  | Bad Request - Invalid input        |
| 404  | Not Found - Resource doesn't exist |
| 500  | Internal Server Error              |
| 503  | Service Unavailable                |

---

## Rate Limiting

Currently no rate limiting. Add in production:

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

## Example Usage

### Complete Meeting Flow

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

// 1. Join room
socket.emit('join-room', {
  roomId: 'my-meeting',
  username: 'John Doe',
});

socket.on('join-room-response', (data) => {
  console.log('Joined! Participant ID:', data.participantId);

  // 2. Create send transport
  socket.emit('create-transport', {
    roomId: 'my-meeting',
    participantId: data.participantId,
    direction: 'send',
  });
});

socket.on('transport-created', (data) => {
  // 3. Connect transport and produce media...
  socket.emit('connect-transport', {
    transportId: data.transportId,
    dtlsParameters: {}, // from local transport
  });
});

// Listen for other participants
socket.on('participant-joined', (data) => {
  console.log(`${data.username} joined!`);
});

// Send chat message
socket.emit('send-message', {
  roomId: 'my-meeting',
  user: 'John Doe',
  text: 'Hello everyone!',
});

// Start recording
socket.emit('recording-start', {
  roomId: 'my-meeting',
});
```

---

## Testing

### Using cURL

```bash
# Create room
curl -X POST http://localhost:3000/api/rooms/create \
  -H "Content-Type: application/json" \
  -d '{"createdBy": "John Doe"}'

# Get room info
curl http://localhost:3000/api/rooms/room-id

# Health check
curl http://localhost:3000/health
```

### Using Postman

1. Import collection from `/docs/postman-collection.json`
2. Set environment variables
3. Run requests

---

## Versioning

API version is currently `v1` (implied). Future versions will be prefixed:

```
/api/v1/rooms
/api/v2/rooms
```

---

For more examples and detailed implementation, see the frontend and backend source code.
