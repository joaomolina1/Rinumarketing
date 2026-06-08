import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] px-4 py-10">
      <OnboardingWizard mode="onboarding" />
    </div>
  );
}
