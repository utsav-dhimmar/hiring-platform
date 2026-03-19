/**
 * Login page for user authentication.
 * Provides email/password form with validation and error handling.
 */

import { useState } from "react";
import { Container, Row, Col, Alert } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAppDispatch } from "../../store/hooks";
import { setCredentials } from "../../store/slices/authSlice";
import { authService } from "../../apis/services/auth";
import {
  Card,
  CardHeader,
  CardBody,
  Input,
  Button,
} from "../../components/common";
import { loginSchema, type LoginFormValues } from "../../schemas/auth";

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
      let errorMsg = "Failed to login. Please check your credentials.";
      if (axios.isAxiosError(err)) {
        errorMsg = err.response?.data?.detail || err.message || errorMsg;
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} lg={4}>
          <Card>
            <CardHeader>
              <h3 className="text-center mb-0">Login</h3>
            </CardHeader>
            <CardBody>
              {error && <Alert variant="danger">{error}</Alert>}
              <form onSubmit={handleSubmit(onSubmit)}>
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
                  placeholder="Enter password"
                  {...register("password")}
                  error={errors.password?.message}
                  className="mb-4"
                />
                <Button
                  type="submit"
                  variant="primary"
                  className="w-100"
                  isLoading={isLoading}
                >
                  Sign In
                </Button>
              </form>
              <div className="text-center mt-3">
                <p className="text-muted">
                  Don't have an account? <Link to="/register">Register</Link>
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
