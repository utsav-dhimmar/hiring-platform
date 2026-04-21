import { useState } from "react";
import AppPageShell from "@/components/shared/AppPageShell";
import PageHeader from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { DateDisplay } from "@/components/shared/DateDisplay";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/shared";
import { slugify } from "@/utils/slug";

import { CRITERIA_MOCK_DATA, type CriteriaMock } from "@/constants/admin";

/**
 * Admin page for managing job evaluation criteria.
 * Displays searchable table with create, edit, toggle, and delete functionality.
 */
const AdminJobCriteria = () => {
    const [criteriaData, setCriteriaData] = useState<CriteriaMock[]>(CRITERIA_MOCK_DATA);
    const toast = useToast()
    const navigate = useNavigate()
    const handleToggleActive = async (id: number, isActive: boolean) => {



        // try {
        //     await adminJobService.updateJobCriteria(id, { isactive: isActive });
        //     toast.success("Criteria status updated successfully");
        // } catch (error) {
        //     toast.error("Failed to update criteria status");
        //     // Revert state if needed
        //     setCriteriaData(prev => prev.map(item =>
        //         item.id === id ? { ...item, isactive: !isActive } : item
        //     ));
        // }


        setCriteriaData(prev => prev.map(item =>
            item.id === id ? { ...item, isactive: isActive } : item
        ));
        toast.success("Criteria status updated successfully")
    };

    const handleDelete = (id: number) => {
        // Placeholder for delete logic
        console.log("Delete criteria with id:", id);
        toast.success("Criteria deleted successfully (Mock)");
        setCriteriaData(prev => prev.filter(item => item.id !== id));
    };

    const handleUpdate = (data: CriteriaMock) => {
        const slug = slugify(data.info.name);
        navigate(`/dashboard/admin/criteria-stages/criteria/${slug}/edit`, {
            state: { criteria: data, id: data.id }
        });
    };

    const columns: ColumnDef<CriteriaMock>[] = [
        {
            id: "name",
            accessorFn: (row) => row.info.name,
            header: "Name",
            cell: ({ row }) => (
                <span className="font-medium text-foreground capitalize">{row.original.info.name}</span>
            ),
        },
        {
            id: "description",
            accessorFn: (row) => row.info.description,
            header: "Description",
            cell: ({ row }) => (
                <span className="text-muted-foreground truncate line-clamp-1 max-w-md">
                    {row.original.info.description}
                </span>
            ),
        },
        {
            accessorKey: "isactive",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="hover:bg-transparent p-0 font-semibold"
                >
                    Active
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Switch
                        checked={row.original.isactive}
                        className="animate-in fade-in duration-500"
                        onCheckedChange={(checked) => handleToggleActive(row.original.id, checked)}
                    />
                    <span className="text-xs text-muted-foreground w-12">
                        {row.original.isactive ? "Active" : "Inactive"}
                    </span>
                </div>
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
        // {
        //     accessorKey: "updated_at",
        //     header: "Updated At",
        //     cell: ({ row }) => <DateDisplay date={row.original.updated_at} />,
        // },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
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
                    searchKey="name"
                    searchPlaceholder="Search criteria..."
                    initialSorting={[{ id: "created_at", desc: true }]}
                    entityName="Criteria"
                />
            </div>
        </AppPageShell>
    );
};

export default AdminJobCriteria;
