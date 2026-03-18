export interface Job {
  id: string;
  title: string;
  department: string | null;
  jd_text: string | null;
  jd_json: Record<string, unknown> | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
}
