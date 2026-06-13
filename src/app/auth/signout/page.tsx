'use client';

import React from 'react';
import { signOut } from 'next-auth/react';
import Logo from '@/components/Logo';
import { LogOut } from 'lucide-react';

export default function CustomSignOut() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 flex flex-col font-sans selection:bg-amber-500 selection:text-zinc-950 items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-zinc-200 rounded-[32px] p-8 shadow-sm space-y-6 text-center animate-scaleUp">
        <div className="flex justify-center">
          <Logo iconSize={32} textSize="text-2xl" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-xl font-black text-zinc-900">Sign Out</h1>
          <p className="text-sm text-zinc-500">Are you sure you want to sign out of your account?</p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full bg-zinc-950 hover:bg-zinc-900 text-white rounded-2xl py-3 text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <LogOut size={16} />
            Sign Out
          </button>
          
          <a
            href="/"
            className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-2xl py-3 text-sm font-bold transition-all block text-center cursor-pointer"
          >
            Cancel
          </a>
        </div>
      </div>
    </div>
  );
}
