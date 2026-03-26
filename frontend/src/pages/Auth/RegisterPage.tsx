/**
 * Registration page for new user account creation.
 * Provides a form with name, email, and password fields with validation.
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { registerSchema, type RegisterFormValues } from "@/schemas/auth";
import { authService } from "@/apis/auth";
import { extractErrorMessage } from "@/utils/error";
import {
  Button,
  Card,
  Input,
} from "@/components/shared";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.register(data);
      setIsSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(
        err,
        "Registration failed. Please try again.",
      );
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="py-5 min-h-screen flex items-center justify-center">
        <div className="flex justify-center w-full max-w-md">
          <Card className="shadow-lg border-0 rounded-4 overflow-hidden text-center p-4">
            <div className="py-5">
              <div className="mb-4">
                <div
                  className="bg-green-100 text-green-600 rounded-full inline-flex items-center justify-center mb-3"
                  style={{ width: "80px", height: "80px" }}
                >
                  <CheckCircle className="h-10 w-10" />
                </div>
                <h2 className="font-bold mb-3">Registration Successful</h2>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-green-800">
                Your account has been created successfully! Redirecting you to
                the login page...
              </div>
              <Link to="/login">
                <Button className="w-full py-3 font-bold rounded-lg">
                  Go to Login Now
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="py-5 min-h-screen flex items-center justify-center">
      <div className="flex justify-center w-full max-w-lg">
        <Card className="shadow-lg border-0 rounded-4 overflow-hidden w-full">
          <div className="bg-white border-0 pt-5 pb-2 px-4">
            <h2 className="text-center font-bold mb-0">Create Account</h2>
            <p className="text-center text-muted-foreground mt-2">
              Join our platform and start hiring
            </p>
          </div>
          <div className="px-4 pb-5">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-800">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)}>
              <Input
                label="Full Name"
                type="text"
                placeholder="John Doe"
                {...register("full_name")}
                error={errors.full_name?.message}
                className="mb-3"
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="name@example.com"
                {...register("email")}
                error={errors.email?.message}
                className="mb-3"
              />
              <Input
                label="Password"
                type="password"
                placeholder="Create a strong password"
                {...register("password")}
                error={errors.password?.message}
                className="mb-4"
              />
              <Button
                type="submit"
                className="w-full py-3 font-bold rounded-lg"
                isLoading={isLoading}
              >
                Register
              </Button>
            </form>
            <div className="text-center mt-4">
              <p className="text-muted-foreground text-sm">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-primary font-semibold"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
