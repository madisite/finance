import React from "react";

export default function Docs() {
  return (
    <div className="w-full">
      <h1 className="text-2xl font-semibold text-slate-900 mb-2">Installation & Setup</h1>

      <section className="mb-6">
        <h2 className="text-lg font-medium text-slate-800">Requirements</h2>
        <ul className="mt-2 list-disc list-inside text-slate-600">
          <li>Node.js 18+ (recommended)</li>
          <li>npm or pnpm</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-medium text-slate-800">Local development</h2>
        <div className="mt-2 bg-slate-50 p-4 rounded border">
          <pre className="text-sm whitespace-pre-wrap">
npm install

npm run dev

npm run build

npm start
          </pre>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-medium text-slate-800">Environment</h2>
        <p className="mt-2 text-slate-600">Create a <code className="rounded bg-slate-100 px-1">.env</code> file at project root and set any required variables (e.g., API keys).</p>
      </section>

      <section>
        <h2 className="text-lg font-medium text-slate-800">Notes</h2>
        <ul className="mt-2 list-disc list-inside text-slate-600">
          <li>Routes: client pages live in <code className="bg-slate-100 px-1 rounded">client/pages</code>.</li>
          <li>Shared types: see <code className="bg-slate-100 px-1 rounded">shared/api.ts</code>.</li>
          <li>Server routes: add to <code className="bg-slate-100 px-1 rounded">server/routes</code>.</li>
        </ul>
      </section>
    </div>
  );
}
