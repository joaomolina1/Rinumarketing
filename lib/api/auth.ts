import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function authorizeApiRequest(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get("authorization");
  const expectedToken = process.env.N8N_API_KEY;

  if (authHeader && expectedToken && authHeader === `Bearer ${expectedToken}`) {
    return true;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return !!user;
}
