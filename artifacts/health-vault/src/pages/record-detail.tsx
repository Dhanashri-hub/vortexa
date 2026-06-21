import { useRoute, Link } from "wouter";
import {
  useGetRecord,
  useVerifyRecord,
  getGetRecordQueryKey,
  getVerifyRecordQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, ShieldX, ArrowLeft, Lock } from "lucide-react";

export default function RecordDetail() {
  const [, params] = useRoute("/records/:id");
  const id = Number(params?.id);

  const { data: record, isLoading } = useGetRecord(id, {
    query: { enabled: !!id, queryKey: getGetRecordQueryKey(id) },
  });
  const { data: verification } = useVerifyRecord(id, {
    query: { enabled: !!id, queryKey: getVerifyRecordQueryKey(id) },
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-64" />
        <div className="h-48 bg-muted rounded" />
      </div>
    );
  }
  if (!record) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>Record not found.</p>
        <Link href="/records">
          <Button variant="outline" className="mt-4">
            Back to Records
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/records">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{record.title}</h1>
          <p className="text-muted-foreground text-sm">{record.category}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Decrypted Content</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {record.content ?? "No content available."}
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {verification?.isValid ? (
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                ) : (
                  <ShieldX className="w-4 h-4 text-destructive" />
                )}
                Signature
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Badge
                variant="outline"
                className={
                  verification?.isValid
                    ? "border-green-500/30 bg-green-500/10 text-green-400"
                    : "border-destructive/30 bg-destructive/10 text-destructive"
                }
              >
                {verification?.isValid ? "Verified" : "Failed"}
              </Badge>
              <p className="text-xs text-muted-foreground font-mono break-all">
                {record.signatureHash}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                Encryption
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground font-mono break-all">
                {record.encryptedContent}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Provider</span>
                <span className="text-right max-w-[60%]">{record.provider ?? "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span>{record.recordDate ?? "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Added</span>
                <span>{new Date(record.createdAt).toLocaleDateString()}</span>
              </div>
              {Array.isArray(record.tags) && record.tags.length > 0 && (
                <div className="pt-2 flex flex-wrap gap-1">
                  {record.tags.map((t: string) => (
                    <Badge key={t} variant="secondary" className="text-xs">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
