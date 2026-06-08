import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/callback");
  const isOnboardingRoute = request.nextUrl.pathname.startsWith("/onboarding");
  const isDashboardRoute = request.nextUrl.pathname.startsWith("/dashboard");
  const isApiRoute = request.nextUrl.pathname.startsWith("/api");

  if (!user && (isDashboardRoute || isOnboardingRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (user && isDashboardRoute && !isOnboardingRoute) {
    const { data: settings } = await supabase
      .from("integration_settings")
      .select("onboarding_completed_at, google_ads_customer_id, meta_access_token, anthropic_api_key")
      .eq("user_id", user.id)
      .maybeSingle();

    const hasEnvFallback =
      process.env.GOOGLE_ADS_CUSTOMER_ID &&
      process.env.META_ACCESS_TOKEN &&
      process.env.ANTHROPIC_API_KEY;

    const isComplete =
      settings?.onboarding_completed_at ||
      hasEnvFallback ||
      (settings?.google_ads_customer_id &&
        settings?.meta_access_token &&
        settings?.anthropic_api_key);

    if (!isComplete && !request.nextUrl.pathname.startsWith("/dashboard/settings")) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
  }

  if (user && isOnboardingRoute) {
    const { data: settings } = await supabase
      .from("integration_settings")
      .select("onboarding_completed_at")
      .eq("user_id", user.id)
      .maybeSingle();

    const hasEnvFallback =
      process.env.GOOGLE_ADS_CUSTOMER_ID &&
      process.env.META_ACCESS_TOKEN &&
      process.env.ANTHROPIC_API_KEY;

    if (settings?.onboarding_completed_at || hasEnvFallback) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  if (!user && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (isApiRoute) {
    return supabaseResponse;
  }

  return supabaseResponse;
}
