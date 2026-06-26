import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RoomsService } from '../rooms/rooms.service';

interface ParticipantState {
  socketId: string;
  username: string;
  userId: string;
  participantId: string;
}

interface RoomState {
  roomId: string;
  participants: Map<string, ParticipantState>;
}

@WebSocketGateway({
  cors: { origin: '*', methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling'],
})
@Injectable()
export class SignalingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SignalingGateway.name);
  private rooms: Map<string, RoomState> = new Map();
  private socketToParticipant: Map<string, string> = new Map();
  private participantToRoom: Map<string, string> = new Map();

  constructor(private roomsService: RoomsService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const participantId = this.socketToParticipant.get(client.id);
    if (!participantId) return;
    const roomId = this.participantToRoom.get(participantId);
    if (roomId) {
      const room = this.rooms.get(roomId);
      if (room) {
        const p = room.participants.get(participantId);
        if (p) {
          this.roomsService.leaveRoom(roomId, p.userId).catch((e) => this.logger.error(e));
        }
        room.participants.delete(participantId);
        this.server.to(roomId).emit('participant-left', { participantId });
        if (room.participants.size === 0) this.rooms.delete(roomId);
      }
      this.participantToRoom.delete(participantId);
    }
    this.socketToParticipant.delete(client.id);
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; username: string }
  ) {
    const { roomId, username } = data;
    const dbParticipant = await this.roomsService.joinRoom(roomId, username);
    const participantId = dbParticipant.id;

    client.join(roomId);
    this.socketToParticipant.set(client.id, participantId);
    this.participantToRoom.set(participantId, roomId);

    let room = this.rooms.get(roomId);
    if (!room) {
      room = { roomId, participants: new Map() };
      this.rooms.set(roomId, room);
    }
    room.participants.set(participantId, {
      socketId: client.id,
      username,
      userId: dbParticipant.userId,
      participantId,
    });

    const others = Array.from(room.participants.values())
      .filter((p) => p.participantId !== participantId)
      .map((p) => ({ id: p.participantId, username: p.username }));

    client.emit('join-room-response', { participantId, participants: others });
    client.broadcast.to(roomId).emit('participant-joined', { id: participantId, username });
    this.logger.log(`${username} joined room ${roomId}`);
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; participantId: string }
  ) {
    const { roomId, participantId } = data;
    const room = this.rooms.get(roomId);
    if (room) {
      const p = room.participants.get(participantId);
      if (p) await this.roomsService.leaveRoom(roomId, p.userId).catch((e) => this.logger.error(e));
      room.participants.delete(participantId);
      this.server.to(roomId).emit('participant-left', { participantId });
      if (room.participants.size === 0) this.rooms.delete(roomId);
    }
    client.leave(roomId);
    this.participantToRoom.delete(participantId);
    this.socketToParticipant.delete(client.id);
  }

  // ── WebRTC P2P Signaling ──────────────────────────────────────────────────

  @SubscribeMessage('webrtc-offer')
  handleOffer(
    @ConnectedSocket() _client: Socket,
    @MessageBody() data: { roomId: string; toParticipantId: string; fromParticipantId: string; sdp: any }
  ) {
    const target = this.rooms.get(data.roomId)?.participants.get(data.toParticipantId);
    if (target) {
      this.server.to(target.socketId).emit('webrtc-offer', {
        fromParticipantId: data.fromParticipantId,
        sdp: data.sdp,
      });
    }
  }

  @SubscribeMessage('webrtc-answer')
  handleAnswer(
    @ConnectedSocket() _client: Socket,
    @MessageBody() data: { roomId: string; toParticipantId: string; fromParticipantId: string; sdp: any }
  ) {
    const target = this.rooms.get(data.roomId)?.participants.get(data.toParticipantId);
    if (target) {
      this.server.to(target.socketId).emit('webrtc-answer', {
        fromParticipantId: data.fromParticipantId,
        sdp: data.sdp,
      });
    }
  }

  @SubscribeMessage('webrtc-ice-candidate')
  handleIceCandidate(
    @ConnectedSocket() _client: Socket,
    @MessageBody() data: { roomId: string; toParticipantId: string; fromParticipantId: string; candidate: any }
  ) {
    const target = this.rooms.get(data.roomId)?.participants.get(data.toParticipantId);
    if (target) {
      this.server.to(target.socketId).emit('webrtc-ice-candidate', {
        fromParticipantId: data.fromParticipantId,
        candidate: data.candidate,
      });
    }
  }

  // ── Chat & UI ────────────────────────────────────────────────────────────

  @SubscribeMessage('send-message')
  handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; user: string; text: string }
  ) {
    client.broadcast.to(data.roomId).emit('chat-message', {
      user: data.user,
      text: data.text,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('camera-toggle')
  handleCameraToggle(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; participantId: string; enabled: boolean }
  ) {
    client.broadcast.to(data.roomId).emit('camera-toggled', {
      participantId: data.participantId,
      enabled: data.enabled,
    });
  }

  @SubscribeMessage('mic-toggle')
  handleMicToggle(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; participantId: string; enabled: boolean }
  ) {
    client.broadcast.to(data.roomId).emit('mic-toggled', {
      participantId: data.participantId,
      enabled: data.enabled,
    });
  }

  @SubscribeMessage('screen-share-start')
  handleScreenShareStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; participantId: string }
  ) {
    client.broadcast.to(data.roomId).emit('screen-share-started', { participantId: data.participantId });
  }

  @SubscribeMessage('screen-share-stop')
  handleScreenShareStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; participantId: string }
  ) {
    client.broadcast.to(data.roomId).emit('screen-share-stopped', { participantId: data.participantId });
  }
}
