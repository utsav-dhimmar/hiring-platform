/**
 * Admin page for viewing AI prompts.
 * Displays all prompts used by the system with ability to view their content.
 */
import { useState, useEffect } from "react";
import { adminPromptService } from "@/apis/admin";
import type { PromptRead } from "@/types/admin";
import AppPageShell from "@/components/shared/AppPageShell";
import PageHeader from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Button } from "@/components";
import PermissionGuard from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/lib/permissions";
import { ArrowUpDown, Check, Clipboard, FileText, Info } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAdminData } from "@/hooks";
import { ErrorDisplay } from "@/components/shared";
const AdminPrompts = () => {
    const [search, setSearch] = useState("");
    const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });
    const [selectedPrompt, setSelectedPrompt] = useState<PromptRead | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const { data: prompts, loading, error, fetchData, total } = useAdminData(() => adminPromptService.getAllPrompts(pageIndex * pageSize, pageSize), { fetchOnMount: false });
    const handleViewClick = (prompt: PromptRead) => {
        setSelectedPrompt(prompt);
        setIsViewModalOpen(true);
    };

    const [isCopied, setIsCopied] = useState(false);
    useEffect(() => {
        fetchData();
    }, [pageIndex, pageSize, search, fetchData]);
    const [overallTotal, setOverallTotal] = useState(0);
    useEffect(() => {
        if (!search) {
            setOverallTotal(total);
        }
    }, [total, search]);

    const columns: ColumnDef<PromptRead>[] = [
        {
            accessorKey: "name",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="hover:bg-transparent p-0 font-semibold"
                >
                    Prompt Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="font-medium text-primary flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {row.original.name}
                </div>
            ),
        },
        {
            accessorKey: "content",
            header: "Content Preview",
            cell: ({ row }) => (
                <div className="max-w-[500px] truncate text-muted-foreground">
                    {row.original.content}
                </div>
            ),
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <div className="flex justify-end">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewClick(row.original)}
                        className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                        <Info className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    const filteredPrompts = prompts.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.content.toLowerCase().includes(search.toLowerCase())
    );
    // Handle search with pagination reset
    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    };
    const handleCopy = async () => {
        if (!selectedPrompt?.content) return;
        await navigator.clipboard.writeText(selectedPrompt.content);
        setIsCopied(true);
        setTimeout(() => {
            setIsCopied(false);
        }, 2000);
    };

    return (
        <AppPageShell width="wide">
            <PermissionGuard permissions={[PERMISSIONS.ANALYTICS_READ, PERMISSIONS.ADMIN_ACCESS]}>
                <PageHeader
                    title="AI Prompts"
                    subtitle="View the AI prompts used for candidate analysis and resume screening."
                />


                {error && !prompts.length ? (
                    <ErrorDisplay message={error} onRetry={fetchData} />
                ) :
                    <DataTable
                        columns={columns}
                        data={filteredPrompts}
                        loading={loading}
                        isServerSide={true}
                        pageCount={Math.ceil(total / pageSize)}
                        pageSize={pageSize}
                        totalRecords={total}
                        totalCount={overallTotal}
                        resultCount={filteredPrompts.length}
                        onPaginationChange={setPagination}
                        onSearchChange={handleSearchChange}
                        entityName="Prompts"
                        searchValue={search}
                        searchKey="name"
                        searchPlaceholder="Filter prompts by name or content..."
                    />}

                <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                    <DialogContent className="flex w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] flex-col sm:w-[92vw] sm:max-w-[92vw] lg:max-w-250 max-h-[calc(100vh-1rem)] sm:max-h-[92vh] p-0 overflow-hidden rounded-[1.75rem] sm:rounded-3xl border-muted-foreground/10 bg-card/95 backdrop-blur-xl shadow-2xl h-[650px] gap-0.5">
                        <div className="px-4 py-2 ">
                            <DialogHeader className="mb-2">
                                <DialogTitle className="flex items-center gap-2 text-xl">
                                    <FileText className="h-5 w-5 text-primary" />
                                    {selectedPrompt?.name}
                                </DialogTitle>
                                <DialogDescription className="mt-0">
                                    Full content of the AI prompt used by the system.
                                </DialogDescription>

                            </DialogHeader>
                        </div>

                        <ScrollArea className="flex-1 min-h-0 w-full border-y bg-muted/5">
                            <div className="p-1">
                                <Button className="float-right m-1" size={"icon"} variant={"ghost"}
                                    onClick={handleCopy}
                                >
                                    {isCopied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                                </Button>
                                <pre className="p-4 bg-muted/50 rounded-xl font-mono text-sm whitespace-pre-wrap border border-muted-foreground/10 leading-relaxed">
                                    {selectedPrompt?.content.trim()}
                                </pre>
                            </div>
                        </ScrollArea>
                    </DialogContent>
                </Dialog>
            </PermissionGuard>
        </AppPageShell >
    );
};

export default AdminPrompts;
