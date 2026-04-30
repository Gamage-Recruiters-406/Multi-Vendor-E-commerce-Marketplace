import React from 'react';
export function WelcomeBanner({ adminName }) {
  return (
    <div className="w-full bg-gradient-to-r from-[#0d5c42] to-[#1A9F73] rounded-2xl p-8 text-white shadow-sm">
      <h1 className="text-3xl font-bold mb-2">Welcome back, {adminName || 'Admin'}! 👋</h1>
      <p className="text-white/70 text-sm italic">
        Here's what's happening with your marketplace today
      </p>
    </div>
  );
}
