import { HeroSection } from "@/components/home/HeroSection";
import { ImpactStats } from "@/components/home/ImpactStats";
import { PhotoGallery } from "@/components/home/PhotoGallery";
import { FundingBridgePreview } from "@/components/home/FundingBridgePreview";


export default function Home() {
  return (
    <>
      <HeroSection />
      <ImpactStats />
      <PhotoGallery />
      <FundingBridgePreview />
    </>
  );
}