import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Upload } from "lucide-react";

interface Team {
  id: number;
  name: string;
}

interface ContestantFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teams: Team[];
  initialData?: {
    id?: number;
    name: string;
    imageUrl?: string;
    teamId?: number;
    eliminated?: boolean;
  };
  onSubmit: (data: { name: string; imageUrl?: string; teamId?: number; eliminated: boolean }) => void;
}

export default function ContestantFormDialog({ 
  open, 
  onOpenChange, 
  teams,
  initialData,
  onSubmit 
}: ContestantFormDialogProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || "");
  const [teamId, setTeamId] = useState<string>(initialData?.teamId?.toString() || "");
  const [eliminated, setEliminated] = useState(initialData?.eliminated || false);
  const isEditing = !!initialData?.id;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit({ 
        name: name.trim(), 
        imageUrl: imageUrl.trim() || undefined,
        teamId: teamId ? parseInt(teamId) : undefined,
        eliminated
      });
      setName("");
      setImageUrl("");
      setTeamId("");
      setEliminated(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-['Titan_One'] text-xl tracking-wide">
            {isEditing ? "Edit Contestant" : "Add Contestant"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={imageUrl} alt={name || "Contestant"} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {name ? name.substring(0, 2).toUpperCase() : "??"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contestantName">Name</Label>
                <Input
                  id="contestantName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter contestant name"
                  data-testid="input-contestant-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contestantImage">Image URL (optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="contestantImage"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    data-testid="input-contestant-image"
                  />
                  <Button type="button" variant="outline" size="icon">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="team">Assign to Team</Label>
            <Select value={teamId} onValueChange={setTeamId}>
              <SelectTrigger data-testid="select-contestant-team">
                <SelectValue placeholder="Select a team (optional)" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id.toString()}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="eliminated" className="cursor-pointer">Eliminated</Label>
            <Switch
              id="eliminated"
              checked={eliminated}
              onCheckedChange={setEliminated}
              data-testid="switch-contestant-eliminated"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" data-testid="button-submit-contestant">
              {isEditing ? "Save Changes" : "Add Contestant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
