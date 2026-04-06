/**
 * Login page for user authentication.
 * Provides email/password form with validation and error handling.
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/store/slices/authSlice";
import { authService } from "@/apis/auth";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Logo,
} from "@/components";
import { loginSchema, type LoginFormValues } from "@/schemas/auth";
import { extractErrorMessage } from "@/utils/error";
import { INFO } from "@/constants";
import { useTheme } from "@/components/shared/theme-provider";

const LoginPage = () => {
  const { theme } = useTheme()
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(data);
      dispatch(
        setCredentials({
          user: response.user,
          access_token: response.access_token,
          refresh_token: response.refresh_token,
        }),
      );
      navigate("/dashboard");
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(err, "Failed to login. Please check your credentials.");
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex min-h-screen flex-col bg-muted/30">
        <header className="absolute left-0 top-0 z-10 flex w-full items-center justify-center px-6 py-5 sm:px-8">
          <Link to="/" className="transition-opacity hover:opacity-80">
            <Logo variant={theme === "dark" ? "light" : "dark"} className="h-10" />
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
          <div className="w-full max-w-md pt-16 sm:pt-12">
            <Card className="shadow-xl border-border/50 rounded-2xl overflow-hidden bg-card">
              <CardHeader className="space-y-2 pt-5 pb-6 text-center">
                <CardTitle className="text-3xl font-extrabold tracking-tight">
                  Welcome Back
                </CardTitle>
                <CardDescription className="text-muted-foreground text-base">
                  Sign in to manage your hiring
                </CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-5">
                {error && (
                  <div
                    role="alert"
                    className="bg-destructive/10 text-destructive text-sm p-4 rounded-xl border border-destructive/20 mb-6 animate-in fade-in slide-in-from-top-1"
                  >
                    {error}
                  </div>
                )}
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold">Email Address</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="name@example.com"
                                autoComplete="email"
                                className="h-11 rounded-xl"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold">Password</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                className="h-11 rounded-xl"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-bold rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Signing In...</span>
                        </div>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>
                </Form>

                <div className="mt-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <Link
                      to="/register"
                      className="text-primary font-bold hover:underline underline-offset-4"
                    >
                      Create one
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <footer className="flex w-full items-center justify-center px-6 py-5 sm:px-8">
          <p className="text-sm text-muted-foreground">{INFO.copyright}</p>
        </footer>
      </div>
    </>
  );
};

export default LoginPage;
