import React from "react";
import TopNav from "./TopNav";

export default function Layout({ children }) {
  return (
    <div style={{ minHeight: "100vh" }}>
      <TopNav />
      <main className="mx-auto px-5 py-8 fade-up" style={{ maxWidth: 1600 }}>
        {children}
      </main>
    </div>
  );
}
