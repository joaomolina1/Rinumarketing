import { PageHeader } from "@/components/layout/PageHeader";

interface CampaignDetailProps {
  params: Promise<{ id: string }>;
}

export default async function MetaCampaignDetailPage({ params }: CampaignDetailProps) {
  const { id } = await params;
  return (
    <div>
      <PageHeader title={`Campanha ${id}`} description="Detalhe da campanha Meta Ads" />
    </div>
  );
}
