import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import VideoGrid from './VideoGrid';
import MeetingControls from './MeetingControls';
import ChatPanel from './ChatPanel';
import { useMediaStore } from '@/store/mediaStore';

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
  const [socket, setSocket] = useState<Socket | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(initialCameraEnabled);
  const [isMicOn, setIsMicOn] = useState(initialMicEnabled);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [messages, setMessages] = useState<{ user: string; text: string; timestamp: Date }[]>([]);
  const [showChat, setShowChat] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Initialize socket and media
  useEffect(() => {
    const initSocket = io(process.env.NEXT_PUBLIC_SOCKET_IO_URL || 'http://localhost:3000', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    initSocket.emit('join-room', {
      roomId,
      username,
    });

    initSocket.on(
      'join-room-response',
      (data: { participantId: string; participants: Participant[] }) => {
        // Load existing participants when we join
        setParticipants(data.participants);
      }
    );

    initSocket.on('participant-joined', (data: Participant) => {
      // Avoid duplicates
      setParticipants((prev) => {
        if (prev.find((p) => p.id === data.id)) return prev;
        return [...prev, data];
      });
    });

    initSocket.on('participant-left', (data: { participantId: string } | string) => {
      const id = typeof data === 'string' ? data : data.participantId;
      setParticipants((prev) => prev.filter((p) => p.id !== id));
    });

    initSocket.on('chat-message', (message) => {
      setMessages((prev) => [...prev, { ...message, timestamp: new Date() }]);
    });

    setSocket(initSocket);

    return () => {
      initSocket.disconnect();
    };
  }, [roomId, username]);

  // Initialize media
  useEffect(() => {
    const setupMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: isMicOn,
          video: isCameraOn ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        });
        setLocalStream(mediaStream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = mediaStream;
          localVideoRef.current.play();
        }
      } catch (err) {
        console.error('Failed to setup media:', err);
      }
    };

    setupMedia();

    return () => {
      localStream?.getTracks().forEach((track) => track.stop());
    };
  }, [isCameraOn, isMicOn]);

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsCameraOn(!isCameraOn);
      socket?.emit('camera-toggle', { enabled: !isCameraOn });
    }
  };

  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMicOn(!isMicOn);
      socket?.emit('mic-toggle', { enabled: !isMicOn });
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' },
          audio: false,
        });

        setIsScreenSharing(true);
        socket?.emit('screen-share-start', { roomId, username });

        screenStream.getVideoTracks()[0].addEventListener('ended', () => {
          setIsScreenSharing(false);
          socket?.emit('screen-share-stop', { roomId, username });
        });
      } else {
        setIsScreenSharing(false);
        socket?.emit('screen-share-stop', { roomId, username });
      }
    } catch (err) {
      console.error('Screen sharing error:', err);
    }
  };

  const sendMessage = (text: string) => {
    if (socket && text.trim()) {
      socket.emit('send-message', { text, user: username });
      setMessages((prev) => [...prev, { user: username, text, timestamp: new Date() }]);
    }
  };

  const leaveMeeting = () => {
    socket?.emit('leave-room', { roomId, username });
    localStream?.getTracks().forEach((track) => track.stop());
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
