import { useState } from "react";
import { Form, Row, Col, Table, Badge } from "react-bootstrap";
import { Card, CardBody, Button } from "@/components/shared";
import { resumeService } from "@/apis/resume";
import type { CustomFieldRequest, CustomFieldResponse } from "@/types/resume";
import { useToast } from "@/components/shared";
import { extractErrorMessage } from "@/utils/error";

interface CustomResumeExtractionProps {
  jobId: string;
  resumeId: string;
}

const CustomResumeExtraction = ({ jobId, resumeId }: CustomResumeExtractionProps) => {
  const [fields, setFields] = useState<CustomFieldRequest[]>([
    { title: "", description: "" },
  ]);
  const [results, setResults] = useState<CustomFieldResponse[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const toast = useToast();

  const handleAddField = () => {
    setFields([...fields, { title: "", description: "" }]);
  };

  const handleRemoveField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index);
    setFields(newFields.length > 0 ? newFields : [{ title: "", description: "" }]);
  };

  const handleFieldChange = (index: number, key: keyof CustomFieldRequest, value: string) => {
    const newFields = [...fields];
    newFields[index][key] = value;
    setFields(newFields);
  };

  const handleExtract = async () => {
    // Validate fields
    const validFields = fields.filter((f) => f.title.trim() && f.description.trim());
    if (validFields.length === 0) {
      toast.error("Please provide at least one field with a title and description.");
      return;
    }

    try {
      setIsExtracting(true);
      setResults([]);
      const response = await resumeService.extractCustomFields(jobId, resumeId, {
        fields: validFields,
      });
      setResults(response.results);
      toast.success("Custom fields extracted successfully!");
    } catch (err) {
      console.error("Custom extraction failed:", err);
      toast.error(extractErrorMessage(err, "Failed to extract custom fields."));
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="custom-resume-extraction animate-fade-in">
      <Card className="mb-4 border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="bg-white px-4 py-3 border-bottom d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-bold">Custom Resume Extraction</h5>
          <Badge bg="info" className="rounded-pill px-3 py-2">
            AI Powered
          </Badge>
        </div>
        <CardBody className="p-4">
          <p className="text-muted mb-4">
            Define specific information you want to extract from this resume. The AI will analyze
            the content based on your descriptions.
          </p>

          <div className="fields-container mb-4">
            {fields.map((field, index) => (
              <Row key={index} className="g-3 mb-3 align-items-end">
                <Col md={4}>
                  <Form.Group controlId={`field-title-${index}`}>
                    <Form.Label className="small fw-bold text-muted text-uppercase">
                      Field Name
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. Notice Period"
                      value={field.title}
                      onChange={(e) => handleFieldChange(index, "title", e.target.value)}
                      className="rounded-3"
                    />
                  </Form.Group>
                </Col>
                <Col md={7}>
                  <Form.Group controlId={`field-desc-${index}`}>
                    <Form.Label className="small fw-bold text-muted text-uppercase">
                      Extraction Instructions
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. Find the notice period mentioned or 'Not Mentioned'"
                      value={field.description}
                      onChange={(e) => handleFieldChange(index, "description", e.target.value)}
                      className="rounded-3"
                    />
                  </Form.Group>
                </Col>
                <Col md={1} className="text-end">
                  <Button
                    variant="ghost"
                    className="text-danger p-0 mb-1"
                    onClick={() => handleRemoveField(index)}
                    disabled={isExtracting}
                  >
                    <i className="bi bi-trash fs-5"></i>
                  </Button>
                </Col>
              </Row>
            ))}
          </div>

          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={handleAddField}
              disabled={isExtracting}
            >
              <i className="bi bi-plus-lg me-1"></i> Add Another Field
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExtract}
              isLoading={isExtracting}
              className="px-4"
            >
              Start Extraction
            </Button>
          </div>

          {results.length > 0 && (
            <div className="results-container mt-5 animate-slide-up">
              <h6 className="text-uppercase small fw-bold text-muted mb-3 letter-spacing-wide d-flex align-items-center">
                <i className="bi bi-clipboard-data me-2 text-primary"></i>
                Extraction Results
              </h6>
              <div className="table-responsive">
                <Table hover className="align-middle border rounded-3 overflow-hidden">
                  <thead className="bg-light">
                    <tr>
                      <th className="border-0 px-4 py-3" style={{ width: "30%" }}>
                        Field
                      </th>
                      <th className="border-0 px-4 py-3">Extracted Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 fw-medium text-dark">{result.title}</td>
                        <td className="px-4 py-3">
                          <span className="bg-light p-2 rounded-2 d-inline-block w-100 border-0">
                            {result.value}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default CustomResumeExtraction;
