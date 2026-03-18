import { Container, Row, Col } from "react-bootstrap";
import { Card, CardHeader, CardBody, Button } from "../../components/common";
import { useAppDispatch } from "../../store/hooks";
import { logout } from "../../store/slices/authSlice";

const HomePage = () => {
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card>
            <CardHeader>
              <h2 className="text-center mb-0">Welcome to Hiring Platform</h2>
            </CardHeader>
            <CardBody className="text-center py-5">
              <p className="lead mb-4">
                The modern way to manage your recruitment process efficiently.
              </p>
              <div className="d-flex justify-content-center gap-3">
                <Button variant="danger" onClick={handleLogout}>
                  Logout
                </Button>
                <Button variant="outline-primary">Learn More</Button>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default HomePage;
