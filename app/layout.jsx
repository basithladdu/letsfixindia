import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SiteAnalytics from "@/components/Analytics";
import "./globals.css";
export const metadata = { title: "LetsFixIndia | A public record", description: "A source-led public record of events, decisions, crises, and responses in India since 2014.", icons: { icon: "/india-flag-icon.svg" } };
export default function RootLayout({ children }) { return <html lang="en"><body><SiteHeader />{children}<SiteFooter /><SiteAnalytics /></body></html>; }
