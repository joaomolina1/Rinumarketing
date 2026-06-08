import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { PageHeader } from "@/components/layout/PageHeader";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Integrações"
        description="Gerir chaves Google Ads, Meta, Claude e notificações"
      />
      <OnboardingWizard mode="settings" />
    </div>
  );
}
