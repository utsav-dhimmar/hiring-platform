/**
 * Admin page for viewing AI prompts.
 * Displays all prompts used by the system with ability to view their content.
 */
import { useState, useEffect, useCallback } from "react";
import { adminPromptService } from "@/apis/admin";
import type { PromptRead } from "@/types/admin";
import AppPageShell from "@/components/shared/AppPageShell";
import PageHeader from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { extractErrorMessage } from "@/utils/error";
import type { ColumnDef } from "@tanstack/react-table";
import { Button, Input } from "@/components";
import PermissionGuard from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/lib/permissions";
import { ArrowUpDown, Search, FileText, Info } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
const AdminPrompts = () => {
    const [prompts, setPrompts] = useState<PromptRead[]>([]);
    const [loading, setLoading] = useState(true);
    const [_error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [selectedPrompt, setSelectedPrompt] = useState<PromptRead | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const fetchPrompts = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await adminPromptService.getAllPrompts();
            setPrompts(data);
        } catch (err) {
            setError(extractErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPrompts();
    }, [fetchPrompts]);

    const handleViewClick = (prompt: PromptRead) => {
        setSelectedPrompt(prompt);
        setIsViewModalOpen(true);
    };

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

    return (
        <AppPageShell width="wide">
            <PermissionGuard permissions={[PERMISSIONS.ANALYTICS_READ, PERMISSIONS.ADMIN_ACCESS]}>
                <PageHeader
                    title="AI Prompts"
                    subtitle="View the AI prompts used for candidate analysis and resume screening."
                />

                <div className="mt-8 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search prompts..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 bg-background/50 border-muted-foreground/20 focus-visible:ring-primary"
                            />
                        </div>
                    </div>

                    <DataTable
                        columns={columns}
                        data={filteredPrompts}
                        loading={loading}

                    />
                </div>

                <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                    <DialogContent className="flex w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] flex-col sm:w-[92vw] sm:max-w-[92vw] lg:max-w-250 max-h-[calc(100vh-1rem)] sm:max-h-[92vh] p-0 overflow-hidden rounded-[1.75rem] sm:rounded-3xl border-muted-foreground/10 bg-card/95 backdrop-blur-xl shadow-2xl h-[650px]">
                        <div className="p-2 px-4 pt-4">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-xl">
                                    <FileText className="h-5 w-5 text-primary" />
                                    {selectedPrompt?.name}
                                </DialogTitle>
                                <DialogDescription>
                                    Full content of the AI prompt used by the system.
                                </DialogDescription>

                            </DialogHeader>
                        </div>

                        <ScrollArea className="flex-1 min-h-0 w-full border-y bg-muted/5">
                            <div className="p-2">
                                <pre className="p-4 bg-muted/50 rounded-xl font-mono text-sm whitespace-pre-wrap border border-muted-foreground/10 leading-relaxed">
                                    {selectedPrompt?.content.trim()}
                                </pre>
                            </div>
                            <ScrollBar orientation="vertical" />
                        </ScrollArea>
                    </DialogContent>
                </Dialog>
            </PermissionGuard>
        </AppPageShell >
    );
};

export default AdminPrompts;
