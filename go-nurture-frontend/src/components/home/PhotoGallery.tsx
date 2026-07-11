"use client";

import React from "react";
import Image from "next/image";
import { Heart } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

const photos = [
  {
    src: "/hero_2.jfif",
    alt: "Community support gathering",
    captionKey: "gallery.caption1",
  },
  {
    src: "/hero_3.jfif",
    alt: "Mother and child care",
    captionKey: "gallery.caption2",
  },
  {
    src: "/hero_4.jfif",
    alt: "Perinatal education session",
    captionKey: "gallery.caption3",
  },
];

export function PhotoGallery() {
  const { t } = useLanguage();
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-(--color-accent)">
            {t("gallery.sectionLabel")}
          </p>
          <h2 className="font-heading text-3xl font-bold text-(--color-primary) sm:text-4xl">
            {t("gallery.sectionTitle")}
          </h2>
          <p className="mt-4 text-lg text-(--color-text-muted)">
            {t("gallery.sectionDesc")}
          </p>
        </div>

        {/* Photo Grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <div
              key={photo.src}
              className="group relative overflow-hidden rounded-2xl shadow-sm transition-all duration-500 hover:shadow-xl"
            >
              <div className="aspect-4/3 relative">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />
              </div>
              {/* Caption */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="flex items-center gap-2 text-sm font-medium text-white">
                  <Heart size={14} className="text-(--color-accent-light)" fill="currentColor" />
                  {t(photo.captionKey)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom text */}
        <div className="mx-auto mt-12 max-w-2xl text-center">
          <p className="text-sm text-(--color-text-muted)">
            {t("gallery.bottomText")}
          </p>
        </div>
      </div>
    </section>
  );
}
