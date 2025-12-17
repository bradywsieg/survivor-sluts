import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import TeamCard from "@/components/TeamCard";
import TeamFormDialog from "@/components/TeamFormDialog";
import { Plus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

interface Contestant {
  id: number;
  name: string;
  imageUrl?: string;
  teamId?: number;
}

interface Team {
  id: number;
  name: string;
  imageUrl?: string;
}

export default function Teams() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const { data: teams = [], isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { data: contestants = [] } = useQuery<Contestant[]>({
    queryKey: ["/api/contestants"],
  });

  const { data: allScores = [] } = useQuery<{ contestantId: number; points: number }[]>({
    queryKey: ["/api/scores"],
  });

  const { data: allBonuses = [] } = useQuery<{ teamId: number; bonus: number }[]>({
    queryKey: ["/api/bonuses"],
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; imageUrl?: string }) => 
      apiRequest("POST", "/api/teams", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Team Created", description: "New team has been added." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create team.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; imageUrl?: string } }) => 
      apiRequest("PATCH", `/api/teams/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Team Updated", description: "Team has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update team.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/teams/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Team Deleted", description: "Team has been removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete team.", variant: "destructive" });
    },
  });

  const calculateTeamPoints = (teamId: number) => {
    const teamContestants = contestants.filter(c => c.teamId === teamId);
    const contestantPoints = allScores
      .filter(s => teamContestants.some(c => c.id === s.contestantId))
      .reduce((sum, s) => sum + s.points, 0);
    const bonusPoints = allBonuses
      .filter(b => b.teamId === teamId)
      .reduce((sum, b) => sum + b.bonus, 0);
    return contestantPoints + bonusPoints;
  };

  const handleSubmit = (data: { name: string; imageUrl?: string }) => {
    if (editingTeam) {
      updateMutation.mutate({ id: editingTeam.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (id: number) => {
    const team = teams.find(t => t.id === id);
    if (team) {
      setEditingTeam(team);
      setDialogOpen(true);
    }
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setEditingTeam(null);
  };

  if (teamsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="flex items-center justify-between gap-4 mb-8">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-28" />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

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
              totalPoints={calculateTeamPoints(team.id)}
              contestants={contestants.filter(c => c.teamId === team.id)}
              onEdit={handleEdit}
              onDelete={handleDelete}
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
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
