import { INFO } from "@/constants";
import { cn } from "@/lib/utils";
import github from "@/assets/logos/svg/github.svg";
import linkedin from "@/assets/logos/svg/linkedin.svg";
import logo from "@/assets/logo.svg";

interface LogoProps {
  src: string;
  alt?: string;
  className?: string;
  variant?: "light" | "dark";
}

export const LogoComponent = ({
  src,
  alt,
  className,
  variant = "light",
}: LogoProps) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img
        src={src}
        alt={alt || INFO.companyName}
        className={cn(
          "h-8 w-auto",
          variant === "dark" && "invert opacity-90"
        )}
      />
    </div>
  );
};

export const GithubLogo = (props: Omit<LogoProps, "src">) => (
  <LogoComponent src={github} {...props} />
);

export const LinkedinLogo = (props: Omit<LogoProps, "src">) => (
  <LogoComponent src={linkedin} {...props} />
);
export const Logo = (props: Omit<LogoProps, "src">) => {
  return <LogoComponent src={logo} {...props} />;

};