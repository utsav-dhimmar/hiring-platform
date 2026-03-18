import { useState } from 'react';
import { Container } from 'react-bootstrap';
import { Button, Input, Card, CardHeader, CardBody, CardFooter } from './components/common';

function App() {
  const [inputValue, setInputValue] = useState('');

  return (
    <Container className="py-5">
      <h1 className="text-center mb-5">Component Preview</h1>

      <div className="mb-5">
        <h3 className="mb-3">Buttons</h3>
        <div className="d-flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline-primary">Outline Primary</Button>
          <Button variant="outline-secondary">Outline Secondary</Button>
          <Button variant="success">Success</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="warning">Warning</Button>
        </div>
        <div className="d-flex flex-wrap gap-3 mt-3">
          <Button size="sm">Small</Button>
          <Button>Default</Button>
          <Button size="lg">Large</Button>
        </div>
        <div className="d-flex flex-wrap gap-3 mt-3">
          <Button isLoading>Loading</Button>
          <Button disabled>Disabled</Button>
        </div>
      </div>

      <div className="mb-5">
        <h3 className="mb-3">Inputs</h3>
        <div style={{ maxWidth: 400 }}>
          <Input
            label="Email Address"
            type="email"
            placeholder="Enter your email"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <Input
            label="With Helper Text"
            type="text"
            placeholder="Some text here"
            helperText="We'll never share your email."
            className="mt-3"
          />
          <Input
            label="With Error"
            type="text"
            placeholder="Invalid input"
            error="This field is required"
            className="mt-3"
          />
          <Input
            label="Password"
            type="password"
            placeholder="Enter password"
            leftElement={<span>🔒</span>}
            className="mt-3"
          />
          <Input
            label="With Right Element"
            type="text"
            placeholder="Search..."
            rightElement={<span>🔍</span>}
            className="mt-3"
          />
        </div>
      </div>

      <div className="mb-5">
        <h3 className="mb-3">Cards</h3>
        <div className="d-flex flex-wrap gap-4">
          <Card style={{ width: 300 }}>
            <CardHeader>Card Header</CardHeader>
            <CardBody>
              <h5>Basic Card</h5>
              <p>This is a simple card with header and body.</p>
            </CardBody>
            <CardFooter>Card Footer</CardFooter>
          </Card>

          <Card hoverable style={{ width: 300 }}>
            <CardBody>
              <h5>Hoverable Card</h5>
              <p>Hover over this card to see the effect.</p>
            </CardBody>
          </Card>

          <Card clickable onCardClick={() => alert('Card clicked!')} style={{ width: 300 }}>
            <CardBody>
              <h5>Clickable Card</h5>
              <p>Click this card to trigger action.</p>
            </CardBody>
          </Card>
        </div>
      </div>
    </Container>
  );
}

export default App;
