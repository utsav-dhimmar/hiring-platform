import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { StageTemplate } from "@/types/stage";
import { useEffect, useState } from "react";

interface StageDetailSheetProps {
  /** Whether the sheet is open */
  isOpen: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Stage template to display/edit */
  template: StageTemplate | null;
  /** Display mode: "show" for read-only or "edit" for editing */
  mode: "show" | "edit";
}

/**
 * Side panel for viewing or editing stage template details.
 * Slides in from the right side of the screen.
 */
export const StageDetailSheet = ({
  isOpen,
  onOpenChange,
  template,
  mode,
}: StageDetailSheetProps) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || "",
        description: template.description || "",
      });
    }
  }, [template]);

  const isReadOnly = mode === "show";

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {isReadOnly ? "Stage Template Details" : "Edit Stage Template"}
          </SheetTitle>
          <SheetDescription>
            {isReadOnly 
              ? "View the configuration for this interview stage template." 
              : "Update the details for this stage template."}
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-6 py-6 px-1">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              readOnly={isReadOnly}
              className={isReadOnly ? "bg-muted cursor-default focus-visible:ring-0" : ""}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              readOnly={isReadOnly}
              rows={4}
              className={isReadOnly ? "bg-muted cursor-default focus-visible:ring-0" : ""}
            />
          </div>

          <div className="grid gap-2">
            <Label>Default Configuration</Label>
            <div className="rounded-md bg-slate-950 p-4 overflow-auto max-h-60">
              <pre className="text-xs text-slate-50 font-mono">
                {JSON.stringify(template?.default_config || {}, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {!isReadOnly && (
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              console.log("Saving template:", formData);
              onOpenChange(false);
            }}>
              Save Changes
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
