import { useState, useRef, useEffect } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignOutButton } from "./SignOutButton";

interface ProfileMenuProps {
  onEditProfile: () => void;
}

export function ProfileMenu({ onEditProfile }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { isAuthenticated } = useConvexAuth();
  const myProfile = useQuery(api.userProfiles.getMyProfile);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isAuthenticated) return null;

  const displayName = myProfile?.displayName || "Anonymous";
  const initial = displayName[0]?.toUpperCase() || "?";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 pr-3 rounded-full hover:bg-[#F6F1E7] dark:hover:bg-[#3A3323] transition-all border border-[#EAE0C8] dark:border-[#3A3323] shadow-sm bg-white dark:bg-[#221D13]"
      >
        <div className="w-8 h-8 rounded-full bg-[#5C6E4E] text-white flex items-center justify-center font-bold text-sm shadow-inner ring-2 ring-white dark:ring-[#221D13]">
          {initial}
        </div>
        <span className="max-w-[100px] truncate text-sm font-medium text-[#201C16] dark:text-[#EDE6D3]">
          {displayName}
        </span>
        <svg className={`w-4 h-4 text-[#6B6455] dark:text-[#93876A] transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#221D13] rounded-2xl shadow-2xl border border-[#EAE0C8] dark:border-[#3A3323] overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
          <div className="p-4 border-b border-[#EAE0C8] dark:border-[#3A3323] bg-gradient-to-br from-[#5C6E4E]/5 to-transparent">
            <p className="text-xs font-bold uppercase tracking-wider text-[#6B6455] dark:text-[#93876A] mb-1">Account</p>
            <p className="text-sm font-semibold text-[#201C16] dark:text-[#EDE6D3] truncate">{displayName}</p>
            <p className="text-[10px] text-[#6B6455] dark:text-[#93876A] mt-0.5">
               Signed in via {myProfile ? "Account" : "Anonymous Session"}
            </p>
          </div>
          
          <div className="p-2">
            <button
               onClick={() => {
                 setIsOpen(false);
                 onEditProfile();
               }}
               className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#6B6455] dark:text-[#93876A] hover:bg-[#F6F1E7] dark:hover:bg-[#3A3323] rounded-xl transition-colors text-left"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Edit Profile
            </button>

            <SignOutButton />
          </div>
        </div>
      )}
    </div>
  );
}
