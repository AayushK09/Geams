import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomsModule } from './rooms/rooms.module';
import { MediasoupModule } from './mediasoup/mediasoup.module';
import { SignalingGateway } from './websocket/signaling.gateway';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    DatabaseModule,
    RoomsModule,
    MediasoupModule,
  ],
  controllers: [HealthController],
  providers: [SignalingGateway],
})
export class AppModule {}
