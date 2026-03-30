import { notFound } from "next/navigation";

type RoomPageProps = {
  params: Promise<{ roomId: string }>;
};

export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams() {
  return [
    "6",
    "8",
    "12",
    "20",
    "21",
    "22",
    "23",
    "24",
    "25",
    "26",
    "27",
    "28",
    "29",
    "30",
    "31",
    "32",
    "33",
    "34",
    "35",
    "36",
    "37",
    "38",
    "39",
    "40",
    "42",
    "44",
    "45",
    "46",
    "47",
  ].map((roomId) => ({ roomId }));
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
