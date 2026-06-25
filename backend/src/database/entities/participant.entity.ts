import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Room } from './room.entity';
import { User } from './user.entity';

@Entity('participants')
export class Participant {
  @PrimaryColumn('text')
  id: string;

  @Column()
  roomId: string;

  @Column()
  userId: string;

  @ManyToOne(() => Room, (room) => room.participants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roomId' })
  room: Room;

  @ManyToOne(() => User, (user) => user.participations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  joinedAt: Date;

  @Column({ nullable: true })
  leftAt: Date;
}
