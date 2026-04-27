import { useState, useEffect } from "react";
import AppPageShell from "@/components/shared/AppPageShell";
import PageHeader from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { DateDisplay } from "@/components/shared/DateDisplay";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Pencil, Trash2, Plus, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/shared";
import { slugify } from "@/utils/slug";

import { adminCriteriaService, type CriterionRead } from "@/apis/admin";
import { CriteriaInfoModal } from "@/components/admin/CriteriaInfoModal";

/**
 * Admin page for managing job evaluation criteria.
 * Displays searchable table with create, edit, toggle, and delete functionality.
 */
const AdminJobCriteria = () => {
    const [criteriaData, setCriteriaData] = useState<CriterionRead[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCriterion, setSelectedCriterion] = useState<CriterionRead | null>(null);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const toast = useToast();
    const navigate = useNavigate();

    const fetchCriteria = async () => {
        try {
            setIsLoading(true);
            const data = await adminCriteriaService.getAllCriteria();
            setCriteriaData(data);
        } catch (error) {
            console.error("Failed to fetch criteria:", error);
            toast.error("Failed to load criteria");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCriteria();
    }, []);

    const handleDelete = async (id: string) => {
        try {
            await adminCriteriaService.deleteCriterion(id);
            toast.success("Criteria deleted successfully");
            setCriteriaData(prev => prev.filter(item => item.id !== id));
        } catch (error) {
            console.error("Failed to delete criteria:", error);
            toast.error("Failed to delete criteria");
        }
    };

    const handleUpdate = (data: CriterionRead) => {
        const slug = slugify(data.name);
        navigate(`/dashboard/admin/criteria-stages/criteria/${slug}/edit`, {
            state: { criteria: data, id: data.id }
        });
    };

    const handleOpenInfo = (data: CriterionRead) => {
        setSelectedCriterion(data);
        setIsInfoModalOpen(true);
    };

    const columns: ColumnDef<CriterionRead>[] = [
        {
            id: "name",
            accessorKey: "name",
            header: "Name",
            cell: ({ row }) => (
                <span className="font-medium text-foreground capitalize">{row.original.name}</span>
            ),
        },
        {
            id: "description",
            accessorKey: "description",
            header: "Description",
            cell: ({ row }) => (
                <span className="text-muted-foreground truncate line-clamp-1 max-w-md">
                    {row.original.description || "No description"}
                </span>
            ),
        },
        {
            accessorKey: "created_at",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="hover:bg-transparent p-0 font-semibold"
                >
                    Created At
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <DateDisplay date={row.original.created_at} />,
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenInfo(row.original)}
                        className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                    >
                        <Info className="h-4 w-4" />
                        <span className="sr-only">Info</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleUpdate(row.original)}
                        className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                    >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Update</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(row.original.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <AppPageShell width="wide">
            <PageHeader
                title="Job Criteria Configuration"
                actions={
                    <Button
                        onClick={() => navigate("/dashboard/admin/criteria-stages/criteria/new")}
                        className="gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add Criteria
                    </Button>
                }
            />
            <div className="mt-6">
                <DataTable
                    columns={columns}
                    data={criteriaData}
                    loading={isLoading}
                    searchKey="name"
                    searchPlaceholder="Search criteria..."
                    initialSorting={[{ id: "created_at", desc: true }]}
                    entityName="Criteria"
                />
            </div>

            <CriteriaInfoModal
                criterion={selectedCriterion}
                isOpen={isInfoModalOpen}
                onClose={() => setIsInfoModalOpen(false)}
            />
        </AppPageShell>
    );
};

export default AdminJobCriteria;
