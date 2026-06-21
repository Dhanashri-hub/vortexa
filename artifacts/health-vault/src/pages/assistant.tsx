import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

async function askAssistant(question: string) {
  const response = await fetch("/api/ai/assistant", {
    method: "POST",
    body: JSON.stringify({ question }),
    headers: { "Content-Type": "application/json" },
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    if (data && typeof data.answer === "string") {
      return { answer: data.answer };
    }

    if (data && typeof data.error === "string") {
      const detail = typeof data.detail === "string" ? ` ${data.detail}` : "";
      throw new Error(`${data.error}.${detail}`);
    }

    const errorText = isJson ? JSON.stringify(data) : await response.text();
    throw new Error(`Assistant request failed: ${response.status} ${response.statusText} ${errorText}`);
  }

  return data as { answer: string };
}

export default function Assistant() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ question: string; answer: string }>>([]);
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      setError(null);
      const data = await askAssistant(question);
      return data;
    },
    onSuccess: (data: { answer: string }) => {
      const answerText = data.answer ?? "No answer returned.";
      setAnswer(answerText);
      setHistory((prev) => [{ question, answer: answerText }, ...prev]);
      setQuestion("");
      setError(null);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Unknown error";
      setError(message);
      toast({
        title: "Failed to get assistant answer",
        description: message,
        variant: "destructive",
      });
    },
  });

  const isLoading = mutation.status === "pending";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Health Assistant</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Ask about medications, minor symptoms, or your medical history.
          </p>
        </div>
        <Link href="/settings">
          <Button variant="outline">Settings</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ask your AI health assistant</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Ask something like: 'Can I take ibuprofen with my current medications?'"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={5}
          />
          <div className="flex gap-2">
            <Button
              onClick={() => mutation.mutate()}
              disabled={!question.trim() || isLoading}
            >
              {isLoading ? "Thinking..." : "Ask Assistant"}
            </Button>
            <Button variant="outline" disabled={isLoading} onClick={() => setQuestion("")}>
              Clear
            </Button>
          </div>
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
              <p className="text-sm leading-6 whitespace-pre-wrap">{error}</p>
            </div>
          )}
          {answer && (
            <div className="space-y-2">
              {/* Show a visible banner when the answer is a local fallback so users know AI is unavailable */}
              {answer.includes("fallback") || answer.includes("AI is not configured") || answer.includes("couldn't reach the AI service") ? (
                <div className="rounded-lg border border-yellow-400 bg-yellow-50 p-3 text-yellow-800">
                  <strong>Note:</strong> This response was generated from a local fallback because the AI service is unavailable.
                </div>
              ) : null}

              <div className="rounded-lg border border-input bg-surface p-4">
                <p className="text-sm leading-6 whitespace-pre-wrap">{answer}</p>
              </div>
            </div>
          )}
          {history.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold">Conversation history</h2>
              {history.map((item, index) => (
                <div key={index} className="rounded-lg border border-input p-4 bg-muted">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">You</p>
                  <p className="mt-1">{item.question}</p>
                  <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">Assistant</p>
                  <p className="mt-1">{item.answer}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
