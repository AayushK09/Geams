import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RoomsService } from '../rooms/rooms.service';
import { MediasoupService } from '../mediasoup/mediasoup.service';
import { v4 as uuidv4 } from 'uuid';

interface RoomState {
  roomId: string;
  participants: Map<string, ParticipantState>;
}

interface ParticipantState {
  socketId: string;
  username: string;
  userId: string;
  producerIds: string[];
  consumerIds: string[];
}

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
})
@Injectable()
export class SignalingGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SignalingGateway.name);
  private rooms: Map<string, RoomState> = new Map();
  private participantSockets: Map<string, string> = new Map();

  constructor(
    private roomsService: RoomsService,
    private mediasoupService: MediasoupService
  ) {}

  async onModuleInit() {
    await this.mediasoupService.initializeWorkers();
    this.logger.log('Mediasoup initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    for (const [roomId, room] of this.rooms.entries()) {
      for (const [participantId, participant] of room.participants.entries()) {
        if (participant.socketId === client.id) {
          room.participants.delete(participantId);
          this.server.to(roomId).emit('participant-left', { participantId });

          // Persist leave time to DB
          this.roomsService
            .leaveRoom(roomId, participant.userId)
            .catch((err) => this.logger.error(`Failed to update leaveRoom in DB: ${err}`));

          if (room.participants.size === 0) {
            this.rooms.delete(roomId);
          }
        }
      }
    }
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; username: string }
  ) {
    const { roomId, username } = data;

    // Persist participant join to DB and get stable userId
    const dbParticipant = await this.roomsService.joinRoom(roomId, username);
    const participantId = dbParticipant.id;

    client.join(roomId);
    this.participantSockets.set(participantId, client.id);

    let room = this.rooms.get(roomId);
    if (!room) {
      room = {
        roomId,
        participants: new Map(),
      };
      this.rooms.set(roomId, room);
    }

    room.participants.set(participantId, {
      socketId: client.id,
      username,
      userId: dbParticipant.userId,
      producerIds: [],
      consumerIds: [],
    });

    // Only include participants OTHER than the one just joining
    const otherParticipants = Array.from(room.participants.entries())
      .filter(([id]) => id !== participantId)
      .map(([id, participant]) => ({
        id,
        username: participant.username,
        socketId: participant.socketId,
        producerIds: participant.producerIds,
      }));

    client.emit('join-room-response', {
      participantId,
      participants: otherParticipants,
    });

    // Broadcast only to OTHER clients in the room (not the joining client)
    client.broadcast.to(roomId).emit('participant-joined', {
      id: participantId,
      username,
    });

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
      const participant = room.participants.get(participantId);
      if (participant) {
        // Persist leave time to DB
        await this.roomsService
          .leaveRoom(roomId, participant.userId)
          .catch((err) => this.logger.error(`Failed to update leaveRoom in DB: ${err}`));
      }
      room.participants.delete(participantId);
      this.server.to(roomId).emit('participant-left', { participantId });

      if (room.participants.size === 0) {
        this.rooms.delete(roomId);
      }
    }

    client.leave(roomId);
    this.logger.log(`Participant ${participantId} left room ${roomId}`);
  }

  @SubscribeMessage('get-rtp-capabilities')
  async handleGetRtpCapabilities(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string }
  ) {
    try {
      const rtpCapabilities = await this.mediasoupService.getRouterRtpCapabilities(data.roomId);
      client.emit('rtp-capabilities', { rtpCapabilities });
    } catch (err) {
      this.logger.error(`Failed to get RTP capabilities: ${err}`);
      client.emit('error', { message: 'Failed to get RTP capabilities' });
    }
  }

  @SubscribeMessage('create-transport')
  async handleCreateTransport(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      roomId: string;
      participantId: string;
      direction: 'send' | 'recv';
    }
  ) {
    try {
      const { roomId, participantId, direction } = data;

      const transport = await this.mediasoupService.createWebRtcTransport(roomId);

      const transportId = uuidv4();
      this.mediasoupService.storeTransport(transportId, transport);

      client.emit('transport-created', {
        transportId,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
        direction,
      });

      this.logger.debug(`Created ${direction} transport for ${participantId} in ${roomId}`);
    } catch (err) {
      this.logger.error(`Failed to create transport: ${err}`);
      client.emit('error', { message: 'Failed to create transport' });
    }
  }

  @SubscribeMessage('connect-transport')
  async handleConnectTransport(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      transportId: string;
      dtlsParameters: any;
    }
  ) {
    try {
      const { transportId, dtlsParameters } = data;

      const transport = this.mediasoupService.getTransport(transportId);
      if (!transport) {
        throw new Error('Transport not found');
      }

      await transport.connect({ dtlsParameters });
      this.logger.debug(`Transport ${transportId} connected`);
      return {};
    } catch (err) {
      this.logger.error(`Failed to connect transport: ${err}`);
      return { error: err.message };
    }
  }

  @SubscribeMessage('produce')
  async handleProduce(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      transportId: string;
      kind: 'audio' | 'video';
      rtpParameters: any;
      roomId: string;
      participantId: string;
      appData?: Record<string, any>;
    }
  ) {
    try {
      const { transportId, kind, rtpParameters, roomId, participantId, appData } = data;

      const transport = this.mediasoupService.getTransport(transportId);
      if (!transport) {
        throw new Error('Transport not found');
      }

      const producer = await this.mediasoupService.createProducer(transport, kind, rtpParameters);

      const producerId = producer.id;
      this.mediasoupService.storeProducer(producerId, producer);

      const room = this.rooms.get(roomId);
      if (room && room.participants.has(participantId)) {
        room.participants.get(participantId).producerIds.push(producerId);
      }

      // Notify others (not the producer themselves)
      client.broadcast.to(roomId).emit('new-producer', {
        producerId,
        participantId,
        kind,
        appData: appData || {},
      });

      this.logger.debug(`Producer ${producerId} created for ${kind} in ${roomId}`);
      return { producerId };
    } catch (err) {
      this.logger.error(`Failed to produce: ${err}`);
      return { error: err.message };
    }
  }

  @SubscribeMessage('consume')
  async handleConsume(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      transportId: string;
      producerId: string;
      rtpCapabilities: any;
      roomId: string;
      participantId: string;
    }
  ) {
    try {
      const { transportId, producerId, rtpCapabilities, roomId, participantId } = data;

      const transport = this.mediasoupService.getTransport(transportId);
      const router = this.mediasoupService.getRouter(roomId);

      if (!transport || !router) {
        throw new Error('Transport or router not found');
      }

      const consumer = await this.mediasoupService.createConsumer(
        transport,
        router,
        producerId,
        rtpCapabilities
      );

      const consumerId = consumer.id;
      this.mediasoupService.storeConsumer(consumerId, consumer);

      const room = this.rooms.get(roomId);
      if (room && room.participants.has(participantId)) {
        room.participants.get(participantId).consumerIds.push(consumerId);
      }

      client.emit('consume-response', {
        consumerId,
        producerId,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
        paused: consumer.paused,
      });

      this.logger.debug(`Consumer ${consumerId} created for producer ${producerId}`);
      return {
        consumerId,
        producerId,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
        paused: consumer.paused,
      };
    } catch (err) {
      this.logger.error(`Failed to consume: ${err}`);
      return { error: err.message };
    }
  }

  @SubscribeMessage('resume-consumer')
  async handleResumeConsumer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { consumerId: string }
  ) {
    try {
      const { consumerId } = data;
      const consumer = this.mediasoupService.getConsumer(consumerId);

      if (consumer && consumer.paused) {
        await consumer.resume();
      }

      client.emit('consumer-resumed', { consumerId });
    } catch (err) {
      this.logger.error(`Failed to resume consumer: ${err}`);
    }
  }

  @SubscribeMessage('camera-toggle')
  async handleCameraToggle(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; participantId: string; enabled: boolean }
  ) {
    const { roomId, participantId, enabled } = data;
    this.server.to(roomId).emit('camera-toggled', {
      participantId,
      enabled,
    });
  }

  @SubscribeMessage('mic-toggle')
  async handleMicToggle(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; participantId: string; enabled: boolean }
  ) {
    const { roomId, participantId, enabled } = data;
    this.server.to(roomId).emit('mic-toggled', {
      participantId,
      enabled,
    });
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; user: string; text: string }
  ) {
    const { roomId, user, text } = data;
    client.broadcast.to(roomId).emit('chat-message', {
      user,
      text,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('screen-share-start')
  async handleScreenShareStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; participantId: string }
  ) {
    const { roomId, participantId } = data;
    this.server.to(roomId).emit('screen-share-started', { participantId });
  }

  @SubscribeMessage('screen-share-stop')
  async handleScreenShareStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; participantId: string }
  ) {
    const { roomId, participantId } = data;
    this.server.to(roomId).emit('screen-share-stopped', { participantId });
  }
}
