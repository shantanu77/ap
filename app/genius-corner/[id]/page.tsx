import GeniusExplorer from "@/components/genius/GeniusExplorer";

export default async function GeniusExplorationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GeniusExplorer id={id} />;
}
