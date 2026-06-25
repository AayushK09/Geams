import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Participant } from './participant.entity';

@Entity('rooms')
export class Room {
  @PrimaryColumn('text')
  id: string;

  @Column()
  roomName: string;

  @Column()
  createdById: string;

  @ManyToOne(() => User, (user) => user.createdRooms)
  @JoinColumn({ name: 'createdById' })
  creator: User;

  @Column({ default: false })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  endedAt: Date;

  @OneToMany(() => Participant, (participant) => participant.room)
  participants: Participant[];
}
