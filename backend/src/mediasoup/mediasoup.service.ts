import { Injectable, Logger } from '@nestjs/common';
import * as mediasoup from 'mediasoup';
import { Worker, Router, WebRtcTransport, Producer, Consumer } from 'mediasoup/node/lib/types';

@Injectable()
export class MediasoupService {
  private readonly logger = new Logger(MediasoupService.name);
  private workers: Worker[] = [];
  private routers: Map<string, Router> = new Map();
  private transports: Map<string, WebRtcTransport> = new Map();
  private producers: Map<string, Producer> = new Map();
  private consumers: Map<string, Consumer> = new Map();

  async initializeWorkers() {
    const numWorkers = parseInt(process.env.MEDIASOUP_NUM_WORKERS || '1');

    for (let i = 0; i < numWorkers; i++) {
      await this.createWorker(i);
    }
  }

  private async createWorker(index: number): Promise<Worker> {
    const worker = await mediasoup.createWorker({
      logLevel: (process.env.MEDIASOUP_WORKER_LOG_LEVEL as any) || 'warn',
      logTags: ['rtp', 'rtcp', 'rtx', 'bwe'],
      rtcMinPort: 40000 + index * 1000,
      rtcMaxPort: 40000 + index * 1000 + 999,
    });

    worker.on('died', async () => {
      this.logger.error(`mediasoup Worker died [pid:${worker.pid}], restarting...`);
      // Remove dead worker
      this.workers = this.workers.filter((w) => w !== worker);
      // Clear any routers that used this worker
      for (const [roomId, router] of this.routers.entries()) {
        if ((router as any).appData?.workerPid === worker.pid) {
          this.routers.delete(roomId);
        }
      }
      // Recreate worker after a short delay
      setTimeout(async () => {
        try {
          await this.createWorker(index);
          this.logger.log(`Mediasoup worker restarted`);
        } catch (err) {
          this.logger.error(`Failed to restart worker: ${err}`);
        }
      }, 2000);
    });

    this.workers.push(worker);
    this.logger.log(`Created mediasoup worker [pid:${worker.pid}]`);
    return worker;
  }

  getWorker(): Worker {
    if (this.workers.length === 0) {
      throw new Error('No mediasoup workers available');
    }
    return this.workers[Math.floor(Math.random() * this.workers.length)];
  }

  async createRouter(roomId: string): Promise<Router> {
    // If cached router exists and is not closed, reuse it
    const existing = this.routers.get(roomId);
    if (existing && !existing.closed) {
      return existing;
    }
    if (existing) {
      this.routers.delete(roomId);
    }

    const worker = this.getWorker();

    const router = await worker.createRouter({
      mediaCodecs: [
        {
          kind: 'audio',
          mimeType: 'audio/opus',
          clockRate: 48000,
          channels: 2,
        },
        {
          kind: 'video',
          mimeType: 'video/VP8',
          clockRate: 90000,
          parameters: {
            'x-google-start-bitrate': 1000,
          },
        },
        {
          kind: 'video',
          mimeType: 'video/H264',
          clockRate: 90000,
          parameters: {
            'packetization-mode': 1,
            'profile-level-id': '4d0032',
            'level-asymmetry-allowed': 1,
          },
        },
      ],
    });

    this.routers.set(roomId, router);
    this.logger.log(`Created router for room ${roomId}`);

    return router;
  }

  async createWebRtcTransport(roomId: string): Promise<WebRtcTransport> {
    const router = await this.createRouter(roomId);

    const transport = await router.createWebRtcTransport({
      listenIps: [
        {
          ip: process.env.MEDIASOUP_LISTEN_IP || '0.0.0.0',
          announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP || '127.0.0.1',
        },
      ],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      enableSctp: false,
      initialAvailableOutgoingBitrate: 1000000,
    });

    return transport;
  }

  async createProducer(transport: WebRtcTransport, kind: 'audio' | 'video', rtpParameters: any): Promise<Producer> {
    const producer = await transport.produce({
      kind,
      rtpParameters,
    });

    return producer;
  }

  async createConsumer(
    transport: WebRtcTransport,
    router: Router,
    producerId: string,
    rtpCapabilities: any
  ): Promise<Consumer> {
    if (
      !router.canConsume({
        producerId,
        rtpCapabilities,
      })
    ) {
      throw new Error('Cannot consume this producer');
    }

    const consumer = await transport.consume({
      producerId,
      rtpCapabilities,
    });

    return consumer;
  }

  async deleteRouter(roomId: string): Promise<void> {
    const router = this.routers.get(roomId);
    if (router) {
      router.close();
      this.routers.delete(roomId);
      this.logger.log(`Deleted router for room ${roomId}`);
    }
  }

  getRouter(roomId: string): Router {
    return this.routers.get(roomId);
  }

  async getRouterRtpCapabilities(roomId: string) {
    const router = await this.createRouter(roomId);
    return router.rtpCapabilities;
  }

  storeTransport(transportId: string, transport: WebRtcTransport): void {
    this.transports.set(transportId, transport);
  }

  getTransport(transportId: string): WebRtcTransport {
    return this.transports.get(transportId);
  }

  deleteTransport(transportId: string): void {
    this.transports.delete(transportId);
  }

  storeProducer(producerId: string, producer: Producer): void {
    this.producers.set(producerId, producer);
  }

  getProducer(producerId: string): Producer {
    return this.producers.get(producerId);
  }

  deleteProducer(producerId: string): void {
    this.producers.delete(producerId);
  }

  storeConsumer(consumerId: string, consumer: Consumer): void {
    this.consumers.set(consumerId, consumer);
  }

  getConsumer(consumerId: string): Consumer {
    return this.consumers.get(consumerId);
  }

  deleteConsumer(consumerId: string): void {
    this.consumers.delete(consumerId);
  }
}
