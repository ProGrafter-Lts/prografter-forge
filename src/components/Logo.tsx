import { Link } from "react-router-dom";
import logoDark from "@/assets/prografter-logo.png.asset.json";
import logoLight from "@/assets/prografter-logo-light.png.asset.json";

interface LogoProps {
  variant?: "dark" | "light";
  className?: string;
}

const Logo = ({ variant = "dark", className = "h-10 w-auto" }: LogoProps) => {
  const src = variant === "light" ? logoLight.url : logoDark.url;
  return (
    <Link to="/" className={`inline-block ${className}`} aria-label="ProGrafter home">
      <img src={src} alt="ProGrafter" className="h-full w-auto" loading="eager" />
    </Link>
  );
};

export default Logo;
