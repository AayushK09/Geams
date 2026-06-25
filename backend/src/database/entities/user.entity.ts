import { Entity, PrimaryColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Room } from './room.entity';
import { Participant } from './participant.entity';

@Entity('users')
export class User {
  @PrimaryColumn('text')
  id: string;

  @Column()
  username: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Room, (room) => room.creator)
  createdRooms: Room[];

  @OneToMany(() => Participant, (participant) => participant.user)
  participations: Participant[];
}
