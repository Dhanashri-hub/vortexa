import { useState } from "react";
import { Link } from "wouter";
import {
  useListRecords,
  useDeleteRecord,
  getListRecordsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ShieldCheck, Plus, Trash2, Eye, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import RecordFormDialog from "@/components/record-form-dialog";

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "examination", label: "Examination" },
  { value: "cardiology", label: "Cardiology" },
  { value: "imaging", label: "Imaging" },
  { value: "lab", label: "Lab Results" },
  { value: "surgery", label: "Surgery" },
  { value: "mental_health", label: "Mental Health" },
  { value: "other", label: "Other" },
];

const categoryColor: Record<string, string> = {
  examination: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  cardiology: "bg-red-500/10 text-red-400 border-red-500/20",
  imaging: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  lab: "bg-green-500/10 text-green-400 border-green-500/20",
  surgery: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  mental_health: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  other: "bg-muted text-muted-foreground",
};

export default function Records() {
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const params = {
    ...(category !== "all" ? { category } : {}),
    ...(search ? { search } : {}),
  };
  const { data: records = [], isLoading } = useListRecords(params, {
    query: { queryKey: getListRecordsQueryKey(params) },
  });
  const deleteRecord = useDeleteRecord();

  function handleDelete(id: number) {
    deleteRecord.mutate(
      { id },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListRecordsQueryKey() });
          toast({ title: "Record deleted" });
          setDeleteId(null);
        },
        onError: () => {
          toast({ title: "Failed to delete record", variant: "destructive" });
          setDeleteId(null);
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Health Records</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Encrypted and cryptographically signed medical records
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Record
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search records..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-lg border-dashed">
          No records found. Add your first health record to get started.
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.title}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={categoryColor[r.category] ?? categoryColor.other}
                    >
                      {r.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {r.provider ?? "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {r.recordDate ?? "-"}
                  </TableCell>
                  <TableCell>
                    {r.isVerified ? (
                      <ShieldCheck className="w-4 h-4 text-green-500" />
                    ) : (
                      <span className="text-muted-foreground text-xs">Unverified</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Link href={`/records/${r.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(r.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <RecordFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: getListRecordsQueryKey() });
          setShowForm(false);
        }}
      />

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this health record from your vault. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId !== null && handleDelete(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
