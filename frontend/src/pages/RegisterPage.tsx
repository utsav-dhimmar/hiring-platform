/**
 * Registration page for new user account creation.
 * Provides a form with name, email, and password fields with validation.
 */

import { useState } from "react";
import { Container, Row, Col, Alert } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../apis/services/auth";
import { Card, CardHeader, CardBody, Input, Button } from "../components/common";
import { registerSchema, type RegisterFormValues } from "../schemas/auth";
import { extractErrorMessage } from "../utils/error";

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
      // Automatically redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(err, "Registration failed. Please try again.");
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Container className="py-5 min-vh-100 d-flex align-items-center justify-content-center">
        <Row className="justify-content-center w-100">
          <Col md={8} lg={5} xl={4}>
            <Card className="shadow-lg border-0 rounded-4 overflow-hidden text-center p-4">
              <CardBody className="py-5">
                <div className="mb-4">
                  <div
                    className="bg-success-subtle text-success rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                    style={{ width: "80px", height: "80px" }}
                  >
                    <i className="bi bi-check-lg display-4 font-weight-bold"></i>
                  </div>
                  <h2 className="fw-bold mb-3">Registration Successful</h2>
                </div>
                <Alert variant="success" className="rounded-3 border-0 shadow-sm mb-4">
                  Your account has been created successfully! Redirecting you to the login page...
                </Alert>
                <Link to="/login">
                  <Button variant="primary" className="w-100 py-3 fw-bold rounded-3">
                    Go to Login Now
                  </Button>
                </Link>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="py-5 min-vh-100 d-flex align-items-center justify-content-center">
      <Row className="justify-content-center w-100">
        <Col md={8} lg={6} xl={5}>
          <Card className="shadow-lg border-0 rounded-4 overflow-hidden">
            <CardHeader className="bg-white border-0 pt-5 pb-2">
              <h2 className="text-center fw-bold mb-0">Create Account</h2>
              <p className="text-center text-muted mt-2">Join our platform and start hiring</p>
            </CardHeader>
            <CardBody className="px-4 pb-5">
              {error && (
                <Alert variant="danger" className="rounded-3 border-0 shadow-sm mb-4">
                  {error}
                </Alert>
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
                  variant="primary"
                  className="w-100 py-3 fw-bold rounded-3"
                  isLoading={isLoading}
                >
                  Register
                </Button>
              </form>
              <div className="text-center mt-4">
                <p className="text-muted small">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary fw-semibold text-decoration-none">
                    Sign In
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

export default RegisterPage;
