'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function JoinMeeting() {
  const router = useRouter();
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId || !username) {
      setError('Please fill in all fields');
      return;
    }
    router.push(`/meeting?roomId=${roomId}&username=${encodeURIComponent(username)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Join Meeting</h1>

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Room ID</label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter room ID"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Join Meeting
          </button>

          <a href="/" className="block text-center text-blue-600 hover:underline">
            Back to Home
          </a>
        </form>
      </div>
    </div>
  );
}
