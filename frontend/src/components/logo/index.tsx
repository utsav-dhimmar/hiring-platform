import { INFO } from "@/constants";
import { cn } from "@/lib/utils";
import github from "@/assets/logos/svg/github.svg";
import linkedin from "@/assets/logos/svg/linkedin.svg";
import logo from "@/assets/logo.svg";
interface LogoProps {
  className?: string;
  variant?: "light" | "dark";
}

export const GithubLogo = ({ className, variant = "light" }: LogoProps) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img
        src={github}
        alt={INFO.companyName}
        className={cn("h-8 w-auto", variant === "dark" && "invert opacity-90")}
      />
    </div>
  );
};

export const LinkedinLogo = ({ className, variant = "light" }: LogoProps) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img
        src={linkedin}
        alt={INFO.companyName}
        className={cn("h-8 w-auto", variant === "dark" && "invert opacity-90")}
      />
    </div>
  );
};

export const Logo = ({ className, variant = "light" }: LogoProps) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img
        src={logo}
        alt={INFO.companyName}
        className={cn("h-8 w-auto", variant === "dark" && "invert opacity-90")}
      />
    </div>
  );
};
