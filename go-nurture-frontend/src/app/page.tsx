import { HeroSection } from "@/components/home/HeroSection";
import { PhotoGallery } from "@/components/home/PhotoGallery";
import { HomeSections } from "@/components/home/HomeSections";

export default function Home() {
  return (
    <>
      <HeroSection />
      <HomeSections />
      <PhotoGallery />
    </>
  );
}
