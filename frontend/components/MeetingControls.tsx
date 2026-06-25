import React, { useState, useRef, useEffect } from 'react';

interface MeetingControlsProps {
  isCameraOn: boolean;
  isMicOn: boolean;
  isScreenSharing: boolean;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onToggleScreenShare: () => void;
  onLeaveMeeting: () => void;
  onToggleChat: () => void;
}

export default function MeetingControls({
  isCameraOn,
  isMicOn,
  isScreenSharing,
  onToggleCamera,
  onToggleMic,
  onToggleScreenShare,
  onLeaveMeeting,
  onToggleChat,
}: MeetingControlsProps) {
  return (
    <div className="bg-gray-800 border-t border-gray-700 px-4 py-4 flex justify-center gap-3 flex-wrap">
      {/* Microphone */}
      <button
        onClick={onToggleMic}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
          isMicOn
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-red-600 hover:bg-red-700 text-white'
        }`}
        title="Toggle Microphone"
      >
        {isMicOn ? '🎙️' : '🔇'}
        {isMicOn ? 'Mic On' : 'Mic Off'}
      </button>

      {/* Camera */}
      <button
        onClick={onToggleCamera}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
          isCameraOn
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-red-600 hover:bg-red-700 text-white'
        }`}
        title="Toggle Camera"
      >
        {isCameraOn ? '📹' : '📴'}
        {isCameraOn ? 'Camera On' : 'Camera Off'}
      </button>

      {/* Screen Share */}
      <button
        onClick={onToggleScreenShare}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
          isScreenSharing
            ? 'bg-purple-600 hover:bg-purple-700 text-white'
            : 'bg-gray-600 hover:bg-gray-700 text-white'
        }`}
        title="Toggle Screen Share"
      >
        🖥️ {isScreenSharing ? 'Stop Share' : 'Share Screen'}
      </button>

      {/* Chat */}
      <button
        onClick={onToggleChat}
        className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold bg-gray-600 hover:bg-gray-700 text-white transition"
        title="Toggle Chat"
      >
        💬 Chat
      </button>

      {/* Leave Meeting */}
      <button
        onClick={onLeaveMeeting}
        className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold bg-red-600 hover:bg-red-700 text-white transition"
        title="Leave Meeting"
      >
        ☎️ Leave
      </button>
    </div>
  );
}
