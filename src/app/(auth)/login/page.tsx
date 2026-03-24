"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("כתובת אימייל או סיסמה שגויים");
    } else {
      router.push("/feed");
      router.refresh();
    }
    setLoading(false);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Check if email is in the allowed list
    const { data: allowed } = await supabase
      .from("allowed_emails")
      .select("email")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (!allowed) {
      setError("כתובת האימייל הזו אינה מורשית להירשם. פנה למנהל התכנית.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      setError(error.message === "User already registered"
        ? "המשתמש כבר רשום. נסה להתחבר."
        : "שגיאה בהרשמה, נסה שנית.");
    } else {
      setSuccess("נרשמת בהצלחה! בדוק את תיבת האימייל לאישור.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-dark">
      <div className="w-full max-w-sm">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-gold text-2xl font-bold">360</span>
          </div>
          <h1 className="text-3xl font-bold text-white">עומק 360</h1>
          <p className="text-gray-400 text-sm mt-1">הרשת החברתית של התכנית</p>
        </div>

        {/* Card */}
        <div className="card">
          {/* Tabs */}
          <div className="flex rounded-lg bg-dark-300 p-1 mb-6">
            <button
              onClick={() => { setMode("login"); setError(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === "login"
                  ? "bg-gold text-black"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              התחברות
            </button>
            <button
              onClick={() => { setMode("register"); setError(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === "register"
                  ? "bg-gold text-black"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              הרשמה
            </button>
          </div>

          {/* Form */}
          <form onSubmit={mode === "login" ? handleLogin : handleRegister} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="label">שם מלא</label>
                <input
                  type="text"
                  className="input"
                  placeholder="ישראל ישראלי"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <label className="label">אימייל</label>
              <input
                type="email"
                className="input"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir="ltr"
              />
            </div>

            <div>
              <label className="label">סיסמה</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                dir="ltr"
              />
              {mode === "register" && (
                <p className="text-xs text-gray-500 mt-1">לפחות 6 תווים</p>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 text-green-400 text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full"
            >
              {loading ? "טוען..." : mode === "login" ? "התחבר" : "הרשם"}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          הרשמה אפשרית רק לתלמידי התכנית
        </p>
      </div>
    </div>
  );
}
