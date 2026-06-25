# Changelog

## [Unreleased] - 2026-06-25

### Fixed

#### Duplicate Participant Bug

When a user joined a meeting, their tile appeared twice in the video grid.

**Root Causes & Fixes:**

1. **`participant-joined` broadcast to self**
   - `server.to(roomId).emit(...)` sent the event to everyone including the joining client
   - The joining client added themselves to the remote participants list, on top of the existing local tile
   - **Fix:** Changed to `client.broadcast.to(roomId).emit(...)` so only _other_ users receive the event
   - File: `backend/src/websocket/signaling.gateway.ts`

2. **`join-room-response` included self**
   - The `otherParticipants` list sent back to the joining client included the joining user themselves
   - **Fix:** Added `.filter(([id]) => id !== participantId)` to exclude self from the list
   - File: `backend/src/websocket/signaling.gateway.ts`

3. **Frontend ignored `join-room-response`**
   - No handler existed for `join-room-response`, so existing room participants were never loaded when joining
   - **Fix:** Added handler to populate participants state from `join-room-response` data
   - File: `frontend/components/MeetingRoom.tsx`

4. **No duplicate guard on `participant-joined`**
   - No check prevented adding a participant that was already in the list
   - **Fix:** Added dedup check `if (prev.find((p) => p.id === data.id)) return prev`
   - File: `frontend/components/MeetingRoom.tsx`

5. **`participant-left` payload mismatch**
   - Backend emits `{ participantId }` (object) but frontend expected a plain string
   - Caused participants to not be removed from the grid when someone left
   - **Fix:** Handler now accepts both shapes: `typeof data === 'string' ? data : data.participantId`
   - File: `frontend/components/MeetingRoom.tsx`

---

### Fixed

#### Participants Not Saved to Database

The `participants` table was always empty — the `SignalingGateway` only managed in-memory state and never called the database layer.

**Root Causes & Fixes:**

1. **`handleJoinRoom` never called `RoomsService.joinRoom()`**
   - Join events were tracked only in a `Map<string, RoomState>` in memory
   - **Fix:** Now calls `roomsService.joinRoom(roomId, username)` on every socket join, which creates/finds the `User` row and inserts a `Participant` row with `joinedAt` timestamp
   - The DB-generated `participantId` is now used as the canonical ID instead of a locally generated UUID
   - File: `backend/src/websocket/signaling.gateway.ts`

2. **`handleLeaveRoom` never called `RoomsService.leaveRoom()`**
   - Leaving a room only removed the participant from the in-memory map
   - **Fix:** Now calls `roomsService.leaveRoom(roomId, userId)` to set `leftAt` timestamp in DB
   - File: `backend/src/websocket/signaling.gateway.ts`

3. **`handleDisconnect` never called `RoomsService.leaveRoom()`**
   - Abrupt disconnects (browser close, network drop) were not recorded in DB
   - **Fix:** Now calls `roomsService.leaveRoom()` for every participant whose socket disconnects
   - File: `backend/src/websocket/signaling.gateway.ts`

4. **`RoomsService.joinRoom()` threw on missing room**
   - If a user joined via direct link (room not pre-created through the REST API), the service threw `Room not found`, crashing the socket join
   - **Fix:** Room is now auto-created if it doesn't exist in DB
   - File: `backend/src/rooms/rooms.service.ts`

---

### Removed

#### Recording Feature (complete removal)

The meeting recording feature was fully removed from the codebase.

**Backend:**

- Deleted `backend/src/recording/` module (controller, service, module files)
- Deleted `backend/src/database/entities/recording.entity.ts`
- Removed `RecordingModule` from `backend/src/app.module.ts`
- Removed `Recording` entity and relationship from `backend/src/database/entities/room.entity.ts`
- Removed `RecordingService` injection and all recording Socket.IO event handlers from `backend/src/websocket/signaling.gateway.ts`
- Removed `fluent-ffmpeg` dependency from `backend/package.json`
- Removed FFmpeg installation from `backend/Dockerfile`

**Frontend:**

- Removed `recordingApi` from `frontend/services/api.ts`
- Removed `recording` state and `setRecording` from `frontend/store/mediaStore.ts`
- Removed `isRecording` state, `toggleRecording()` function, and Socket.IO recording events from `frontend/components/MeetingRoom.tsx`
- Removed recording button and `isRecording` prop from `frontend/components/MeetingControls.tsx`

**Configuration:**

- Removed `RECORDING_DIR` and `FFMPEG_PATH` environment variables from `docker-compose.yml`
- Removed recordings volume mounts and volume definition from `docker-compose.yml`
- Removed recording variables from `.env.example`
- Deleted root `recordings/` directory

**Documentation updated:** `README.md`, `API.md`, `QUICKSTART.md`, `DEPLOYMENT.md`, `TROUBLESHOOTING.md`, `FILE_INDEX.md`, `IMPLEMENTATION_SUMMARY.md`, `DELIVERY_CHECKLIST.md`, `NEXT_STEPS.md`, `self_hosted_webrtc_meeting_platform_design_document.md`

---

### Fixed

#### Dependency Conflicts (`npm install` errors)

- Upgraded `@nestjs/typeorm` from `^9.0.1` → `^10.0.0` in `backend/package.json`
  - v9 only supports NestJS 8/9; project uses NestJS 10
- Removed `@nestjs/platform-socket.io@^11.1.23` and `@nestjs/typeorm` from root `package.json`
  - These are backend-only packages and do not belong in the root workspace
- Added `@nestjs/platform-socket.io@^10.2.0` to `backend/package.json`
- Fixed trailing comma (invalid JSON) in root `package.json`
