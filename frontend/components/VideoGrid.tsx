import React, { useEffect, useRef, useState } from 'react';

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
  const [showCameras, setShowCameras] = useState(true);

  const allParticipants = [
    { id: 'local', username, stream: localStream, isScreenShare: false },
    ...participants,
  ];
  const screenTile = allParticipants.find((p) => p.isScreenShare);
  const cameraTiles = allParticipants.filter((p) => !p.isScreenShare);

  if (screenTile) {
    return (
      <div className="flex flex-col flex-1 bg-gray-900 overflow-hidden min-h-0 relative">
        {/* Main screen share */}
        <div className="flex-1 min-h-0 p-2">
          <VideoTile participant={screenTile} isLocal={false} forceContain />
        </div>

        {/* Camera strip toggle button */}
        <button
          onClick={() => setShowCameras((v) => !v)}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20 bg-gray-700 hover:bg-gray-600 text-white rounded-t-lg px-4 py-1 flex items-center gap-2 text-sm transition-colors"
        >
          <span>{showCameras ? '▼' : '▲'}</span>
          <span>{showCameras ? 'Hide participants' : 'Show participants'}</span>
        </button>

        {/* Camera strip */}
        {showCameras && (
          <div className="flex gap-2 px-2 pb-8 pt-1 bg-gray-800 overflow-x-auto shrink-0">
            {cameraTiles.map((p) => (
              <div key={p.id} className="w-40 shrink-0 aspect-video">
                <VideoTile participant={p} isLocal={p.id === 'local'} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Normal grid layout
  const getGridCols = (count: number) => {
    if (count === 1) return 'grid-cols-1';
    if (count <= 2) return 'md:grid-cols-2 grid-cols-1';
    if (count <= 4) return 'md:grid-cols-2 grid-cols-1';
    if (count <= 6) return 'lg:grid-cols-3 md:grid-cols-2 grid-cols-1';
    return 'lg:grid-cols-4 md:grid-cols-3 grid-cols-1';
  };

  return (
    <div
      className={`grid ${getGridCols(cameraTiles.length)} gap-2 p-2 bg-gray-900 flex-1 overflow-auto`}
    >
      {cameraTiles.map((p) => (
        <VideoTile key={p.id} participant={p} isLocal={p.id === 'local'} />
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
  forceContain?: boolean;
}

function VideoTile({ participant, isLocal, forceContain }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
      videoRef.current.play().catch(() => {});
    }
  }, [participant.stream]);

  return (
    <div className="relative bg-black rounded-lg overflow-hidden aspect-video h-full w-full">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`w-full h-full ${forceContain || participant.isScreenShare ? 'object-contain' : 'object-cover'}`}
      />
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 px-2 py-1 rounded text-white text-sm">
        {isLocal ? `${participant.username} (You)` : participant.username}
      </div>
    </div>
  );
}
