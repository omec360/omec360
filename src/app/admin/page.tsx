import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Users, FileText, Mail } from "lucide-react";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    { count: userCount },
    { count: postCount },
    { count: emailCount },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("posts").select("*", { count: "exact", head: true }),
    supabase.from("allowed_emails").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "תלמידים רשומים", value: userCount ?? 0, icon: Users, href: "/admin/students" },
    { label: "פוסטים", value: postCount ?? 0, icon: FileText, href: "/admin/content" },
    { label: "אימיילים מורשים", value: emailCount ?? 0, icon: Mail, href: "/admin/students" },
  ];

  return (
    <div className="page-container">
      <h1 className="section-title">לוח ניהול</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href} className="card hover:border-gold/30 transition-colors text-center group">
            <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-gold/20 transition-colors">
              <Icon className="text-gold" size={22} />
            </div>
            <p className="text-3xl font-bold text-white mb-1">{value}</p>
            <p className="text-gray-400 text-sm">{label}</p>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/admin/students" className="card hover:border-gold/30 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Users className="text-blue-400" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-gold transition-colors">ניהול תלמידים</h3>
              <p className="text-gray-500 text-sm">הוסף אימיילים, נהל משתמשים</p>
            </div>
          </div>
        </Link>

        <Link href="/admin/content" className="card hover:border-gold/30 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <FileText className="text-purple-400" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-gold transition-colors">ניהול תוכן</h3>
              <p className="text-gray-500 text-sm">צפה ומחק פוסטים</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
