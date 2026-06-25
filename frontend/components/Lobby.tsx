import React, { useEffect, useRef, useState } from 'react';

interface LobbyProps {
  roomId: string;
  username: string;
  cameraEnabled: boolean;
  micEnabled: boolean;
  onCameraToggle: () => void;
  onMicToggle: () => void;
  onJoin: () => void;
}

export default function Lobby({
  roomId,
  username,
  cameraEnabled,
  micEnabled,
  onCameraToggle,
  onMicToggle,
  onJoin,
}: LobbyProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const setupPreview = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: micEnabled,
          video: cameraEnabled ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        });
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }
      } catch (err: any) {
        setError('Failed to access camera/microphone: ' + err.message);
      }
    };

    setupPreview();

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [cameraEnabled, micEnabled]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-gray-800 rounded-lg overflow-hidden shadow-2xl">
          <div className="p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">Ready to join?</h1>
            <p className="text-gray-400 mb-8">
              Room: <span className="font-mono text-blue-400">{roomId}</span>
            </p>

            {/* Video Preview */}
            <div className="mb-8 bg-black rounded-lg overflow-hidden aspect-video">
              {error ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-red-400 mb-4">{error}</p>
                    <p className="text-gray-400">Please allow camera/microphone access</p>
                  </div>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Controls */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <button
                onClick={onCameraToggle}
                className={`py-3 px-4 rounded-lg font-semibold transition ${
                  cameraEnabled
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {cameraEnabled ? '📹 Camera On' : '📹 Camera Off'}
              </button>

              <button
                onClick={onMicToggle}
                className={`py-3 px-4 rounded-lg font-semibold transition ${
                  micEnabled
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {micEnabled ? '🎙️ Mic On' : '🎙️ Mic Off'}
              </button>
            </div>

            {/* Join Button */}
            <button
              onClick={onJoin}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition"
            >
              Join Meeting as {username}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
