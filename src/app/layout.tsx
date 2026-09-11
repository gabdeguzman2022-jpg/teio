import type { Metadata } from "next";
import { Space_Grotesk, Manrope } from "next/font/google";
import "./globals.css";
import { TutorLauncher } from "@/components/TutorLauncher";
import { getAiMessagesUsedToday, getOrCreateLocalProfile } from "@/lib/db/queries";
import { canUseAiTutor } from "@/lib/gamification/tiers";
import { TIER_LIMITS } from "@/lib/types";

export const dynamic = "force-dynamic";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Teio",
  description: "A gamified STEM learning app for grades 7-12.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const { tier } = getOrCreateLocalProfile();
  const messagesUsedToday = getAiMessagesUsedToday();
  const canChat = canUseAiTutor(tier, messagesUsedToday);
  const messageLimit = TIER_LIMITS[tier].aiMessagesPerDay;

  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-cream text-ink">
        {children}
        <TutorLauncher canChat={canChat} messagesUsedToday={messagesUsedToday} messageLimit={messageLimit} />
      </body>
    </html>
  );
}
