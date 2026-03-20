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
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={6} lg={4}>
            <Card>
              <CardHeader>
                <h3 className="text-center mb-0">Registration Successful</h3>
              </CardHeader>
              <CardBody className="text-center">
                <Alert variant="success">
                  Your account has been created successfully! Redirecting you to the login page...
                </Alert>
                <Link to="/login">
                  <Button variant="primary" className="w-100">
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
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} lg={4}>
          <Card>
            <CardHeader>
              <h3 className="text-center mb-0">Create Account</h3>
            </CardHeader>
            <CardBody>
              {error && <Alert variant="danger">{error}</Alert>}
              <form onSubmit={handleSubmit(onSubmit)}>
                <Input
                  label="Full Name"
                  type="text"
                  placeholder="Enter your full name"
                  {...register("full_name")}
                  error={errors.full_name?.message}
                  className="mb-3"
                />
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="Enter your email"
                  {...register("email")}
                  error={errors.email?.message}
                  className="mb-3"
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="Create a password"
                  {...register("password")}
                  error={errors.password?.message}
                  className="mb-4"
                />
                <Button type="submit" variant="primary" className="w-100" isLoading={isLoading}>
                  Register
                </Button>
              </form>
              <div className="text-center mt-3">
                <p className="text-muted">
                  Already have an account? <Link to="/login">Sign In</Link>
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
