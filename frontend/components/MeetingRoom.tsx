import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Device } from 'mediasoup-client';
import type { Transport, Producer, Consumer } from 'mediasoup-client/lib/types';
import VideoGrid from './VideoGrid';
import MeetingControls from './MeetingControls';
import ChatPanel from './ChatPanel';

interface MeetingRoomProps {
  roomId: string;
  username: string;
  initialCameraEnabled: boolean;
  initialMicEnabled: boolean;
}

interface Participant {
  id: string;
  username: string;
  stream?: MediaStream;
}

export default function MeetingRoom({
  roomId,
  username,
  initialCameraEnabled,
  initialMicEnabled,
}: MeetingRoomProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(initialCameraEnabled);
  const [isMicOn, setIsMicOn] = useState(initialMicEnabled);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [messages, setMessages] = useState<{ user: string; text: string; timestamp: Date }[]>([]);
  const [showChat, setShowChat] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const deviceRef = useRef<Device | null>(null);
  const sendTransportRef = useRef<Transport | null>(null);
  const recvTransportRef = useRef<Transport | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const myParticipantIdRef = useRef<string | null>(null);
  const audioProducerRef = useRef<Producer | null>(null);
  const videoProducerRef = useRef<Producer | null>(null);
  // Map producerId -> consumerId for cleanup tracking
  const consumerMapRef = useRef<Map<string, Consumer>>(new Map());

  const consumeProducer = useCallback(
    async (producerId: string, participantId: string) => {
      const socket = socketRef.current;
      const device = deviceRef.current;
      const recvTransport = recvTransportRef.current;
      if (!socket || !device || !recvTransport) return;

      socket.emit(
        'consume',
        {
          transportId: (recvTransport as any).id,
          producerId,
          rtpCapabilities: device.rtpCapabilities,
          roomId,
          participantId: myParticipantIdRef.current,
        },
        async (data: any) => {
          if (!data || data.error) {
            console.error('consume error', data?.error);
            return;
          }
          const { consumerId, kind, rtpParameters, paused } = data;

          const consumer = await recvTransport.consume({
            id: consumerId,
            producerId,
            kind,
            rtpParameters,
          });
          consumerMapRef.current.set(producerId, consumer);

          if (paused) {
            socket.emit('resume-consumer', { consumerId });
          }

          const stream = new MediaStream([consumer.track]);

          setParticipants((prev) =>
            prev.map((p) => {
              if (p.id !== participantId) return p;
              const existing = p.stream;
              if (existing) {
                existing.addTrack(consumer.track);
                return { ...p, stream: existing };
              }
              return { ...p, stream };
            })
          );
        }
      );
    },
    [roomId]
  );

  // Main mediasoup + socket setup
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_IO_URL || 'http://localhost:3000', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    const setupMediasoup = async () => {
      // 1. Get local media
      let localMedia: MediaStream | null = null;
      try {
        localMedia = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: initialCameraEnabled ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        });
        localStreamRef.current = localMedia;
        setLocalStream(localMedia);
      } catch (err) {
        console.error('getUserMedia failed:', err);
      }

      // 2. Join room
      socket.emit('join-room', { roomId, username });

      socket.on(
        'join-room-response',
        async (data: { participantId: string; participants: Array<{ id: string; username: string; producerIds?: string[] }> }) => {
          myParticipantIdRef.current = data.participantId;

          // Add existing participants (no stream yet, will be populated by new-producer)
          setParticipants(
            data.participants.map((p) => ({ id: p.id, username: p.username }))
          );

          // 3. Get router RTP capabilities
          socket.emit('get-rtp-capabilities', { roomId });

          // Store existing producers so we can consume them after transports are ready
          (socket as any)._existingProducers = data.participants.flatMap((p) =>
            (p.producerIds || []).map((pid) => ({ producerId: pid, participantId: p.id }))
          );
        }
      );

      // 4. Load device + create transports once we get capabilities
      socket.on('rtp-capabilities', async ({ rtpCapabilities }: any) => {
        try {
          const device = new Device();
          await device.load({ routerRtpCapabilities: rtpCapabilities });
          deviceRef.current = device;

          // 5. Create send transport
          socket.emit('create-transport', {
            roomId,
            participantId: myParticipantIdRef.current,
            direction: 'send',
          });

          // 6. Create recv transport
          socket.emit('create-transport', {
            roomId,
            participantId: myParticipantIdRef.current,
            direction: 'recv',
          });
        } catch (err) {
          console.error('Device load failed:', err);
        }
      });

      socket.on('transport-created', async (data: any) => {
        const { transportId, iceParameters, iceCandidates, dtlsParameters, direction } = data;
        const device = deviceRef.current;
        if (!device) return;

        const transportOptions = {
          id: transportId,
          iceParameters,
          iceCandidates,
          dtlsParameters,
        };

        if (direction === 'send') {
          const sendTransport = device.createSendTransport(transportOptions);
          sendTransportRef.current = sendTransport;

          sendTransport.on('connect', ({ dtlsParameters: dp }, callback, errback) => {
            socket.emit(
              'connect-transport',
              { transportId: sendTransport.id, dtlsParameters: dp },
              (res: any) => {
                if (res?.error) errback(res.error);
                else callback();
              }
            );
          });

          sendTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
            socket.emit(
              'produce',
              {
                transportId: sendTransport.id,
                kind,
                rtpParameters,
                roomId,
                participantId: myParticipantIdRef.current,
              },
              (res: any) => {
                if (res?.error) errback(res.error);
                else callback({ id: res.producerId });
              }
            );
          });

          // Produce audio and video tracks
          const stream = localStreamRef.current;
          if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack && device.canProduce('audio')) {
              audioProducerRef.current = await sendTransport.produce({ track: audioTrack });
            }
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack && device.canProduce('video')) {
              videoProducerRef.current = await sendTransport.produce({
                track: videoTrack,
                encodings: [
                  { maxBitrate: 100000 },
                  { maxBitrate: 300000 },
                  { maxBitrate: 900000 },
                ],
                codecOptions: { videoGoogleStartBitrate: 1000 },
              });
            }
          }
        } else {
          // recv transport
          const recvTransport = device.createRecvTransport(transportOptions);
          recvTransportRef.current = recvTransport;

          recvTransport.on('connect', ({ dtlsParameters: dp }, callback, errback) => {
            socket.emit(
              'connect-transport',
              { transportId: recvTransport.id, dtlsParameters: dp },
              (res: any) => {
                if (res?.error) errback(res.error);
                else callback();
              }
            );
          });

          // Consume any producers that were already in the room when we joined
          const existing: Array<{ producerId: string; participantId: string }> =
            (socket as any)._existingProducers || [];
          for (const { producerId, participantId } of existing) {
            consumeProducer(producerId, participantId);
          }
        }
      });

      // 7. When a new producer appears (someone else starts sending), consume it
      socket.on(
        'new-producer',
        ({ producerId, participantId, kind }: { producerId: string; participantId: string; kind: string }) => {
          // Don't consume our own producers
          if (participantId === myParticipantIdRef.current) return;
          // Ensure participant is in list
          setParticipants((prev) => {
            if (!prev.find((p) => p.id === participantId)) {
              return [...prev, { id: participantId, username: 'Participant' }];
            }
            return prev;
          });
          consumeProducer(producerId, participantId);
        }
      );

      socket.on('participant-joined', (data: Participant) => {
        setParticipants((prev) => {
          if (prev.find((p) => p.id === data.id)) return prev;
          return [...prev, { id: data.id, username: data.username }];
        });
      });

      socket.on('participant-left', (data: { participantId: string } | string) => {
        const id = typeof data === 'string' ? data : data.participantId;
        setParticipants((prev) => prev.filter((p) => p.id !== id));
      });

      socket.on('chat-message', (message: any) => {
        setMessages((prev) => [...prev, { ...message, timestamp: new Date() }]);
      });
    };

    setupMediasoup();

    return () => {
      socket.disconnect();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      sendTransportRef.current?.close();
      recvTransportRef.current?.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, username]);

  const toggleCamera = () => {
    const stream = localStreamRef.current;
    if (stream) {
      const enabled = !isCameraOn;
      stream.getVideoTracks().forEach((track) => { track.enabled = enabled; });
      if (videoProducerRef.current) {
        enabled ? videoProducerRef.current.resume() : videoProducerRef.current.pause();
      }
      setIsCameraOn(enabled);
      socketRef.current?.emit('camera-toggle', {
        roomId,
        participantId: myParticipantIdRef.current,
        enabled,
      });
    }
  };

  const toggleMic = () => {
    const stream = localStreamRef.current;
    if (stream) {
      const enabled = !isMicOn;
      stream.getAudioTracks().forEach((track) => { track.enabled = enabled; });
      if (audioProducerRef.current) {
        enabled ? audioProducerRef.current.resume() : audioProducerRef.current.pause();
      }
      setIsMicOn(enabled);
      socketRef.current?.emit('mic-toggle', {
        roomId,
        participantId: myParticipantIdRef.current,
        enabled,
      });
    }
  };

  const screenProducerRef = useRef<Producer | null>(null);

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        const screenTrack = screenStream.getVideoTracks()[0];

        // Produce the screen track through mediasoup so others can consume it
        if (sendTransportRef.current) {
          screenProducerRef.current = await sendTransportRef.current.produce({
            track: screenTrack,
            appData: { source: 'screen' },
          });
        }

        setIsScreenSharing(true);
        socketRef.current?.emit('screen-share-start', {
          roomId,
          participantId: myParticipantIdRef.current,
        });

        const stopSharing = () => {
          screenProducerRef.current?.close();
          screenProducerRef.current = null;
          setIsScreenSharing(false);
          socketRef.current?.emit('screen-share-stop', {
            roomId,
            participantId: myParticipantIdRef.current,
          });
        };

        screenTrack.addEventListener('ended', stopSharing);
      } else {
        screenProducerRef.current?.close();
        screenProducerRef.current = null;
        setIsScreenSharing(false);
        socketRef.current?.emit('screen-share-stop', {
          roomId,
          participantId: myParticipantIdRef.current,
        });
      }
    } catch (err) {
      console.error('Screen sharing error:', err);
    }
  };

  const sendMessage = (text: string) => {
    if (socketRef.current && text.trim()) {
      socketRef.current.emit('send-message', { text, user: username, roomId });
      setMessages((prev) => [...prev, { user: username, text, timestamp: new Date() }]);
    }
  };

  const leaveMeeting = () => {
    socketRef.current?.emit('leave-room', {
      roomId,
      participantId: myParticipantIdRef.current,
    });
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    sendTransportRef.current?.close();
    recvTransportRef.current?.close();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex justify-between items-center">
        <div>
          <h1 className="text-white font-bold text-lg">Meeting - {roomId}</h1>
          <p className="text-gray-400 text-sm">
            You: {username} | Participants: {participants.length + 1}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 gap-0">
        {/* Video Grid */}
        <div className="flex-1 flex flex-col">
          <VideoGrid
            participants={participants}
            localStream={localStream}
            username={username}
            isScreenSharing={isScreenSharing}
          />

          {/* Controls */}
          <MeetingControls
            isCameraOn={isCameraOn}
            isMicOn={isMicOn}
            isScreenSharing={isScreenSharing}
            onToggleCamera={toggleCamera}
            onToggleMic={toggleMic}
            onToggleScreenShare={toggleScreenShare}
            onLeaveMeeting={leaveMeeting}
            onToggleChat={() => setShowChat(!showChat)}
          />
        </div>

        {/* Chat Panel */}
        {showChat && (
          <ChatPanel
            messages={messages}
            username={username}
            onSendMessage={sendMessage}
            onClose={() => setShowChat(false)}
          />
        )}
      </div>
    </div>
  );
}
