import { notFound } from "next/navigation";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

type RoomPageProps = {
  params: Promise<{ roomId: string }>;
};

export async function generateStaticParams() {
  const appDir = join(process.cwd(), "public", "app");

  try {
    const entries = await readdir(appDir);

    return entries
      .filter((entry) => /^\d+\.html$/.test(entry))
      .map((entry) => ({
        roomId: entry.replace(/\.html$/, ""),
      }));
  } catch {
    return [];
  }
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { roomId } = await params;

  // Keep this route scoped to numeric room ids only.
  if (!/^\d+$/.test(roomId)) {
    notFound();
  }

  return (
    <iframe
      src={`/app/${roomId}.html#`}
      style={{
        width: "100%",
        height: "100vh",
        border: "none",
      }}
    />
  );
}
