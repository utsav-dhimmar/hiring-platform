import { INFO } from "@/constants";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.svg";
interface LogoProps {
  className?: string;
  variant?: "light" | "dark";
}

export const Logo = ({ className, variant = "light" }: LogoProps) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img
        src={logo}
        alt={INFO.companyName}
        className={cn(
          "h-8 w-auto",
          variant === "dark" && "invert opacity-90"
        )}
      />
    </div>
  );
};

export default Logo;
