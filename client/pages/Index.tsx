import { DemoResponse } from "@shared/api";
import { useEffect, useState } from "react";

export default function Index() {
  const [exampleFromServer, setExampleFromServer] = useState("");

  useEffect(() => {
    fetchDemo();
  }, []);

  const fetchDemo = async () => {
    try {
      const response = await fetch("/api/demo");
      const data = (await response.json()) as DemoResponse;
      setExampleFromServer(data.message);
    } catch (error) {
      console.error("Error fetching hello:", error);
    }
  };

  return (
    <div className="w-full">
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Build fast, delightful UIs with Flare
          </h1>
          <p className="mt-4 text-slate-600 max-w-xl">
            A lightweight starter showcasing a clean, responsive layout with
            components and simple data fetching from the server. Use this as a
            base to organize pages and UI patterns.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <a
              className="inline-block px-4 py-2 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700"
              href="#"
            >
              Get started
            </a>
            <a className="inline-block px-4 py-2 rounded border text-sm text-slate-700 hover:bg-slate-100" href="#">
              Learn more
            </a>
          </div>

          {exampleFromServer && (
            <div className="mt-6 p-4 bg-slate-50 border rounded text-sm text-slate-700">
              <strong>Server:</strong> {exampleFromServer}
            </div>
          )}
        </div>

        <div>
          <div className="w-full h-56 rounded-lg bg-gradient-to-br from-indigo-100 to-pink-50 flex items-center justify-center border border-slate-100">
            <div className="text-center text-slate-600">
              <div className="text-2xl font-medium">Welcome 👋</div>
              <div className="mt-2 text-sm max-w-xs mx-auto">This area is a placeholder for a demo preview, charts, or screenshots.</div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Quick features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: "Responsive Layout", desc: "Mobile-first layout using Tailwind CSS." },
            { title: "React Router", desc: "Route-based pages and lazy loading." },
            { title: "Server Fetch", desc: "Simple API fetch example to get you started." },
            { title: "UI Primitives", desc: "Reusable low-level UI components in `components/ui`." },
            { title: "Query Client", desc: "React Query is already configured for async data." },
            { title: "Easy Theming", desc: "Tailwind + CSS vars for quick styling changes." },
          ].map((f) => (
            <div key={f.title} className="p-4 bg-white rounded-lg shadow-sm border">
              <div className="font-medium text-slate-800">{f.title}</div>
              <div className="mt-2 text-sm text-slate-600">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
