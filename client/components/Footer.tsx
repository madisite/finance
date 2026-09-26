import React from "react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 bg-white/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-sm text-slate-600 text-center">
        © {new Date().getFullYear()} Finance — Built with care.
      </div>
    </footer>
  );
}
