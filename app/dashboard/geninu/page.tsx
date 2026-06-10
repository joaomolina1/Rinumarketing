import { PageHeader } from "@/components/layout/PageHeader";
import { GeninuChat } from "@/components/geninu/GeninuChat";

export const dynamic = "force-dynamic";

export default function GeninuPage() {
  return (
    <div>
      <PageHeader
        title="Geninu"
        description="Assistente conversacional com acesso a Google Ads, Meta, GA4 e controlos dos agentes"
      />
      <GeninuChat />
    </div>
  );
}
