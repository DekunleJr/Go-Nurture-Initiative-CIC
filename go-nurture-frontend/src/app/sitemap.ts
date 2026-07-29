import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://go-nurture-initiative-cic.onrender.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const publicRoutes = [
    "",
    "/about",
    "/programmes",
    "/community-support",
    "/how-it-works",
    "/venues",
    "/transparency",
    "/contact",
  ];

  return publicRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1.0 : 0.8,
  }));
}