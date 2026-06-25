import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from '../database/entities/room.entity';
import { User } from '../database/entities/user.entity';
import { Participant } from '../database/entities/participant.entity';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Room, User, Participant])],
  providers: [RoomsService],
  controllers: [RoomsController],
  exports: [RoomsService],
})
export class RoomsModule {}
