import React, { useEffect, useRef } from 'react';

interface VideoGridProps {
  participants: {
    id: string;
    username: string;
    stream?: MediaStream;
    isScreenShare?: boolean;
  }[];
  localStream: MediaStream | null;
  username: string;
  isScreenSharing?: boolean;
}

export default function VideoGrid({
  participants,
  localStream,
  username,
  isScreenSharing = false,
}: VideoGridProps) {
  const calculateGridSize = (count: number) => {
    if (count === 1) return 'grid-cols-1';
    if (count <= 2) return 'md:grid-cols-2 grid-cols-1';
    if (count <= 4) return 'md:grid-cols-2 grid-cols-1';
    if (count <= 6) return 'lg:grid-cols-3 md:grid-cols-2 grid-cols-1';
    return 'lg:grid-cols-4 md:grid-cols-3 grid-cols-1';
  };

  const allParticipants = [{ id: 'local', username, stream: localStream }, ...participants];

  return (
    <div
      className={`grid ${calculateGridSize(allParticipants.length)} gap-2 p-2 bg-gray-900 flex-1 overflow-auto`}
    >
      {allParticipants.map((participant) => (
        <VideoTile
          key={participant.id}
          participant={participant}
          isLocal={participant.id === 'local'}
        />
      ))}
    </div>
  );
}

interface VideoTileProps {
  participant: {
    id: string;
    username: string;
    stream?: MediaStream;
    isScreenShare?: boolean;
  };
  isLocal: boolean;
}

function VideoTile({ participant, isLocal }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
      videoRef.current.play();
    }
  }, [participant.stream]);

  return (
    <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 px-2 py-1 rounded text-white text-sm">
        {isLocal ? `${participant.username} (You)` : participant.username}
      </div>
    </div>
  );
}
