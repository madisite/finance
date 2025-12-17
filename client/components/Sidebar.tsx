import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <div className="md:hidden flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-md flex items-center justify-center text-white font-bold">F</div>
          <div className="text-sm font-semibold">Flare</div>
        </div>
        <button
          aria-label="Toggle menu"
          aria-expanded={open}
          aria-controls="sidebar-navigation"
          onClick={() => setOpen((v) => !v)}
          className="px-3 py-1 rounded bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      <aside
        id="sidebar-navigation"
        role="navigation"
        aria-label="Sidebar"
        className={`bg-white border rounded-md p-3 md:p-4 w-full md:w-64 md:sticky md:top-6 ${
          open ? "block" : "hidden md:block"
        }`}
      >
        <nav className="flex flex-col gap-2" aria-label="Secondary navigation">
          <Link to="/dashboard" className={`text-sm p-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isActive("/dashboard") ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:text-slate-900"}`}>
            Overview
          </Link>
          <Link to="/docs" className={`text-sm p-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isActive("/docs") ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:text-slate-900"}`}>
            Docs
          </Link>
          <Link to="/settings" className={`text-sm p-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isActive("/settings") ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:text-slate-900"}`}>
            Settings
          </Link>
          <Link to="/signup" className={`text-sm p-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isActive("/signup") ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:text-slate-900"}`}>
            Sign up
          </Link>
        </nav>
      </aside>
    </>
  );
}
