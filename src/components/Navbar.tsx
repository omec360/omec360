"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Home, PlusSquare, User, LogOut, Shield } from "lucide-react";
import { Profile } from "@/types";
import { getInitials } from "@/lib/utils";

interface NavbarProps {
  profile: Profile | null;
}

export default function Navbar({ profile }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const navItems = [
    { href: "/feed", icon: Home, label: "פיד" },
    { href: "/upload", icon: PlusSquare, label: "העלאה" },
    ...(profile ? [{ href: `/profile/${profile.id}`, icon: User, label: "הפרופיל שלי" }] : []),
    ...(profile?.role === "admin" ? [{ href: "/admin", icon: Shield, label: "ניהול" }] : []),
  ];

  return (
    <nav className="fixed top-0 right-0 left-0 z-50 bg-dark-100 border-b border-dark-400">
      <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/feed" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center">
            <span className="text-gold text-xs font-bold">360</span>
          </div>
          <span className="font-bold text-white text-lg">עומק 360</span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                pathname === href || pathname.startsWith(href + "/")
                  ? "bg-gold/10 text-gold"
                  : "text-gray-400 hover:text-white hover:bg-dark-300"
              }`}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}

          {/* User avatar + sign out */}
          {profile && (
            <div className="flex items-center gap-2 mr-2 pr-2 border-r border-dark-400">
              <div className="avatar w-8 h-8 text-xs">
                {getInitials(profile.full_name)}
              </div>
              <button
                onClick={handleSignOut}
                className="text-gray-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-dark-300 transition-colors"
                title="התנתק"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
