import Link from "next/link";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldCheck } from "lucide-react";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Integrações"
        description="Gerir chaves Google Ads, Meta, Claude e notificações"
      />
      <Alert className="mb-6 border-[#e5eff9] bg-[#f8fbff]">
        <ShieldCheck className="size-4 text-[#5cb7f3]" />
        <AlertTitle className="text-[#272b30]">As tuas keys estão seguras</AlertTitle>
        <AlertDescription className="text-[#54606b]">
          As chaves ficam guardadas e mascaradas. Nenhum agente executa nada sem o
          teu ok. Define limites e modo de operação em{" "}
          <Link href="/dashboard/agents/settings" className="text-[#5cb7f3] hover:underline">
            Controlo
          </Link>
          .
        </AlertDescription>
      </Alert>
      <OnboardingWizard mode="settings" />
    </div>
  );
}
