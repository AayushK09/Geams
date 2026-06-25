'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function CreateMeeting() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/rooms/create`, {
        createdBy: username,
      });

      const { roomId } = response.data;
      router.push(`/meeting?roomId=${roomId}&username=${encodeURIComponent(username)}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create meeting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Create Meeting</h1>

        <form onSubmit={handleCreateMeeting} className="space-y-4">
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
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            {loading ? 'Creating...' : 'Create Meeting'}
          </button>

          <a href="/" className="block text-center text-blue-600 hover:underline">
            Back to Home
          </a>
        </form>
      </div>
    </div>
  );
}
