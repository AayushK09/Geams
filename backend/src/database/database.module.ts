import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { User } from './entities/user.entity';
import { Room } from './entities/room.entity';
import { Participant } from './entities/participant.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: process.env.DATABASE_URL || './data/meetings.db',
      entities: [User, Room, Participant],
      synchronize: true,
      logging: false,
    }),
    TypeOrmModule.forFeature([User, Room, Participant]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
