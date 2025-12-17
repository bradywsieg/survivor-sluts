import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

interface Contestant {
  id: number;
  name: string;
  imageUrl?: string;
  eliminated?: boolean;
}

interface Team {
  id: number;
  name: string;
}

interface Week {
  id: number;
  weekNumber: number;
}

interface Score {
  contestantId: number;
  points: number;
}

interface Bonus {
  teamId: number;
  bonus: number;
}

export default function Scoring() {
  const { toast } = useToast();
  const [selectedWeekId, setSelectedWeekId] = useState<string>("");
  const [scores, setScores] = useState<Record<number, number>>({});
  const [bonuses, setBonuses] = useState<Record<number, number>>({});

  const { data: contestants = [], isLoading: contestantsLoading } = useQuery<Contestant[]>({
    queryKey: ["/api/contestants"],
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { data: weeks = [], isLoading: weeksLoading } = useQuery<Week[]>({
    queryKey: ["/api/weeks"],
  });

  const { data: weekScores = [] } = useQuery<{ contestantId: number; points: number }[]>({
    queryKey: ["/api/weeks", selectedWeekId, "scores"],
    enabled: !!selectedWeekId,
  });

  const { data: weekBonuses = [] } = useQuery<{ teamId: number; bonus: number }[]>({
    queryKey: ["/api/weeks", selectedWeekId, "bonuses"],
    enabled: !!selectedWeekId,
  });

  // Initialize scores when week data loads
  useEffect(() => {
    if (weekScores.length > 0) {
      const scoresMap: Record<number, number> = {};
      weekScores.forEach(s => { scoresMap[s.contestantId] = s.points; });
      setScores(scoresMap);
    } else {
      setScores({});
    }
  }, [weekScores]);

  useEffect(() => {
    if (weekBonuses.length > 0) {
      const bonusesMap: Record<number, number> = {};
      weekBonuses.forEach(b => { bonusesMap[b.teamId] = b.bonus; });
      setBonuses(bonusesMap);
    } else {
      setBonuses({});
    }
  }, [weekBonuses]);

  // Set initial week selection
  useEffect(() => {
    if (weeks.length > 0 && !selectedWeekId) {
      setSelectedWeekId(weeks[weeks.length - 1].id.toString());
    }
  }, [weeks, selectedWeekId]);

  const createWeekMutation = useMutation({
    mutationFn: (weekNumber: number) => apiRequest("POST", "/api/weeks", { weekNumber }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weeks"] });
      toast({ title: "Week Added", description: "New week is now available for scoring." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add week.", variant: "destructive" });
    },
  });

  const saveScoresMutation = useMutation({
    mutationFn: ({ weekId, scores, bonuses }: { weekId: number; scores: Score[]; bonuses: Bonus[] }) => 
      apiRequest("POST", `/api/weeks/${weekId}/scores`, { scores, bonuses }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bonuses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/weeks", selectedWeekId, "scores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/weeks", selectedWeekId, "bonuses"] });
      toast({ title: "Scores Saved", description: "All scores have been saved successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save scores.", variant: "destructive" });
    },
  });

  const handleAddWeek = () => {
    const newWeekNumber = weeks.length + 1;
    createWeekMutation.mutate(newWeekNumber);
  };

  const handleScoreChange = (contestantId: number, value: string) => {
    const numValue = parseInt(value) || 0;
    setScores(prev => ({ ...prev, [contestantId]: numValue }));
  };

  const handleBonusChange = (teamId: number, value: string) => {
    const numValue = parseInt(value) || 0;
    setBonuses(prev => ({ ...prev, [teamId]: numValue }));
  };

  const handleSave = () => {
    if (!selectedWeekId) return;

    const scoreArray: Score[] = Object.entries(scores).map(([id, points]) => ({
      contestantId: parseInt(id),
      points,
    }));
    const bonusArray: Bonus[] = Object.entries(bonuses).map(([id, bonus]) => ({
      teamId: parseInt(id),
      bonus,
    }));

    saveScoresMutation.mutate({ 
      weekId: parseInt(selectedWeekId), 
      scores: scoreArray, 
      bonuses: bonusArray 
    });
  };

  const isLoading = contestantsLoading || weeksLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="flex items-center justify-between gap-4 mb-8">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-28" />
          </div>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold font-['Titan_One'] tracking-wide" data-testid="text-page-title">
              Weekly Scoring
            </h1>
          </div>
          <Button 
            onClick={handleAddWeek} 
            variant="outline"
            className="gap-2"
            disabled={createWeekMutation.isPending}
            data-testid="button-add-week"
          >
            <Plus className="h-4 w-4" />
            Add Week
          </Button>
        </div>

        {weeks.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Weeks Yet</h2>
              <p className="text-muted-foreground mb-4">Add a week to start entering scores.</p>
              <Button onClick={handleAddWeek} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Week 1
              </Button>
            </CardContent>
          </Card>
        ) : contestants.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              Add contestants before entering scores.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
              <CardTitle className="flex items-center gap-2 text-2xl font-bold font-['Titan_One'] tracking-wide">
                <Calendar className="h-6 w-6 text-primary" />
                Enter Scores
              </CardTitle>
              <div className="flex items-center gap-4">
                <Select value={selectedWeekId} onValueChange={setSelectedWeekId}>
                  <SelectTrigger className="w-32" data-testid="select-week">
                    <SelectValue placeholder="Week" />
                  </SelectTrigger>
                  <SelectContent>
                    {weeks.map((week) => (
                      <SelectItem key={week.id} value={week.id.toString()}>
                        Week {week.weekNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleSave} 
                  className="gap-2" 
                  disabled={saveScoresMutation.isPending}
                  data-testid="button-save-scores"
                >
                  <Save className="h-4 w-4" />
                  {saveScoresMutation.isPending ? "Saving..." : "Save Scores"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Contestant Points</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contestant</TableHead>
                        <TableHead className="w-32 text-center">Status</TableHead>
                        <TableHead className="w-32 text-right">Points</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contestants.map((contestant) => (
                        <TableRow key={contestant.id} data-testid={`row-score-${contestant.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={contestant.imageUrl} alt={contestant.name} />
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {contestant.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{contestant.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {contestant.eliminated ? (
                              <Badge variant="destructive" className="text-xs">Eliminated</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Active</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={scores[contestant.id] || 0}
                              onChange={(e) => handleScoreChange(contestant.id, e.target.value)}
                              className="w-24 text-center ml-auto"
                              disabled={contestant.eliminated}
                              data-testid={`input-score-${contestant.id}`}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {teams.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Team Bonuses / Adjustments</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Team</TableHead>
                          <TableHead className="w-32 text-right">Bonus Points</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teams.map((team) => (
                          <TableRow key={team.id} data-testid={`row-bonus-${team.id}`}>
                            <TableCell>
                              <span className="font-medium">{team.name}</span>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={bonuses[team.id] || 0}
                                onChange={(e) => handleBonusChange(team.id, e.target.value)}
                                className="w-24 text-center ml-auto"
                                data-testid={`input-bonus-${team.id}`}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
