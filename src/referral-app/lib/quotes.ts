// @ts-nocheck
export const PERSONA_QUOTES: Record<string, string[]> = {
  GUARD: [
    "Har referral ek naya mauka hai. Bhej do! 🔥",
    "Mehnat ka phal meetha hota hai. Aaj bhi ek refer karo.",
    "Tu hi apna boss hai. Aur paisa tere haath mein hai. 💰",
    "Chhota kadam, bada faida. Bas ek call kar.",
    "Kal ka kal dekha jayega · aaj refer karo!",
  ],
  STUDENT: [
    "Your side hustle can pay your next semester's fees! 🎓",
    "One referral = Netflix + Spotify + Swiggy for a month.",
    "Your network is your net worth. Share your link today!",
    "Turn your WhatsApp into a wallet. Refer a friend now.",
    "Every PG booking is one step closer to financial freedom. 🚀",
  ],
  EARNER: [
    "Pipeline full = wallet full. Keep pushing leads. 📈",
    "Your next ₹500 is just one booking away.",
    "Top earners don't wait for leads · they create them.",
    "Consistency beats talent. Keep the referrals flowing.",
    "Every verified lead is compounding interest on your hustle. 💼",
  ],
  PG_MANAGER: [
    "A full room is a happy room. List your vacancies today. 🏠",
    "Your PG is someone's first home in the city · make it great.",
    "Verified listings get 3x more leads. Keep yours updated.",
    "Every empty room is a missed opportunity. Fill it fast.",
    "Great property + great referrals = zero vacancy. 🏡",
  ],
  BROKER: [
    "Your reputation is built one placement at a time. 🤝",
    "Top brokers close 3x more by following up faster.",
    "Every area you know is a market you own.",
    "Data beats gut. Track your pipeline daily.",
    "Commission is just the beginning · relationships last forever. 💼",
  ],
  INFLUENCER: [
    "Your audience trusts you. Turn that trust into income. 📱",
    "Every post is a potential ₹500. Share your link today.",
    "Authentic content converts. Be real, earn real.",
    "Your followers are looking for a PG · help them find one.",
    "One story, one reel, one link · one booking. 🎥",
  ],
  CORPORATE_HR: [
    "Happy employees start with a great home. Help them settle in. 🏢",
    "Housing support = 40% better employee retention.",
    "Every hire you house is a problem you've solved for good.",
    "New city, new job, new home · you can make all three happen.",
    "The best onboarding starts before Day 1. Find them a home. 🤝",
  ],
};

export function getDailyQuote(persona: string): string {
  const quotes = PERSONA_QUOTES[persona] ?? PERSONA_QUOTES.EARNER;
  const dayOfYear = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return quotes[dayOfYear % quotes.length];
}
