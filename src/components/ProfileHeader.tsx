import Image from "next/image";
import { Profile, Post } from "@/types";
import { getInitials } from "@/lib/utils";
import { BookOpen, Calendar } from "lucide-react";

interface ProfileHeaderProps {
  profile: Profile;
  postCount: number;
  isOwnProfile?: boolean;
}

export default function ProfileHeader({ profile, postCount, isOwnProfile }: ProfileHeaderProps) {
  const joinDate = new Intl.DateTimeFormat("he-IL", {
    month: "long",
    year: "numeric",
  }).format(new Date(profile.created_at));

  return (
    <div className="card mb-6">
      <div className="flex items-start gap-5">
        {/* Avatar */}
        <div className="avatar w-20 h-20 text-2xl flex-shrink-0 ring-2 ring-gold/20">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.full_name}
              width={80}
              height={80}
              className="rounded-full w-full h-full object-cover"
            />
          ) : (
            getInitials(profile.full_name)
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-white">{profile.full_name}</h1>
            {profile.role === "admin" && (
              <span className="badge-gold">מנהל</span>
            )}
            {isOwnProfile && (
              <span className="badge-gray">הפרופיל שלי</span>
            )}
          </div>

          {profile.bio && (
            <p className="text-gray-400 mt-2 text-sm leading-relaxed">{profile.bio}</p>
          )}

          <div className="flex items-center gap-4 mt-3 text-gray-500 text-sm">
            <div className="flex items-center gap-1.5">
              <BookOpen size={14} />
              <span>{postCount} פוסטים</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={14} />
              <span>הצטרף {joinDate}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
