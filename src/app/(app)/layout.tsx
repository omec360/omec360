import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import { redirect } from "next/navigation";
import { Profile } from "@/types";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let supabase;
  try {
    supabase = await createClient();
  } catch (e) {
    console.error("[AppLayout] createClient failed:", e);
    redirect("/login");
  }

  let user;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (e) {
    console.error("[AppLayout] getUser failed:", e);
    redirect("/login");
  }

  if (!user) redirect("/login");

  let profile: Profile | null = null;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (error) console.error("[AppLayout] profile error:", error);
    profile = data;
  } catch (e) {
    console.error("[AppLayout] profile fetch failed:", e);
  }

  return (
    <div className="min-h-screen bg-dark">
      <Navbar profile={profile} />
      <main className="pt-16">{children}</main>
    </div>
  );
}
