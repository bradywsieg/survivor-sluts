import { useState } from "react";
import { Button } from "@/components/ui/button";
import TeamCard from "@/components/TeamCard";
import TeamFormDialog from "@/components/TeamFormDialog";
import { Plus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// todo: remove mock functionality
interface Contestant {
  id: number;
  name: string;
  imageUrl?: string;
}

interface Team {
  id: number;
  name: string;
  imageUrl?: string;
  totalPoints: number;
  contestants: Contestant[];
}

const initialTeams: Team[] = [
  { 
    id: 1, 
    name: "Tribal Council", 
    totalPoints: 285, 
    contestants: [
      { id: 1, name: "Marcus" },
      { id: 2, name: "Elena" },
    ] 
  },
  { 
    id: 2, 
    name: "Island Survivors", 
    totalPoints: 242, 
    contestants: [
      { id: 3, name: "Jake" },
      { id: 4, name: "Sophia" },
    ] 
  },
  { 
    id: 3, 
    name: "Fire Makers", 
    totalPoints: 198, 
    contestants: [
      { id: 5, name: "Tyler" },
    ] 
  },
  { 
    id: 4, 
    name: "Hidden Immunity", 
    totalPoints: 156, 
    contestants: [] 
  },
];

export default function Teams() {
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const handleCreateTeam = (data: { name: string; imageUrl?: string }) => {
    const newTeam: Team = {
      id: Date.now(),
      name: data.name,
      imageUrl: data.imageUrl,
      totalPoints: 0,
      contestants: [],
    };
    setTeams([...teams, newTeam]);
    toast({
      title: "Team Created",
      description: `${data.name} has been added to the league.`,
    });
  };

  const handleEditTeam = (id: number) => {
    const team = teams.find(t => t.id === id);
    if (team) {
      setEditingTeam(team);
      setDialogOpen(true);
    }
  };

  const handleUpdateTeam = (data: { name: string; imageUrl?: string }) => {
    if (editingTeam) {
      setTeams(teams.map(t => 
        t.id === editingTeam.id 
          ? { ...t, name: data.name, imageUrl: data.imageUrl }
          : t
      ));
      setEditingTeam(null);
      toast({
        title: "Team Updated",
        description: `${data.name} has been updated.`,
      });
    }
  };

  const handleDeleteTeam = (id: number) => {
    const team = teams.find(t => t.id === id);
    setTeams(teams.filter(t => t.id !== id));
    toast({
      title: "Team Deleted",
      description: `${team?.name} has been removed from the league.`,
    });
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingTeam(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold font-['Titan_One'] tracking-wide" data-testid="text-page-title">
              Teams
            </h1>
          </div>
          <Button 
            onClick={() => setDialogOpen(true)} 
            className="gap-2"
            data-testid="button-add-team"
          >
            <Plus className="h-4 w-4" />
            Add Team
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              id={team.id}
              name={team.name}
              imageUrl={team.imageUrl}
              totalPoints={team.totalPoints}
              contestants={team.contestants}
              onEdit={handleEditTeam}
              onDelete={handleDeleteTeam}
            />
          ))}
        </div>

        {teams.length === 0 && (
          <div className="text-center py-16">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Teams Yet</h2>
            <p className="text-muted-foreground mb-4">Create your first team to get started!</p>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Team
            </Button>
          </div>
        )}

        <TeamFormDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          initialData={editingTeam ? { id: editingTeam.id, name: editingTeam.name, imageUrl: editingTeam.imageUrl } : undefined}
          onSubmit={editingTeam ? handleUpdateTeam : handleCreateTeam}
        />
      </div>
    </div>
  );
}
