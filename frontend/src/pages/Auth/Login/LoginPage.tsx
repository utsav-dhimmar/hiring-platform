/**
 * Login page for user authentication.
 * Provides email/password form with validation and error handling.
 */

import { useState } from "react";
import { Container, Row, Col, Alert } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/store/slices/authSlice";
import { authService } from "@/apis/auth";
import { Card, CardHeader, CardBody, Input, Button } from "@/components/shared";
import { loginSchema, type LoginFormValues } from "@/schemas/auth";
import { extractErrorMessage } from "@/utils/error";

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
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
      navigate("/");
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(err, "Failed to login. Please check your credentials.");
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="py-5 min-vh-100 d-flex align-items-center justify-content-center">
      <Row className="justify-content-center w-100">
        <Col md={8} lg={5} xl={4}>
          <Card className="shadow-lg border-0 rounded-4 overflow-hidden">
            <CardHeader className="bg-white border-0 pt-5 pb-2">
              <h2 className="text-center fw-bold mb-0">Welcome Back</h2>
              <p className="text-center text-muted mt-2">Sign in to manage your hiring</p>
            </CardHeader>
            <CardBody className="px-4 pb-5">
              {error && (
                <Alert variant="danger" className="rounded-3 border-0 shadow-sm mb-4">
                  {error}
                </Alert>
              )}
              <form onSubmit={handleSubmit(onSubmit)}>
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@example.com"
                  {...register("email")}
                  error={errors.email?.message}
                  className="mb-4"
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  {...register("password")}
                  error={errors.password?.message}
                  className="mb-4"
                />
                <Button
                  type="submit"
                  variant="primary"
                  className="w-100 py-3 fw-bold rounded-3"
                  isLoading={isLoading}
                >
                  Sign In
                </Button>
              </form>
              <div className="text-center mt-4">
                <p className="text-muted small">
                  Don't have an account?{" "}
                  <Link to="/register" className="text-primary fw-semibold text-decoration-none">
                    Create one
                  </Link>
                </p>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginPage;
