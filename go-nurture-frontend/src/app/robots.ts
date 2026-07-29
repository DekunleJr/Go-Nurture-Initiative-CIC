import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://go-nurture-initiative-cic.onrender.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/portal/", "/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}