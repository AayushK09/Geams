'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-6xl font-bold mb-4">GEAMS</h1>
        <p className="text-2xl mb-8">Self-Hosted Video Meeting Platform</p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/create-meeting"
            className="px-8 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition"
          >
            Create Meeting
          </Link>
          <Link
            href="/join-meeting"
            className="px-8 py-3 bg-blue-700 text-white font-bold rounded-lg hover:bg-blue-800 transition"
          >
            Join Meeting
          </Link>
        </div>
      </div>
    </div>
  );
}
