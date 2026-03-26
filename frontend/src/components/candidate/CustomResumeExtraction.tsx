import { useState } from "react";
import { Card, Button, Input } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { resumeService } from "@/apis/resume";
import type { CustomFieldRequest, CustomFieldResponse } from "@/types/resume";
import { useToast } from "@/components/shared";
import { extractErrorMessage } from "@/utils/error";
import { Plus, Trash2, FileText } from "lucide-react";

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
    <div className="custom-resume-extraction">
      <Card className="mb-4 border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="bg-white px-4 py-3 border-b flex justify-between items-center">
          <h5 className="mb-0 font-bold">Custom Resume Extraction</h5>
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            AI Powered
          </Badge>
        </div>
        <div className="p-4">
          <p className="text-muted-foreground mb-4">
            Define specific information you want to extract from this resume. The AI will analyze
            the content based on your descriptions.
          </p>

          <div className="fields-container mb-4">
            {fields.map((field, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 mb-3 items-end">
                <div className="md:col-span-4">
                  <label className="text-sm font-bold text-muted-foreground uppercase">
                    Field Name
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Notice Period"
                    value={field.title}
                    onChange={(e) => handleFieldChange(index, "title", e.target.value)}
                    className="rounded-lg"
                  />
                </div>
                <div className="md:col-span-7">
                  <label className="text-sm font-bold text-muted-foreground uppercase">
                    Extraction Instructions
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Find the notice period mentioned or 'Not Mentioned'"
                    value={field.description}
                    onChange={(e) => handleFieldChange(index, "description", e.target.value)}
                    className="rounded-lg"
                  />
                </div>
                <div className="md:col-span-1 text-end">
                  <Button
                    variant="ghost"
                    className="text-red-500 p-0 mb-1"
                    onClick={() => handleRemoveField(index)}
                    disabled={isExtracting}
                    size="sm"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddField}
              disabled={isExtracting}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Another Field
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleExtract}
              isLoading={isExtracting}
              className="px-4"
            >
              Start Extraction
            </Button>
          </div>

          {results.length > 0 && (
            <div className="results-container mt-5">
              <h6 className="text-sm font-bold uppercase text-muted-foreground mb-3 tracking-wide flex items-center">
                <FileText className="h-4 w-4 mr-2 text-primary" />
                Extraction Results
              </h6>
              <div className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead style={{ width: "30%" }}>Field</TableHead>
                      <TableHead>Extracted Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{result.title}</TableCell>
                        <TableCell>
                          <span className="bg-muted p-2 rounded block w-full">
                            {result.value}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default CustomResumeExtraction;
