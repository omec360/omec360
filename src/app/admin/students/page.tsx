"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { AllowedEmail, Profile } from "@/types";
import { formatDate } from "@/lib/utils";
import { Plus, Trash2, Users, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function StudentsPage() {
  const [allowedEmails, setAllowedEmails] = useState<AllowedEmail[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"emails" | "users">("emails");
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [{ data: emails }, { data: users }] = await Promise.all([
      supabase.from("allowed_emails").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    ]);
    if (emails) setAllowedEmails(emails);
    if (users) setProfiles(users);
  }

  async function addEmail(e: React.FormEvent) {
    e.preventDefault();
    const email = newEmail.toLowerCase().trim();
    if (!email) return;
    setLoading(true);

    const { error } = await supabase.from("allowed_emails").insert({ email });
    if (!error) {
      setNewEmail("");
      await fetchData();
    }
    setLoading(false);
  }

  async function removeEmail(id: string) {
    if (!confirm("למחוק אימייל זה מהרשימה?")) return;
    await supabase.from("allowed_emails").delete().eq("id", id);
    await fetchData();
  }

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-dark-200 transition-colors">
          <ArrowRight size={20} />
        </Link>
        <h1 className="section-title mb-0">ניהול תלמידים</h1>
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg bg-dark-300 p-1 mb-6 w-fit">
        <button
          onClick={() => setTab("emails")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === "emails" ? "bg-gold text-black" : "text-gray-400 hover:text-white"
          }`}
        >
          <Mail size={14} />
          אימיילים מורשים ({allowedEmails.length})
        </button>
        <button
          onClick={() => setTab("users")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === "users" ? "bg-gold text-black" : "text-gray-400 hover:text-white"
          }`}
        >
          <Users size={14} />
          משתמשים רשומים ({profiles.length})
        </button>
      </div>

      {/* Allowed Emails Tab */}
      {tab === "emails" && (
        <div className="space-y-4">
          {/* Add email form */}
          <div className="card">
            <h3 className="font-semibold text-white mb-3">הוסף אימייל חדש</h3>
            <form onSubmit={addEmail} className="flex gap-2">
              <input
                type="email"
                className="input flex-1"
                placeholder="student@email.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                dir="ltr"
              />
              <button type="submit" disabled={loading} className="btn-gold flex items-center gap-1.5">
                <Plus size={16} />
                הוסף
              </button>
            </form>
          </div>

          {/* Email list */}
          <div className="card">
            <h3 className="font-semibold text-white mb-4">רשימת אימיילים מורשים</h3>
            {allowedEmails.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">אין אימיילים ברשימה עדיין</p>
            ) : (
              <div className="divide-y divide-dark-400">
                {allowedEmails.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-mono">{item.email}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{formatDate(item.created_at)}</p>
                    </div>
                    <button
                      onClick={() => removeEmail(item.id)}
                      className="text-gray-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-dark-300 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Registered Users Tab */}
      {tab === "users" && (
        <div className="card">
          <h3 className="font-semibold text-white mb-4">משתמשים רשומים</h3>
          {profiles.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">אין משתמשים עדיין</p>
          ) : (
            <div className="divide-y divide-dark-400">
              {profiles.map((profile) => (
                <div key={profile.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{profile.full_name}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {profile.role === "admin" ? "מנהל" : "תלמיד"} · הצטרף {formatDate(profile.created_at)}
                    </p>
                  </div>
                  <Link
                    href={`/profile/${profile.id}`}
                    className="text-xs text-gold hover:text-gold-dark transition-colors"
                  >
                    צפה בפרופיל
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
