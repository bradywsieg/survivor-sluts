import { useState } from "react";
import { Button } from "@/components/ui/button";
import ContestantCard from "@/components/ContestantCard";
import ContestantFormDialog from "@/components/ContestantFormDialog";
import { Plus, UserCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// todo: remove mock functionality
interface Contestant {
  id: number;
  name: string;
  imageUrl?: string;
  totalPoints: number;
  teamId?: number;
  teamName?: string;
  eliminated?: boolean;
}

interface Team {
  id: number;
  name: string;
}

const mockTeams: Team[] = [
  { id: 1, name: "Tribal Council" },
  { id: 2, name: "Island Survivors" },
  { id: 3, name: "Fire Makers" },
  { id: 4, name: "Hidden Immunity" },
];

const initialContestants: Contestant[] = [
  { id: 1, name: "Marcus", totalPoints: 85, teamId: 1, teamName: "Tribal Council" },
  { id: 2, name: "Elena", totalPoints: 72, teamId: 1, teamName: "Tribal Council" },
  { id: 3, name: "Jake", totalPoints: 68, teamId: 2, teamName: "Island Survivors" },
  { id: 4, name: "Sophia", totalPoints: 55, teamId: 2, teamName: "Island Survivors" },
  { id: 5, name: "Tyler", totalPoints: 48, teamId: 3, teamName: "Fire Makers" },
  { id: 6, name: "Maya", totalPoints: 42, teamId: 3, teamName: "Fire Makers", eliminated: true },
  { id: 7, name: "Chris", totalPoints: 35, teamId: 4, teamName: "Hidden Immunity", eliminated: true },
];

export default function Contestants() {
  const { toast } = useToast();
  const [contestants, setContestants] = useState<Contestant[]>(initialContestants);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContestant, setEditingContestant] = useState<Contestant | null>(null);

  const handleCreateContestant = (data: { name: string; imageUrl?: string; teamId?: number; eliminated: boolean }) => {
    const team = mockTeams.find(t => t.id === data.teamId);
    const newContestant: Contestant = {
      id: Date.now(),
      name: data.name,
      imageUrl: data.imageUrl,
      totalPoints: 0,
      teamId: data.teamId,
      teamName: team?.name,
      eliminated: data.eliminated,
    };
    setContestants([...contestants, newContestant]);
    toast({
      title: "Contestant Added",
      description: `${data.name} has been added to the game.`,
    });
  };

  const handleEditContestant = (id: number) => {
    const contestant = contestants.find(c => c.id === id);
    if (contestant) {
      setEditingContestant(contestant);
      setDialogOpen(true);
    }
  };

  const handleUpdateContestant = (data: { name: string; imageUrl?: string; teamId?: number; eliminated: boolean }) => {
    if (editingContestant) {
      const team = mockTeams.find(t => t.id === data.teamId);
      setContestants(contestants.map(c => 
        c.id === editingContestant.id 
          ? { 
              ...c, 
              name: data.name, 
              imageUrl: data.imageUrl,
              teamId: data.teamId,
              teamName: team?.name,
              eliminated: data.eliminated 
            }
          : c
      ));
      setEditingContestant(null);
      toast({
        title: "Contestant Updated",
        description: `${data.name} has been updated.`,
      });
    }
  };

  const handleDeleteContestant = (id: number) => {
    const contestant = contestants.find(c => c.id === id);
    setContestants(contestants.filter(c => c.id !== id));
    toast({
      title: "Contestant Removed",
      description: `${contestant?.name} has been removed from the game.`,
    });
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingContestant(null);
    }
  };

  const activeContestants = contestants.filter(c => !c.eliminated);
  const eliminatedContestants = contestants.filter(c => c.eliminated);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <UserCircle className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold font-['Titan_One'] tracking-wide" data-testid="text-page-title">
              Contestants
            </h1>
          </div>
          <Button 
            onClick={() => setDialogOpen(true)} 
            className="gap-2"
            data-testid="button-add-contestant"
          >
            <Plus className="h-4 w-4" />
            Add Contestant
          </Button>
        </div>

        {activeContestants.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Active ({activeContestants.length})</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeContestants.map((contestant) => (
                <ContestantCard
                  key={contestant.id}
                  id={contestant.id}
                  name={contestant.name}
                  imageUrl={contestant.imageUrl}
                  totalPoints={contestant.totalPoints}
                  teamName={contestant.teamName}
                  eliminated={contestant.eliminated}
                  onEdit={handleEditContestant}
                  onDelete={handleDeleteContestant}
                />
              ))}
            </div>
          </div>
        )}

        {eliminatedContestants.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 text-muted-foreground">Eliminated ({eliminatedContestants.length})</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {eliminatedContestants.map((contestant) => (
                <ContestantCard
                  key={contestant.id}
                  id={contestant.id}
                  name={contestant.name}
                  imageUrl={contestant.imageUrl}
                  totalPoints={contestant.totalPoints}
                  teamName={contestant.teamName}
                  eliminated={contestant.eliminated}
                  onEdit={handleEditContestant}
                  onDelete={handleDeleteContestant}
                />
              ))}
            </div>
          </div>
        )}

        {contestants.length === 0 && (
          <div className="text-center py-16">
            <UserCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Contestants Yet</h2>
            <p className="text-muted-foreground mb-4">Add the Survivor contestants to start tracking!</p>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add First Contestant
            </Button>
          </div>
        )}

        <ContestantFormDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          teams={mockTeams}
          initialData={editingContestant ? {
            id: editingContestant.id,
            name: editingContestant.name,
            imageUrl: editingContestant.imageUrl,
            teamId: editingContestant.teamId,
            eliminated: editingContestant.eliminated,
          } : undefined}
          onSubmit={editingContestant ? handleUpdateContestant : handleCreateContestant}
        />
      </div>
    </div>
  );
}
