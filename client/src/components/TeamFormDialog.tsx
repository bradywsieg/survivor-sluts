import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Upload } from "lucide-react";

interface TeamFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    id?: number;
    name: string;
    imageUrl?: string | null;
    isWinner?: boolean;
  };
  onSubmit: (data: { name: string; imageUrl?: string | null; isWinner: boolean }) => void;
}

export default function TeamFormDialog({ 
  open, 
  onOpenChange, 
  initialData,
  onSubmit 
}: TeamFormDialogProps) {
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isWinner, setIsWinner] = useState(false);
  const isEditing = !!initialData?.id;

  useEffect(() => {
    if (open) {
      setName(initialData?.name || "");
      setImageUrl(initialData?.imageUrl || "");
      setIsWinner(initialData?.isWinner || false);
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit({ name: name.trim(), imageUrl: imageUrl.trim() || null, isWinner });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-['Slackey'] text-xl tracking-wide">
            {isEditing ? "Edit Team" : "Create Team"}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Update team details below." : "Fill in the details to create a new team."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={imageUrl || undefined} alt={name || "Team"} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {name ? name.substring(0, 2).toUpperCase() : "TM"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Team Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter team name"
                  data-testid="input-team-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL (optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="imageUrl"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    data-testid="input-team-image"
                  />
                  <Button type="button" variant="outline" size="icon">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200">
              <div>
                <Label htmlFor="isWinner" className="cursor-pointer font-semibold text-amber-800">
                  🏆 League Champion
                </Label>
                <p className="text-xs text-amber-600 mt-0.5">Mark this team as the season winner</p>
              </div>
              <Switch
                id="isWinner"
                checked={isWinner}
                onCheckedChange={setIsWinner}
                data-testid="switch-team-winner"
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" data-testid="button-submit-team">
              {isEditing ? "Save Changes" : "Create Team"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
