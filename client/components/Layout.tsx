import React, { PropsWithChildren } from "react";
import Header from "./Header";
import Footer from "./Footer";

export default function Layout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1 w-full">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
