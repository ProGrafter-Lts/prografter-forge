import logoDark from "@/assets/prografter-logo.png.asset.json";
import logoLight from "@/assets/prografter-logo-light.png.asset.json";

interface LogoProps {
  variant?: "dark" | "light";
  className?: string;
}

const Logo = ({ variant = "dark", className = "h-10 w-auto" }: LogoProps) => {
  const src = variant === "light" ? logoLight.url : logoDark.url;
  return <img src={src} alt="ProGrafter" className={className} loading="eager" />;
};

export default Logo;
