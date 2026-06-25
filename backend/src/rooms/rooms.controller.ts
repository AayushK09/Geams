import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { RoomsService } from './rooms.service';

@Controller('api/rooms')
export class RoomsController {
  constructor(private roomsService: RoomsService) {}

  @Post('create')
  async createRoom(@Body() data: { createdBy: string }) {
    const room = await this.roomsService.createRoom(data.createdBy);
    return {
      roomId: room.id,
      roomName: room.roomName,
      createdAt: room.createdAt,
    };
  }

  @Get(':roomId')
  async getRoom(@Param('roomId') roomId: string) {
    const room = await this.roomsService.getRoom(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const participants = await this.roomsService.getRoomParticipants(roomId);

    return {
      id: room.id,
      roomName: room.roomName,
      isActive: room.isActive,
      participants: participants.map((p) => ({
        id: p.user.id,
        username: p.user.username,
        joinedAt: p.joinedAt,
      })),
    };
  }

  @Post(':roomId/join')
  async joinRoom(@Param('roomId') roomId: string, @Body() data: { username: string }) {
    const participant = await this.roomsService.joinRoom(roomId, data.username);
    return {
      participantId: participant.id,
      joinedAt: participant.joinedAt,
    };
  }

  @Post(':roomId/leave')
  async leaveRoom(@Param('roomId') roomId: string, @Body() data: { userId: string }) {
    await this.roomsService.leaveRoom(roomId, data.userId);
    return { message: 'Left room successfully' };
  }
}
