import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ContestantCard from "@/components/ContestantCard";
import ContestantFormDialog from "@/components/ContestantFormDialog";
import SeasonSelector from "@/components/SeasonSelector";
import { useSeason } from "@/hooks/use-season";
import { Plus, UserCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

interface Contestant {
  id: number;
  name: string;
  imageUrl?: string | null;
  teamId?: number | null;
  eliminated?: boolean;
  seasonId?: number | null;
  tribeId?: number | null;
  bio?: string | null;
}

interface Team {
  id: number;
  name: string;
}

interface Tribe {
  id: number;
  name: string;
  color: string;
  seasonId: number;
}

export default function Contestants() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContestant, setEditingContestant] = useState<Contestant | null>(null);
  const { seasons, selectedSeasonId, setSelectedSeasonId } = useSeason();

  const { data: contestants = [], isLoading } = useQuery<Contestant[]>({
    queryKey: ["/api/contestants", { seasonId: selectedSeasonId }],
    queryFn: async () => {
      const url = selectedSeasonId ? `/api/contestants?seasonId=${selectedSeasonId}` : `/api/contestants`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!selectedSeasonId || seasons.length === 0,
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams", { seasonId: selectedSeasonId }],
    queryFn: async () => {
      const url = selectedSeasonId ? `/api/teams?seasonId=${selectedSeasonId}` : `/api/teams`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!selectedSeasonId || seasons.length === 0,
  });

  const { data: tribes = [] } = useQuery<Tribe[]>({
    queryKey: ["/api/tribes", { seasonId: selectedSeasonId }],
    queryFn: async () => {
      const url = selectedSeasonId ? `/api/tribes?seasonId=${selectedSeasonId}` : `/api/tribes`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!selectedSeasonId || seasons.length === 0,
  });

  const { data: allScores = [] } = useQuery<{ contestantId: number; points: number }[]>({
    queryKey: ["/api/scores", { seasonId: selectedSeasonId }],
    queryFn: async () => {
      const url = selectedSeasonId ? `/api/scores?seasonId=${selectedSeasonId}` : `/api/scores`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!selectedSeasonId || seasons.length === 0,
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; imageUrl?: string | null; teamId?: number; eliminated: boolean; tribeId?: number | null; bio?: string | null }) => 
      apiRequest("POST", "/api/contestants", { ...data, seasonId: selectedSeasonId ? parseInt(selectedSeasonId) : undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contestants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Contestant Added", description: "New contestant has been added." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add contestant.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Contestant> }) => 
      apiRequest("PATCH", `/api/contestants/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contestants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Contestant Updated", description: "Contestant has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update contestant.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/contestants/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contestants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Contestant Removed", description: "Contestant has been removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove contestant.", variant: "destructive" });
    },
  });

  const calculateContestantPoints = (contestantId: number) => {
    return allScores
      .filter(s => s.contestantId === contestantId)
      .reduce((sum, s) => sum + s.points, 0);
  };

  const handleSubmit = (data: { name: string; imageUrl?: string | null; teamId?: number; eliminated: boolean; tribeId?: number | null; bio?: string | null }) => {
    if (editingContestant) {
      updateMutation.mutate({ id: editingContestant.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (id: number) => {
    const contestant = contestants.find(c => c.id === id);
    if (contestant) {
      setEditingContestant(contestant);
      setDialogOpen(true);
    }
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setEditingContestant(null);
  };

  const getTribe = (tribeId: number | null | undefined) => {
    if (!tribeId) return undefined;
    return tribes.find(t => t.id === tribeId);
  };

  const groupedByTribe = () => {
    const groups: { tribe: Tribe | null; contestants: Contestant[]; isEliminated?: boolean }[] = [];
    const tribeMap = new Map<number, Contestant[]>();
    const noTribe: Contestant[] = [];
    const eliminated: Contestant[] = [];

    contestants.forEach(c => {
      if (c.eliminated) {
        eliminated.push(c);
      } else if (c.tribeId) {
        if (!tribeMap.has(c.tribeId)) tribeMap.set(c.tribeId, []);
        tribeMap.get(c.tribeId)!.push(c);
      } else {
        noTribe.push(c);
      }
    });

    tribes.forEach(t => {
      const tribeContestants = tribeMap.get(t.id) || [];
      if (tribeContestants.length > 0) {
        groups.push({ tribe: t, contestants: tribeContestants });
      }
    });

    if (noTribe.length > 0) {
      groups.push({ tribe: null, contestants: noTribe });
    }

    if (eliminated.length > 0) {
      groups.push({ tribe: null, contestants: eliminated, isEliminated: true });
    }

    return groups;
  };

  const tribeGroups = groupedByTribe();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="flex items-center justify-between gap-4 mb-8">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-36" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div className="flex items-center gap-3">
            <UserCircle className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold font-['Slackey'] tracking-wide" data-testid="text-page-title">
              Contestants
            </h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <SeasonSelector
              seasons={seasons}
              selectedSeasonId={selectedSeasonId}
              onSeasonChange={setSelectedSeasonId}
            />
            <Button 
              onClick={() => setDialogOpen(true)} 
              className="gap-2"
              data-testid="button-add-contestant"
            >
              <Plus className="h-4 w-4" />
              Add Contestant
            </Button>
          </div>
        </div>

        {tribeGroups.map((group) => (
          <div key={group.isEliminated ? "eliminated" : (group.tribe?.id ?? "none")} className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              {group.isEliminated ? (
                <div className="w-4 h-4 rounded-full shrink-0 bg-muted-foreground/50" />
              ) : group.tribe ? (
                <div
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ backgroundColor: group.tribe.color }}
                />
              ) : null}
              <h2 className={`text-xl font-semibold ${group.isEliminated ? "text-muted-foreground" : ""}`}>
                {group.isEliminated ? "Eliminated" : (group.tribe?.name ?? "No Tribe")}
              </h2>
              <span className="text-sm text-muted-foreground">
                ({group.contestants.length})
              </span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.contestants.map((contestant) => {
                const tribe = getTribe(contestant.tribeId);
                return (
                  <ContestantCard
                    key={contestant.id}
                    id={contestant.id}
                    name={contestant.name}
                    imageUrl={contestant.imageUrl || undefined}
                    totalPoints={calculateContestantPoints(contestant.id)}
                    teamName={teams.find(t => t.id === contestant.teamId)?.name}
                    eliminated={contestant.eliminated}
                    tribeColor={tribe?.color}
                    tribeName={tribe?.name}
                    bio={contestant.bio || undefined}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                );
              })}
            </div>
          </div>
        ))}

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
          teams={teams}
          tribes={tribes}
          initialData={editingContestant ? {
            id: editingContestant.id,
            name: editingContestant.name,
            imageUrl: editingContestant.imageUrl || undefined,
            teamId: editingContestant.teamId || undefined,
            eliminated: editingContestant.eliminated,
            tribeId: editingContestant.tribeId || undefined,
            bio: editingContestant.bio || undefined,
          } : undefined}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
