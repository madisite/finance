import React, { PropsWithChildren } from "react";

// Sidebar feature intentionally disabled. Keep Sidebar component in the
// repo so it can be re-enabled later, but render children full-width here.
export default function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <main className="w-full">
          <div className="space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
