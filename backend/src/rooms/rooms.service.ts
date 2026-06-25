import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Room } from '../database/entities/room.entity';
import { User } from '../database/entities/user.entity';
import { Participant } from '../database/entities/participant.entity';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Participant)
    private participantRepository: Repository<Participant>
  ) {}

  async createRoom(createdBy: string): Promise<Room> {
    const userId = uuidv4();

    let user = await this.userRepository.findOne({ where: { username: createdBy } });
    if (!user) {
      user = this.userRepository.create({
        id: userId,
        username: createdBy,
      });
      await this.userRepository.save(user);
    }

    const room = this.roomRepository.create({
      id: uuidv4(),
      roomName: `Meeting - ${new Date().toLocaleString()}`,
      createdById: user.id,
      isActive: true,
    });

    return this.roomRepository.save(room);
  }

  async joinRoom(roomId: string, username: string): Promise<Participant> {
    let user = await this.userRepository.findOne({ where: { username } });
    if (!user) {
      user = this.userRepository.create({
        id: uuidv4(),
        username,
      });
      await this.userRepository.save(user);
    }

    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (!room) {
      // Auto-create the room if it doesn't exist yet (e.g. joined via direct link)
      const newRoom = this.roomRepository.create({
        id: roomId,
        roomName: `Meeting - ${new Date().toLocaleString()}`,
        createdById: user.id,
        isActive: true,
      });
      await this.roomRepository.save(newRoom);
    }

    const existingParticipant = await this.participantRepository.findOne({
      where: { roomId, userId: user.id },
    });

    if (existingParticipant && !existingParticipant.leftAt) {
      return existingParticipant;
    }

    const participant = this.participantRepository.create({
      id: uuidv4(),
      roomId,
      userId: user.id,
    });

    return this.participantRepository.save(participant);
  }

  async leaveRoom(roomId: string, userId: string): Promise<void> {
    const participant = await this.participantRepository.findOne({
      where: { roomId, userId, leftAt: null },
    });

    if (participant) {
      participant.leftAt = new Date();
      await this.participantRepository.save(participant);
    }

    const activeParticipants = await this.participantRepository.find({
      where: { roomId, leftAt: null },
    });

    if (activeParticipants.length === 0) {
      const room = await this.roomRepository.findOne({ where: { id: roomId } });
      if (room) {
        room.isActive = false;
        room.endedAt = new Date();
        await this.roomRepository.save(room);
      }
    }
  }

  async getRoom(roomId: string): Promise<Room> {
    return this.roomRepository.findOne({
      where: { id: roomId },
      relations: ['participants', 'participants.user'],
    });
  }

  async getRoomParticipants(roomId: string): Promise<Participant[]> {
    return this.participantRepository.find({
      where: { roomId, leftAt: null },
      relations: ['user'],
    });
  }
}
