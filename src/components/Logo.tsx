import { Link } from "react-router-dom";
import logoDark from "@/assets/prografter-logo-v2.png";
import logoLight from "@/assets/prografter-logo-light-v2.png";

interface LogoProps {
  variant?: "dark" | "light";
  className?: string;
}

const Logo = ({ variant = "dark", className = "h-10 w-auto" }: LogoProps) => {
  const src = variant === "light" ? logoLight : logoDark;
  return (
    <Link to="/" className={`inline-block ${className}`} aria-label="ProGrafter home">
      <img
        src={src}
        alt="ProGrafter"
        className="h-full w-auto"
        width={1024}
        height={512}
        loading="eager"
      />
    </Link>
  );
};

export default Logo;
