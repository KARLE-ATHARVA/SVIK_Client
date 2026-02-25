import { notFound } from "next/navigation";

type RoomPageProps = {
  params: Promise<{ roomId: string }>;
};

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
