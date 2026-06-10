// @ts-nocheck
import { ReferrerProfileLevel } from "@/referral-app/api";

export const LEVEL_NAMES: Record<string, Record<string, string>> = {
  GUARD: {
    [ReferrerProfileLevel.BEGINNER]: "Naya Banda",
    [ReferrerProfileLevel.EXPLORER]: "Regular",
    [ReferrerProfileLevel.HUSTLER]: "Senior",
    [ReferrerProfileLevel.PRO]: "Expert",
    [ReferrerProfileLevel.LEGEND]: "Boss",
  },
  STUDENT: {
    [ReferrerProfileLevel.BEGINNER]: "Fresher",
    [ReferrerProfileLevel.EXPLORER]: "Intern",
    [ReferrerProfileLevel.HUSTLER]: "Campus Pro",
    [ReferrerProfileLevel.PRO]: "Alumni",
    [ReferrerProfileLevel.LEGEND]: "Legend",
  },
  EARNER: {
    [ReferrerProfileLevel.BEGINNER]: "Trainee",
    [ReferrerProfileLevel.EXPLORER]: "Agent",
    [ReferrerProfileLevel.HUSTLER]: "Senior Agent",
    [ReferrerProfileLevel.PRO]: "Pro Agent",
    [ReferrerProfileLevel.LEGEND]: "Elite Closer",
  },
  BROKER: {
    [ReferrerProfileLevel.BEGINNER]: "Junior Broker",
    [ReferrerProfileLevel.EXPLORER]: "Broker",
    [ReferrerProfileLevel.HUSTLER]: "Senior Broker",
    [ReferrerProfileLevel.PRO]: "Master Broker",
    [ReferrerProfileLevel.LEGEND]: "Elite Broker",
  },
  INFLUENCER: {
    [ReferrerProfileLevel.BEGINNER]: "Nano Creator",
    [ReferrerProfileLevel.EXPLORER]: "Micro Creator",
    [ReferrerProfileLevel.HUSTLER]: "Creator",
    [ReferrerProfileLevel.PRO]: "Top Creator",
    [ReferrerProfileLevel.LEGEND]: "Creator Legend",
  },
  CORPORATE_HR: {
    [ReferrerProfileLevel.BEGINNER]: "HR Associate",
    [ReferrerProfileLevel.EXPLORER]: "HR Executive",
    [ReferrerProfileLevel.HUSTLER]: "HR Manager",
    [ReferrerProfileLevel.PRO]: "HR Director",
    [ReferrerProfileLevel.LEGEND]: "CHRO",
  },
  PG_MANAGER: {
    [ReferrerProfileLevel.BEGINNER]: "New Manager",
    [ReferrerProfileLevel.EXPLORER]: "Active Manager",
    [ReferrerProfileLevel.HUSTLER]: "Pro Manager",
    [ReferrerProfileLevel.PRO]: "Top Manager",
    [ReferrerProfileLevel.LEGEND]: "Elite Manager",
  },
};

export const BADGE_ICONS: Record<string, string> = {
  "First Home": "🏠",
  "Money Maker": "💰",
  "On Fire": "🔥",
  "Speed Closer": "⚡",
  "Top Earner": "👑",
  "Sharpshooter": "🎯",
  "Team Expert": "🏆",
  "Streak King": "🌊",
  "Influencer": "📱",
  "Corporate Pro": "🏢",
};

export const BADGE_DESCRIPTIONS: Record<string, string> = {
  "First Home": "First referral submitted",
  "Money Maker": "First ₹500 earned",
  "On Fire": "3 referrals in a week",
  "Speed Closer": "Lead verified within 24h",
  "Top Earner": "Reached #1 on leaderboard",
  "Sharpshooter": "80%+ conversion rate",
  "Team Expert": "Led team to #1 position",
  "Streak King": "30-day daily check-in streak",
  "Influencer": "500+ clicks on referral link",
  "Corporate Pro": "Housed 10+ employees",
};

export const PERSONA_THEMES: Record<string, { bg: string; text: string; accent: string; emoji: string; title: string }> = {
  GUARD: { bg: "bg-zinc-900", text: "text-white", accent: "text-orange-400", emoji: "🛡️", title: "Daily Worker" },
  STUDENT: { bg: "bg-orange-50", text: "text-slate-900", accent: "text-orange-600", emoji: "🎓", title: "Student" },
  EARNER: { bg: "bg-slate-50", text: "text-slate-900", accent: "text-primary", emoji: "💼", title: "Side Hustler" },
  PG_MANAGER: { bg: "bg-blue-50", text: "text-blue-950", accent: "text-blue-600", emoji: "🏠", title: "PG Manager" },
  BROKER: { bg: "bg-slate-900", text: "text-white", accent: "text-green-400", emoji: "🤝", title: "Broker" },
  INFLUENCER: { bg: "bg-purple-50", text: "text-purple-950", accent: "text-purple-600", emoji: "📱", title: "Influencer" },
  CORPORATE_HR: { bg: "bg-indigo-50", text: "text-indigo-950", accent: "text-indigo-600", emoji: "🏢", title: "Corporate HR" },
};
