import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SITE_CONFIG } from "@/lib/constants";
import { LanguageProvider } from "@/lib/LanguageContext";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://go-nurture-initiative-cic.onrender.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: SITE_CONFIG.name,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description:
    "Free, culturally adapted perinatal education and community support for vulnerable, Minority Ethnic, migrant, refugee, and displaced women in Norfolk.",
  keywords: [
    "perinatal education",
    "community support",
    "Norfolk",
    "minority ethnic women",
    "migrant women",
    "refugee women",
    "culturally adapted care",
    "birth preparation",
    "postnatal support",
    "Community Interest Company",
    "CIC",
    "Go Nurture",
  ],
  authors: [{ name: SITE_CONFIG.name }],
  creator: SITE_CONFIG.name,
  icons: {
    icon: "/LOGO_v1.png",
    apple: "/LOGO_v1.png",
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: siteUrl,
    siteName: SITE_CONFIG.name,
    title: SITE_CONFIG.name,
    description:
      "Free, culturally adapted perinatal education and community support for vulnerable, Minority Ethnic, migrant, refugee, and displaced women in Norfolk.",
    images: [
      {
        url: "/hero_1.jfif",
        width: 1200,
        height: 630,
        alt: `${SITE_CONFIG.name} — Empowering Communities, Bridging Birthing Gaps`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_CONFIG.name,
    description:
      "Free, culturally adapted perinatal education and community support for vulnerable women in Norfolk.",
    images: ["/hero_1.jfif"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
      <LanguageProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 7000,
              style: {
                background: "#436045",
                color: "#fff",
                borderRadius: "0.75rem",
                padding: "12px 16px",
                fontSize: "0.875rem",
                fontWeight: 500,
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
                border: "1px solid #5a7a5c",
              },
              success: {
                iconTheme: {
                  primary: "#6baf9f",
                  secondary: "#fff",
                },
              },
              error: {
                style: {
                  background: "#dc2626",
                  border: "1px solid #ef4444",
                },
                iconTheme: {
                  primary: "#fff",
                  secondary: "#dc2626",
                },
              },
            }}
          />
        </LanguageProvider>
      </body>
    </html>
  );
}