import React from "react";
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="w-full bg-white/60 backdrop-blur-sm border-b border-slate-200" role="banner">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-md flex items-center justify-center text-white font-bold" aria-hidden>
              F
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-800">Flare</div>
              <div className="text-xs text-slate-500">Admin demo</div>
            </div>
          </div>

          <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-4 text-sm text-slate-600">
            <Link to="/dashboard" className="focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded px-2 py-1">Dashboard</Link>
            <Link to="/docs" className="focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded px-2 py-1">Docs</Link>
            <Link to="/settings" className="focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded px-2 py-1">Settings</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/signup" aria-label="Sign up" className="hidden sm:inline-block text-sm bg-indigo-50 text-indigo-700 px-3 py-1 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500">Sign up</Link>
            <Link to="/signin" aria-label="Sign in" className="px-3 py-1 text-sm rounded bg-slate-100 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">Sign in</Link>
          </div>
        </div>
      </div>
    </header>
  );
}
