import { HeroSection } from "@/components/home/HeroSection";
import { ImpactStats } from "@/components/home/ImpactStats";
import { PhotoGallery } from "@/components/home/PhotoGallery";
import { HomeOfferFunding } from "@/components/home/HomeOfferFunding";


export default function Home() {
  return (
    <>
      <HeroSection />
      <ImpactStats />
      <PhotoGallery />
      <HomeOfferFunding />
    </>
  );
}