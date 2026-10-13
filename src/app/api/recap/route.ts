import { postRecap } from "@/lib/discord";
import { weeklyRecap } from "@/lib/recap";
import { adminClient } from "@/lib/supabase/server";

// Called once a week by Vercel Cron (see vercel.json), which sends CRON_SECRET as a bearer
// token. Anyone else is turned away: the recap must not be triggered or read from outside.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const admin = adminClient();
  if (!admin) return new Response("Not configured", { status: 503 });
  const recap = await weeklyRecap(admin);
  await postRecap(recap);
  // Handy when the job is run by hand: what was sent.
  return Response.json(recap);
}
