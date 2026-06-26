import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
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
  isScreenShare?: boolean;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

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
  const localStreamRef = useRef<MediaStream | null>(null);
  const myParticipantIdRef = useRef<string | null>(null);
  // Map of participantId -> RTCPeerConnection
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const screenStreamRef = useRef<MediaStream | null>(null);

  const createPeerConnection = (participantId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks
    localStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current!);
    });

    // When remote tracks arrive, update participant stream
    pc.ontrack = (event) => {
      const stream = event.streams[0] || new MediaStream([event.track]);
      setParticipants((prev) =>
        prev.map((p) => {
          if (p.id !== participantId) return p;
          return { ...p, stream };
        })
      );
    };

    // Relay ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit('webrtc-ice-candidate', {
          roomId,
          toParticipantId: participantId,
          fromParticipantId: myParticipantIdRef.current,
          candidate: event.candidate,
        });
      }
    };

    peersRef.current.set(participantId, pc);
    return pc;
  };

  const callPeer = async (participantId: string) => {
    const pc = createPeerConnection(participantId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketRef.current?.emit('webrtc-offer', {
      roomId,
      toParticipantId: participantId,
      fromParticipantId: myParticipantIdRef.current,
      sdp: offer,
    });
  };

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_IO_URL || 'http://localhost:3000', {
      reconnection: true,
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    const init = async () => {
      // Get local media
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: initialCameraEnabled ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        });
        localStreamRef.current = stream;
        setLocalStream(stream);
      } catch (err) {
        console.error('getUserMedia failed:', err);
      }

      socket.emit('join-room', { roomId, username });
    };

    init();

    socket.on(
      'join-room-response',
      async (data: { participantId: string; participants: Participant[] }) => {
        myParticipantIdRef.current = data.participantId;
        setParticipants(data.participants.map((p) => ({ id: p.id, username: p.username })));
        // Call every existing participant
        for (const p of data.participants) {
          await callPeer(p.id);
        }
      }
    );

    socket.on('participant-joined', async (data: { id: string; username: string }) => {
      setParticipants((prev) => {
        if (prev.find((p) => p.id === data.id)) return prev;
        return [...prev, { id: data.id, username: data.username }];
      });
      // New participant will call us — nothing to do here
    });

    socket.on('participant-left', (data: { participantId: string } | string) => {
      const id = typeof data === 'string' ? data : data.participantId;
      peersRef.current.get(id)?.close();
      peersRef.current.delete(id);
      setParticipants((prev) => prev.filter((p) => p.id !== id && p.id !== `${id}-screen`));
    });

    // Receive offer from a peer who called us
    socket.on('webrtc-offer', async ({ fromParticipantId, sdp }: any) => {
      let pc = peersRef.current.get(fromParticipantId);
      if (!pc) pc = createPeerConnection(fromParticipantId);
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtc-answer', {
        roomId,
        toParticipantId: fromParticipantId,
        fromParticipantId: myParticipantIdRef.current,
        sdp: answer,
      });
    });

    socket.on('webrtc-answer', async ({ fromParticipantId, sdp }: any) => {
      const pc = peersRef.current.get(fromParticipantId);
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    });

    socket.on('webrtc-ice-candidate', async ({ fromParticipantId, candidate }: any) => {
      const pc = peersRef.current.get(fromParticipantId);
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('ICE candidate error:', e);
        }
      }
    });

    socket.on('chat-message', (message: any) => {
      setMessages((prev) => [...prev, { ...message, timestamp: new Date() }]);
    });

    socket.on('screen-share-stopped', (data: { participantId: string }) => {
      setParticipants((prev) => prev.filter((p) => p.id !== `${data.participantId}-screen`));
    });

    return () => {
      socket.disconnect();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      peersRef.current.forEach((pc) => pc.close());
      peersRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, username]);

  const toggleCamera = () => {
    const enabled = !isCameraOn;
    localStreamRef.current?.getVideoTracks().forEach((t) => { t.enabled = enabled; });
    setIsCameraOn(enabled);
    socketRef.current?.emit('camera-toggle', { roomId, participantId: myParticipantIdRef.current, enabled });
  };

  const toggleMic = () => {
    const enabled = !isMicOn;
    localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = enabled; });
    setIsMicOn(enabled);
    socketRef.current?.emit('mic-toggle', { roomId, participantId: myParticipantIdRef.current, enabled });
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        // Replace video track in all peer connections
        peersRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack);
        });

        setIsScreenSharing(true);
        socketRef.current?.emit('screen-share-start', { roomId, participantId: myParticipantIdRef.current });

        screenTrack.addEventListener('ended', () => stopScreenShare());
      } else {
        stopScreenShare();
      }
    } catch (err) {
      console.error('Screen share error:', err);
    }
  };

  const stopScreenShare = () => {
    const camTrack = localStreamRef.current?.getVideoTracks()[0] ?? null;
    peersRef.current.forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
      if (sender && camTrack) sender.replaceTrack(camTrack);
    });
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    setIsScreenSharing(false);
    socketRef.current?.emit('screen-share-stop', { roomId, participantId: myParticipantIdRef.current });
  };

  const sendMessage = (text: string) => {
    if (socketRef.current && text.trim()) {
      socketRef.current.emit('send-message', { text, user: username, roomId });
      setMessages((prev) => [...prev, { user: username, text, timestamp: new Date() }]);
    }
  };

  const leaveMeeting = () => {
    socketRef.current?.emit('leave-room', { roomId, participantId: myParticipantIdRef.current });
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    peersRef.current.forEach((pc) => pc.close());
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex justify-between items-center">
        <div>
          <h1 className="text-white font-bold text-lg">Meeting - {roomId}</h1>
          <p className="text-gray-400 text-sm">
            You: {username} | Participants: {participants.filter((p) => !p.isScreenShare).length + 1}
          </p>
        </div>
      </div>

      <div className="flex flex-1 gap-0 min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <VideoGrid
            participants={participants}
            localStream={localStream}
            username={username}
            isScreenSharing={isScreenSharing}
          />
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
