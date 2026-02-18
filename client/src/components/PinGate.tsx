import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { isAdminAuthed, setAdminAuthed } from "@/lib/adminApi";

interface PinGateProps {
  children: React.ReactNode;
}

export default function PinGate({ children }: PinGateProps) {
  const [authed, setAuthed] = useState(isAdminAuthed());
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        setAdminAuthed(pin);
        setAuthed(true);
      } else {
        setError("Incorrect PIN. Try again.");
      }
    } catch {
      setError("Failed to verify PIN.");
    } finally {
      setLoading(false);
    }
  };

  if (authed) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2">
            <Lock className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-['Slackey'] tracking-wide">Commissioner Access</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Enter the 4-digit PIN to access the admin area.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              maxLength={4}
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="text-center text-2xl tracking-[0.5em]"
              autoFocus
              data-testid="input-admin-pin"
            />
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading || pin.length < 4} data-testid="button-submit-pin">
              {loading ? "Verifying..." : "Enter"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
