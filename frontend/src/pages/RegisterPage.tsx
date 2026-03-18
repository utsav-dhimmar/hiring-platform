import { Container, Row, Col } from "react-bootstrap";
import { Card, CardHeader, CardBody, Button } from "../components/common";
import { Link } from "react-router-dom";

const RegisterPage = () => {
  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card>
            <CardHeader>
              <h2 className="text-center mb-0">Register</h2>
            </CardHeader>
            <CardBody className="text-center py-5">
              <p className="lead mb-4">Registration page is coming soon!</p>
              <Link to="/login">
                <Button variant="primary">Back to Login</Button>
              </Link>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default RegisterPage;
