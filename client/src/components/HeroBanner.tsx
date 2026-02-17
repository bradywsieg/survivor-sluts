import heroImage from "@assets/generated_images/tropical_island_sunset_panorama.png";

interface HeroBannerProps {
  title?: string;
  subtitle?: string;
}

export default function HeroBanner({ 
  title = "Survivor Fantasy League", 
  subtitle = "Track your tribe, dominate the game" 
}: HeroBannerProps) {
  return (
    <div className="relative h-64 md:h-80 overflow-hidden">
      <img
        src={heroImage}
        alt="Tropical island paradise"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        <h1 
          className="text-4xl md:text-6xl font-bold text-white font-['Slackey'] tracking-wide drop-shadow-lg"
          style={{ textShadow: '3px 3px 0 rgba(0,0,0,0.4)' }}
          data-testid="text-hero-title"
        >
          {title}
        </h1>
        <p 
          className="mt-2 text-lg md:text-xl text-white/90 font-medium drop-shadow"
          data-testid="text-hero-subtitle"
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
}
