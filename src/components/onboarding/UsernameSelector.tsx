'use client';

import React, { useState, useEffect } from 'react';
import { useOnboarding } from '@/lib/onboarding/context';

export function UsernameSelector() {
  const { setUsername } = useOnboarding();
  const [usernames, setUsernames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);

  const fetchUsernames = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/username/generate');
      const data = await res.json();
      if (data.success) {
        setUsernames(data.usernames);
      } else {
        setError(data.error || 'Failed to generate usernames');
      }
    } catch {
      setError('Failed to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsernames();
  }, []);

  const handleSelect = (username: string) => {
    setSelectedUsername(username);
  };

  const handleConfirm = () => {
    if (selectedUsername) {
      setUsername(selectedUsername);
    }
  };

  if (loading) {
    return (
      <div className="bg-stone-800/50 rounded-xl p-6 mt-4">
        <div className="flex items-center justify-center gap-2 text-stone-400">
          <div className="w-4 h-4 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
          Generating usernames...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-stone-800/50 rounded-xl p-6 mt-4">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchUsernames}
          className="px-4 py-2 bg-stone-700 hover:bg-stone-600 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-stone-800/50 rounded-xl p-6 mt-4">
      <div className="space-y-3 mb-6">
        {usernames.map((username) => (
          <button
            key={username}
            onClick={() => handleSelect(username)}
            className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
              selectedUsername === username
                ? 'bg-amber-600 text-white ring-2 ring-amber-400'
                : 'bg-stone-700 hover:bg-stone-600 text-stone-100'
            }`}
          >
            <span className="font-mono">{username}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={fetchUsernames}
          className="flex-1 px-4 py-2 bg-stone-700 hover:bg-stone-600 rounded-lg transition-colors text-stone-300"
        >
          Generate More
        </button>
        <button
          onClick={handleConfirm}
          disabled={!selectedUsername}
          className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
            selectedUsername
              ? 'bg-amber-600 hover:bg-amber-500 text-white'
              : 'bg-stone-700 text-stone-500 cursor-not-allowed'
          }`}
        >
          This is me
        </button>
      </div>

      {selectedUsername && (
        <p className="mt-4 text-sm text-stone-400 text-center">
          Write this down: <span className="font-mono text-amber-400">{selectedUsername}</span>
        </p>
      )}
    </div>
  );
}
