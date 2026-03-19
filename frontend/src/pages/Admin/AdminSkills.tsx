/**
 * Admin page for managing skills.
 * Displays all skills with ability to create, edit, and delete.
 */

import { useEffect, useState, useCallback } from "react";
import { adminSkillService } from "../../apis/admin/service";
import type { SkillRead } from "../../apis/admin/types";
import { Card, CardBody, Button, DeleteModal } from "../../components/common";
import CreateSkillModal from "./CreateSkillModal";
import axios from "axios";
import "../../css/adminDashboard.css";

const AdminSkills = () => {
  const [skills, setSkills] = useState<SkillRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<SkillRead | null>(null);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState<SkillRead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchSkills = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminSkillService.getAllSkills();
      setSkills(data);
    } catch (err) {
      console.error("Failed to fetch skills:", err);
      setError("Failed to load skills.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  const handleCreateClick = () => {
    setSelectedSkill(null);
    setShowModal(true);
  };

  const handleEditClick = (skill: SkillRead) => {
    setSelectedSkill(skill);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSkill(null);
  };

  const handleDeleteClick = (skill: SkillRead) => {
    setSkillToDelete(skill);
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!skillToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);
    try {
      await adminSkillService.deleteSkill(skillToDelete.id);
      await fetchSkills();
      setShowDeleteModal(false);
      setSkillToDelete(null);
    } catch (err: unknown) {
      let errorMsg = "Failed to delete skill.";
      if (axios.isAxiosError(err)) {
        errorMsg = err.response?.data?.detail || err.message || errorMsg;
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }
      setDeleteError(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading && skills.length === 0)
    return <div className="admin-loading">Loading skills...</div>;
  if (error && skills.length === 0)
    return <div className="admin-error">{error}</div>;

  return (
    <div className="admin-dashboard">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Skill Management</h1>
        <Button variant="primary" onClick={handleCreateClick}>
          Create Skill
        </Button>
      </div>

      <Card>
        <CardBody>
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {skills.map((skill) => (
                  <tr key={skill.id}>
                    <td>{skill.name}</td>
                    <td>{skill.description || "N/A"}</td>
                    <td>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="me-2"
                        onClick={() => handleEditClick(skill)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteClick(skill)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <CreateSkillModal
        show={showModal}
        handleClose={handleCloseModal}
        onSkillSaved={fetchSkills}
        skill={selectedSkill}
      />

      <DeleteModal
        show={showDeleteModal}
        handleClose={() => setShowDeleteModal(false)}
        handleConfirm={handleConfirmDelete}
        title="Delete Skill"
        message={`Are you sure you want to delete skill "${skillToDelete?.name}"? This action cannot be undone.`}
        isLoading={isDeleting}
        error={deleteError}
      />
    </div>
  );
};

export default AdminSkills;
