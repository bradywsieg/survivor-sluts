import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Upload } from "lucide-react";

interface Team {
  id: number;
  name: string;
}

interface Tribe {
  id: number;
  name: string;
  color: string;
}

interface ContestantFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teams: Team[];
  tribes?: Tribe[];
  initialData?: {
    id?: number;
    name: string;
    imageUrl?: string;
    teamId?: number;
    eliminated?: boolean;
    tribeId?: number;
    bio?: string;
    isSoleSurvivor?: boolean;
  };
  onSubmit: (data: { name: string; imageUrl?: string | null; teamId?: number; eliminated: boolean; tribeId?: number | null; bio?: string | null; isSoleSurvivor: boolean }) => void;
}

export default function ContestantFormDialog({ 
  open, 
  onOpenChange, 
  teams,
  tribes = [],
  initialData,
  onSubmit 
}: ContestantFormDialogProps) {
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [teamId, setTeamId] = useState<string>("");
  const [eliminated, setEliminated] = useState(false);
  const [tribeId, setTribeId] = useState<string>("");
  const [bio, setBio] = useState("");
  const [isSoleSurvivor, setIsSoleSurvivor] = useState(false);
  const isEditing = !!initialData?.id;

  useEffect(() => {
    if (open) {
      setName(initialData?.name || "");
      setImageUrl(initialData?.imageUrl || "");
      setTeamId(initialData?.teamId?.toString() || "");
      setEliminated(initialData?.eliminated || false);
      setTribeId(initialData?.tribeId?.toString() || "");
      setBio(initialData?.bio || "");
      setIsSoleSurvivor(initialData?.isSoleSurvivor || false);
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit({ 
        name: name.trim(), 
        imageUrl: imageUrl.trim() || null,
        teamId: teamId ? parseInt(teamId) : undefined,
        eliminated,
        tribeId: tribeId && tribeId !== "none" ? parseInt(tribeId) : null,
        bio: bio.trim() || null,
        isSoleSurvivor,
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-['Slackey'] text-xl tracking-wide">
            {isEditing ? "Edit Contestant" : "Add Contestant"}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Update contestant details below." : "Fill in the details to add a new contestant."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={imageUrl || undefined} alt={name || "Contestant"} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {name ? name.substring(0, 2).toUpperCase() : "CN"}
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

          {tribes.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="tribe">Tribe</Label>
              <Select value={tribeId} onValueChange={setTribeId}>
                <SelectTrigger data-testid="select-contestant-tribe">
                  <SelectValue placeholder="Select a tribe (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Tribe</SelectItem>
                  {tribes.map((tribe) => (
                    <SelectItem key={tribe.id} value={tribe.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: tribe.color }}
                        />
                        {tribe.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="bio">Bio (optional)</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Short bio or description..."
              className="resize-none"
              rows={3}
              data-testid="input-contestant-bio"
            />
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

          <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200">
            <div>
              <Label htmlFor="isSoleSurvivor" className="cursor-pointer font-semibold text-amber-800">
                ⭐ Sole Survivor
              </Label>
              <p className="text-xs text-amber-600 mt-0.5">Mark as the season winner</p>
            </div>
            <Switch
              id="isSoleSurvivor"
              checked={isSoleSurvivor}
              onCheckedChange={setIsSoleSurvivor}
              data-testid="switch-contestant-sole-survivor"
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
