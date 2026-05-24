"use client";

import dynamic from "next/dynamic";

const LiveActivity = dynamic(
  () => import("./live-activity").then((m) => m.LiveActivity),
  { ssr: false }
);

export function LiveActivityWrapper() {
  return <LiveActivity />;
}
