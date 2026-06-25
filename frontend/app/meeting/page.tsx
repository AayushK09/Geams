'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import MeetingRoom from '@/components/MeetingRoom';
import Lobby from '@/components/Lobby';

export default function MeetingPage() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId');
  const username = searchParams.get('username');
  const [inLobby, setInLobby] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);

  if (!roomId || !username) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Meeting Link</h1>
          <a href="/" className="text-blue-400 hover:underline">
            Go back home
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      {inLobby ? (
        <Lobby
          roomId={roomId}
          username={username}
          cameraEnabled={cameraEnabled}
          micEnabled={micEnabled}
          onCameraToggle={() => setCameraEnabled(!cameraEnabled)}
          onMicToggle={() => setMicEnabled(!micEnabled)}
          onJoin={() => setInLobby(false)}
        />
      ) : (
        <MeetingRoom
          roomId={roomId}
          username={username}
          initialCameraEnabled={cameraEnabled}
          initialMicEnabled={micEnabled}
        />
      )}
    </>
  );
}
