import apiClient from "@/apis/client";
import type { DepartmentCreate, DepartmentRead, DepartmentUpdate } from "@/types/admin";

/**
 * Service for managing departments via the admin API.
 */
export const adminDepartmentService = {
  /**
   * Retrieves all departments with optional pagination.
   * @param skip - Number of records to skip (default: 0)
   * @param limit - Maximum number of records to return (default: 100)
   */
  getAllDepartments: async (
    skip = 0,
    limit = 100,
  ): Promise<{ data: DepartmentRead[]; total: number }> => {
    const response = await apiClient.get<{ data: DepartmentRead[]; total: number }>(
      "/departments",
      {
        params: { skip, limit },
      },
    );
    return response.data;
  },

  /**
   * Retrieves a single department by its ID.
   * @param departmentId - UUID of the department to retrieve
   */
  getDepartmentById: async (departmentId: string): Promise<DepartmentRead> => {
    const response = await apiClient.get<DepartmentRead>(`/departments/${departmentId}`);
    return response.data;
  },

  /**
   * Creates a new department.
   * @param data - Department creation payload
   */
  createDepartment: async (data: DepartmentCreate): Promise<DepartmentRead> => {
    const response = await apiClient.post<DepartmentRead>("/departments/", data);
    return response.data;
  },

  /**
   * Updates an existing department.
   * @param departmentId - UUID of the department to update
   * @param data - Fields to update
   */
  updateDepartment: async (
    departmentId: string,
    data: DepartmentUpdate,
  ): Promise<DepartmentRead> => {
    const response = await apiClient.patch<DepartmentRead>(`/departments/${departmentId}`, data);
    return response.data;
  },

  /**
   * Deletes a department by its ID.
   * @param departmentId - UUID of the department to delete
   */
  deleteDepartment: async (departmentId: string): Promise<void> => {
    await apiClient.delete(`/departments/${departmentId}`);
  },
};
