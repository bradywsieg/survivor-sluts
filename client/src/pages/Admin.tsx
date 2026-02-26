import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import SeasonSelector from "@/components/SeasonSelector";
import PinGate from "@/components/PinGate";
import { useSeason } from "@/hooks/use-season";
import { Shield, Plus, X, Search, Calendar, Save, Zap, Tv, Palette, Pencil, Trash2, HelpCircle, Copy, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { adminApiRequest } from "@/lib/adminApi";
import { Skeleton } from "@/components/ui/skeleton";
import AdminBonusTab from "@/components/AdminBonusTab";

interface Contestant {
  id: number;
  name: string;
  imageUrl?: string | null;
  eliminated?: boolean;
  teamId?: number | null;
  tribeId?: number | null;
}

interface Team {
  id: number;
  name: string;
}

interface Week {
  id: number;
  weekNumber: number;
}

interface EventSetting {
  id: number;
  seasonId: number;
  eventKey: string;
  eventName: string;
  points: number;
}

interface ContestantEvent {
  id: number;
  seasonId: number;
  weekId: number;
  contestantId: number;
  eventKey: string | null;
  eventName: string;
  pointsOverride: number | null;
}

interface Bonus {
  teamId: number;
  bonus: number;
}

interface Season {
  id: number;
  name: string;
  number: number;
}

interface Tribe {
  id: number;
  name: string;
  color: string;
  seasonId: number;
}

function AdminContent() {
  const { toast } = useToast();
  const [selectedWeekId, setSelectedWeekId] = useState<string>("");
  const [bonuses, setBonuses] = useState<Record<number, number>>({});
  const { seasons, selectedSeasonId, setSelectedSeasonId } = useSeason();
  const [addEventContestantId, setAddEventContestantId] = useState<number | null>(null);
  const [eventSearchQuery, setEventSearchQuery] = useState("");
  const [selectedEventKeys, setSelectedEventKeys] = useState<string[]>([]);
  const [showCustomEvent, setShowCustomEvent] = useState(false);
  const [customEventName, setCustomEventName] = useState("");
  const [customEventPoints, setCustomEventPoints] = useState("");
  const [editingPoints, setEditingPoints] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"scoring" | "settings" | "seasons" | "tribes" | "bonus">("scoring");

  const [seasonDialogOpen, setSeasonDialogOpen] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [seasonName, setSeasonName] = useState("");
  const [seasonNumber, setSeasonNumber] = useState("");

  const [tribeDialogOpen, setTribeDialogOpen] = useState(false);
  const [editingTribe, setEditingTribe] = useState<Tribe | null>(null);
  const [tribeName, setTribeName] = useState("");
  const [tribeColor, setTribeColor] = useState("#808080");
  const [contestantSearch, setContestantSearch] = useState("");
  const [tribeFilter, setTribeFilter] = useState<string>("all");

  const { data: contestants = [], isLoading: contestantsLoading } = useQuery<Contestant[]>({
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

  const { data: weeks = [], isLoading: weeksLoading } = useQuery<Week[]>({
    queryKey: ["/api/weeks", { seasonId: selectedSeasonId }],
    queryFn: async () => {
      const url = selectedSeasonId ? `/api/weeks?seasonId=${selectedSeasonId}` : `/api/weeks`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!selectedSeasonId || seasons.length === 0,
  });

  const { data: eventSettings = [] } = useQuery<EventSetting[]>({
    queryKey: ["/api/seasons", selectedSeasonId, "events"],
    queryFn: async () => {
      const res = await fetch(`/api/seasons/${selectedSeasonId}/events`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!selectedSeasonId,
  });

  const { data: contestantEvents = [] } = useQuery<ContestantEvent[]>({
    queryKey: ["/api/seasons", selectedSeasonId, "weeks", selectedWeekId, "contestant-events"],
    queryFn: async () => {
      const res = await fetch(`/api/seasons/${selectedSeasonId}/weeks/${selectedWeekId}/contestant-events`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!selectedSeasonId && !!selectedWeekId,
  });

  const { data: weekBonuses = [] } = useQuery<{ teamId: number; bonus: number }[]>({
    queryKey: ["/api/weeks", selectedWeekId, "bonuses"],
    queryFn: async () => {
      const res = await fetch(`/api/weeks/${selectedWeekId}/bonuses`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!selectedWeekId,
  });

  const { data: tribes = [], isLoading: tribesLoading } = useQuery<Tribe[]>({
    queryKey: ["/api/tribes", { seasonId: selectedSeasonId }],
    queryFn: async () => {
      const res = await fetch(`/api/tribes?seasonId=${selectedSeasonId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!selectedSeasonId,
  });

  useEffect(() => {
    if (weekBonuses.length > 0) {
      const bonusesMap: Record<number, number> = {};
      weekBonuses.forEach(b => { bonusesMap[b.teamId] = b.bonus; });
      setBonuses(bonusesMap);
    } else {
      setBonuses({});
    }
  }, [weekBonuses]);

  useEffect(() => {
    const latestWeekId = weeks.length > 0 ? weeks[weeks.length - 1].id.toString() : "";
    setSelectedWeekId(prev => {
      if (latestWeekId === prev) return prev;
      return latestWeekId;
    });
  }, [weeks]);

  const createWeekMutation = useMutation({
    mutationFn: (weekNumber: number) => adminApiRequest("POST", "/api/weeks", { weekNumber, seasonId: selectedSeasonId ? parseInt(selectedSeasonId) : undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weeks"] });
      toast({ title: "Week Added", description: "New week is now available for scoring." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add week.", variant: "destructive" });
    },
  });

  const addEventsMutation = useMutation({
    mutationFn: ({ contestantId, eventKeys, customEvent }: { contestantId: number; eventKeys?: string[]; customEvent?: { eventName: string; points: number } }) =>
      adminApiRequest("POST", `/api/seasons/${selectedSeasonId}/weeks/${selectedWeekId}/contestant-events`, { contestantId, eventKeys, customEvent }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasons", selectedSeasonId, "weeks", selectedWeekId, "contestant-events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/weeks", selectedWeekId, "scores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/scores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contestants"] });
      setAddEventContestantId(null);
      setSelectedEventKeys([]);
      setEventSearchQuery("");
      toast({ title: "Events Added", description: "Contestant events saved and scores recalculated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add events.", variant: "destructive" });
    },
  });

  const removeEventMutation = useMutation({
    mutationFn: async (eventId: number) => {
      await adminApiRequest("DELETE", `/api/contestant-events/${eventId}`);
      await adminApiRequest("POST", `/api/seasons/${selectedSeasonId}/weeks/${selectedWeekId}/recalc`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasons", selectedSeasonId, "weeks", selectedWeekId, "contestant-events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/weeks", selectedWeekId, "scores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/scores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contestants"] });
      toast({ title: "Event Removed", description: "Score recalculated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove event.", variant: "destructive" });
    },
  });

  const saveBonusMutation = useMutation({
    mutationFn: ({ teamId, bonus }: { teamId: number; bonus: number }) =>
      adminApiRequest("POST", `/api/weeks/${selectedWeekId}/bonuses`, { teamId, bonus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weeks", selectedWeekId, "bonuses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bonuses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Bonus Saved" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save bonus.", variant: "destructive" });
    },
  });

  const updatePointsMutation = useMutation({
    mutationFn: ({ eventKey, points }: { eventKey: string; points: number }) =>
      adminApiRequest("PUT", `/api/seasons/${selectedSeasonId}/events/${eventKey}`, { points }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasons", selectedSeasonId, "events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/seasons", selectedSeasonId, "weeks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/scores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Points Updated", description: "All scores recalculated for this season." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update points.", variant: "destructive" });
    },
  });

  const createSeasonMutation = useMutation({
    mutationFn: (data: { name: string; number: number }) =>
      adminApiRequest("POST", "/api/seasons", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasons"] });
      toast({ title: "Season Created", description: "New season has been added." });
      closeSeasonDialog();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create season.", variant: "destructive" });
    },
  });

  const updateSeasonMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; number: number } }) =>
      adminApiRequest("PATCH", `/api/seasons/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasons"] });
      toast({ title: "Season Updated", description: "Season has been updated." });
      closeSeasonDialog();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update season.", variant: "destructive" });
    },
  });

  const deleteSeasonMutation = useMutation({
    mutationFn: (id: number) => adminApiRequest("DELETE", `/api/seasons/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasons"] });
      toast({ title: "Season Deleted", description: "Season has been removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete season.", variant: "destructive" });
    },
  });

  const createTribeMutation = useMutation({
    mutationFn: (data: { name: string; color: string; seasonId: number }) =>
      adminApiRequest("POST", "/api/tribes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tribes"] });
      toast({ title: "Tribe Created", description: "New tribe has been added." });
      closeTribeDialog();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create tribe.", variant: "destructive" });
    },
  });

  const updateTribeMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; color: string; seasonId: number } }) =>
      adminApiRequest("PATCH", `/api/tribes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tribes"] });
      toast({ title: "Tribe Updated", description: "Tribe has been updated." });
      closeTribeDialog();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update tribe.", variant: "destructive" });
    },
  });

  const deleteTribeMutation = useMutation({
    mutationFn: (id: number) => adminApiRequest("DELETE", `/api/tribes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tribes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contestants"] });
      toast({ title: "Tribe Deleted", description: "Tribe has been removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete tribe.", variant: "destructive" });
    },
  });

  const handleAddWeek = () => {
    const newWeekNumber = weeks.length + 1;
    createWeekMutation.mutate(newWeekNumber);
  };

  const handleConfirmAddEvents = () => {
    if (!addEventContestantId) return;
    if (selectedEventKeys.length > 0) {
      addEventsMutation.mutate({ contestantId: addEventContestantId, eventKeys: selectedEventKeys });
    }
  };

  const handleAddCustomEvent = () => {
    if (!addEventContestantId || !customEventName.trim()) return;
    const pts = parseInt(customEventPoints) || 0;
    addEventsMutation.mutate({ contestantId: addEventContestantId, customEvent: { eventName: customEventName.trim(), points: pts } });
    setCustomEventName("");
    setCustomEventPoints("");
    setShowCustomEvent(false);
  };

  const toggleEventKey = (key: string) => {
    setSelectedEventKeys(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const getEventPoints = (evt: ContestantEvent): number => {
    if (evt.pointsOverride !== null) return evt.pointsOverride;
    const setting = eventSettings.find(s => s.eventKey === evt.eventKey);
    return setting?.points ?? 0;
  };

  const filteredEvents = eventSettings.filter(e =>
    e.eventName.toLowerCase().includes(eventSearchQuery.toLowerCase())
  );

  const handleBonusChange = (teamId: number, value: string) => {
    const numValue = parseInt(value) || 0;
    setBonuses(prev => ({ ...prev, [teamId]: numValue }));
  };

  const handleSaveBonus = (teamId: number) => {
    saveBonusMutation.mutate({ teamId, bonus: bonuses[teamId] || 0 });
  };

  const handlePointsBlur = (eventKey: string) => {
    const val = editingPoints[eventKey];
    if (val === undefined) return;
    const pts = parseInt(val);
    if (isNaN(pts)) return;
    const current = eventSettings.find(e => e.eventKey === eventKey);
    if (current && current.points !== pts) {
      updatePointsMutation.mutate({ eventKey, points: pts });
    }
    setEditingPoints(prev => {
      const next = { ...prev };
      delete next[eventKey];
      return next;
    });
  };

  const closeSeasonDialog = () => {
    setSeasonDialogOpen(false);
    setEditingSeason(null);
    setSeasonName("");
    setSeasonNumber("");
  };

  const openCreateSeason = () => {
    setEditingSeason(null);
    const nextNumber = seasons.length > 0 ? Math.max(...seasons.map(s => s.number)) + 1 : 1;
    setSeasonName(`Season ${nextNumber}`);
    setSeasonNumber(nextNumber.toString());
    setSeasonDialogOpen(true);
  };

  const openEditSeason = (season: Season) => {
    setEditingSeason(season);
    setSeasonName(season.name);
    setSeasonNumber(season.number.toString());
    setSeasonDialogOpen(true);
  };

  const handleSeasonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(seasonNumber);
    if (!seasonName.trim() || isNaN(num)) return;

    if (editingSeason) {
      updateSeasonMutation.mutate({ id: editingSeason.id, data: { name: seasonName.trim(), number: num } });
    } else {
      createSeasonMutation.mutate({ name: seasonName.trim(), number: num });
    }
  };

  const closeTribeDialog = () => {
    setTribeDialogOpen(false);
    setEditingTribe(null);
    setTribeName("");
    setTribeColor("#808080");
  };

  const openCreateTribe = () => {
    setEditingTribe(null);
    setTribeName("");
    setTribeColor("#808080");
    setTribeDialogOpen(true);
  };

  const openEditTribe = (tribe: Tribe) => {
    setEditingTribe(tribe);
    setTribeName(tribe.name);
    setTribeColor(tribe.color);
    setTribeDialogOpen(true);
  };

  const handleTribeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tribeName.trim() || !selectedSeasonId) return;
    const seasonIdNum = parseInt(selectedSeasonId);

    if (editingTribe) {
      updateTribeMutation.mutate({ id: editingTribe.id, data: { name: tribeName.trim(), color: tribeColor, seasonId: seasonIdNum } });
    } else {
      createTribeMutation.mutate({ name: tribeName.trim(), color: tribeColor, seasonId: seasonIdNum });
    }
  };

  const isLoading = contestantsLoading || weeksLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <Skeleton className="h-10 w-48 mb-8" />
          <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold font-['Slackey'] tracking-wide" data-testid="text-page-title">
              Admin
            </h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <SeasonSelector
              seasons={seasons}
              selectedSeasonId={selectedSeasonId}
              onSeasonChange={setSelectedSeasonId}
            />
          </div>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          <Button
            variant={activeTab === "scoring" ? "default" : "outline"}
            onClick={() => setActiveTab("scoring")}
            data-testid="button-tab-scoring"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Enter Results
          </Button>
          <Button
            variant={activeTab === "settings" ? "default" : "outline"}
            onClick={() => setActiveTab("settings")}
            data-testid="button-tab-settings"
          >
            <Zap className="h-4 w-4 mr-2" />
            Point Value Settings
          </Button>
          <Button
            variant={activeTab === "seasons" ? "default" : "outline"}
            onClick={() => setActiveTab("seasons")}
            data-testid="button-tab-seasons"
          >
            <Tv className="h-4 w-4 mr-2" />
            Seasons
          </Button>
          <Button
            variant={activeTab === "tribes" ? "default" : "outline"}
            onClick={() => setActiveTab("tribes")}
            data-testid="button-tab-tribes"
          >
            <Palette className="h-4 w-4 mr-2" />
            Tribes
          </Button>
          <Button
            variant={activeTab === "bonus" ? "default" : "outline"}
            onClick={() => setActiveTab("bonus")}
            data-testid="button-tab-bonus"
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Bonus Questions
          </Button>
        </div>

        {activeTab === "scoring" && (
          <>
            <Card className="mb-6">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 space-y-0 pb-4">
                <CardTitle className="text-xl font-['Slackey'] tracking-wide flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Enter Results
                </CardTitle>
                <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
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
              </CardHeader>
              <CardContent>
                {weeks.length === 0 ? (
                  <div className="py-12 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">Add a week to start entering results.</p>
                    <Button onClick={handleAddWeek} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Week 1
                    </Button>
                  </div>
                ) : contestants.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Add contestants before entering results.</p>
                ) : (
                  <>
                  <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search contestants..."
                        value={contestantSearch}
                        onChange={(e) => setContestantSearch(e.target.value)}
                        className="pl-9"
                        data-testid="input-contestant-search"
                      />
                    </div>
                    <Select value={tribeFilter} onValueChange={setTribeFilter}>
                      <SelectTrigger className="w-40" data-testid="select-tribe-filter">
                        <SelectValue placeholder="All Tribes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Tribes</SelectItem>
                        {tribes.map((tribe) => (
                          <SelectItem key={tribe.id} value={tribe.id.toString()}>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: tribe.color }} />
                              {tribe.name}
                            </div>
                          </SelectItem>
                        ))}
                        <SelectItem value="none">No Tribe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    {contestants
                      .filter(c => {
                        if (contestantSearch && !c.name.toLowerCase().includes(contestantSearch.toLowerCase())) return false;
                        if (tribeFilter === "none" && c.tribeId) return false;
                        if (tribeFilter === "none" && !c.tribeId) return true;
                        if (tribeFilter !== "all" && tribeFilter !== "none" && c.tribeId !== parseInt(tribeFilter)) return false;
                        return true;
                      })
                      .map((contestant) => {
                      const evts = contestantEvents.filter(e => e.contestantId === contestant.id);
                      const totalPoints = evts.reduce((sum, e) => sum + getEventPoints(e), 0);
                      const isEliminated = contestant.eliminated;
                      const team = teams.find(t => t.id === contestant.teamId);
                      const tribe = tribes.find(t => t.id === contestant.tribeId);

                      return (
                        <div
                          key={contestant.id}
                          className={`border rounded-md p-3 ${isEliminated ? "opacity-50 bg-muted/30" : ""}`}
                          style={tribe ? { borderLeftWidth: '3px', borderLeftColor: tribe.color } : undefined}
                          data-testid={`row-contestant-${contestant.id}`}
                        >
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarImage src={contestant.imageUrl || undefined} alt={contestant.name} />
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {contestant.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <span className="font-medium block truncate">{contestant.name}</span>
                                <div className="flex items-center gap-2">
                                  {team && <span className="text-xs text-muted-foreground">{team.name}</span>}
                                  {tribe && (
                                    <>
                                      {team && <span className="text-xs text-muted-foreground">·</span>}
                                      <span className="text-xs flex items-center gap-1" style={{ color: tribe.color }}>
                                        <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: tribe.color }} />
                                        {tribe.name}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isEliminated && <Badge variant="destructive" className="text-xs">Eliminated</Badge>}
                              <Badge variant="secondary" className="text-xs font-mono">{totalPoints} pts</Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1"
                                disabled={isEliminated}
                                onClick={() => {
                                  setAddEventContestantId(contestant.id);
                                  setSelectedEventKeys([]);
                                  setEventSearchQuery("");
                                  setShowCustomEvent(false);
                                }}
                                data-testid={`button-add-event-${contestant.id}`}
                              >
                                <Plus className="h-3 w-3" />
                                Add Event
                              </Button>
                            </div>
                          </div>
                          {evts.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {evts.map((evt) => {
                                const pts = getEventPoints(evt);
                                return (
                                  <Badge
                                    key={evt.id}
                                    variant="outline"
                                    className="gap-1 pr-1"
                                    data-testid={`chip-event-${evt.id}`}
                                  >
                                    <span className="truncate max-w-[150px]">{evt.eventName}</span>
                                    <span className={`text-xs font-mono ${pts >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                                      {pts > 0 ? `+${pts}` : pts}
                                    </span>
                                    <button
                                      onClick={() => removeEventMutation.mutate(evt.id)}
                                      className="ml-0.5 rounded-full p-0.5 hover:bg-destructive/20"
                                      data-testid={`button-remove-event-${evt.id}`}
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  </>
                )}
              </CardContent>
            </Card>

            {teams.length > 0 && selectedWeekId && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-['Slackey'] tracking-wide">Team Bonuses / Adjustments</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Team</TableHead>
                        <TableHead className="w-32 text-right">Bonus Points</TableHead>
                        <TableHead className="w-24"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teams.map((team) => (
                        <TableRow key={team.id} data-testid={`row-bonus-${team.id}`}>
                          <TableCell><span className="font-medium">{team.name}</span></TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={bonuses[team.id] || 0}
                              onChange={(e) => handleBonusChange(team.id, e.target.value)}
                              className="w-24 text-center ml-auto"
                              data-testid={`input-bonus-${team.id}`}
                            />
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" onClick={() => handleSaveBonus(team.id)} data-testid={`button-save-bonus-${team.id}`}>
                              <Save className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {activeTab === "settings" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-['Slackey'] tracking-wide flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Point Value Settings
              </CardTitle>
              <p className="text-sm text-muted-foreground">Editing a point value will retroactively update all scores for this season.</p>
            </CardHeader>
            <CardContent>
              {eventSettings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No scoring rules configured for this season.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead className="w-32 text-right">Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eventSettings.map((event) => (
                      <TableRow key={event.id} data-testid={`row-setting-${event.eventKey}`}>
                        <TableCell className="font-medium">{event.eventName}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={editingPoints[event.eventKey] ?? event.points}
                            onChange={(e) => setEditingPoints(prev => ({ ...prev, [event.eventKey]: e.target.value }))}
                            onBlur={() => handlePointsBlur(event.eventKey)}
                            className="w-24 text-center ml-auto"
                            data-testid={`input-points-${event.eventKey}`}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "seasons" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
              <CardTitle className="text-xl font-['Slackey'] tracking-wide flex items-center gap-2">
                <Tv className="h-5 w-5 text-primary" />
                Seasons
              </CardTitle>
              <Button onClick={openCreateSeason} className="gap-2" data-testid="button-add-season">
                <Plus className="h-4 w-4" />
                New Season
              </Button>
            </CardHeader>
            <CardContent>
              {seasons.length === 0 ? (
                <div className="text-center py-12">
                  <Tv className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h2 className="text-xl font-semibold mb-2">No Seasons Yet</h2>
                  <p className="text-muted-foreground mb-4">Create your first season to get started!</p>
                  <Button onClick={openCreateSeason} className="gap-2" data-testid="button-create-first-season">
                    <Plus className="h-4 w-4" />
                    Create First Season
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24 text-center">Number</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="w-24 text-center">Status</TableHead>
                      <TableHead className="w-24 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {seasons.map((season, index) => (
                      <TableRow key={season.id} data-testid={`row-season-${season.id}`}>
                        <TableCell className="text-center font-semibold">{season.number}</TableCell>
                        <TableCell className="font-medium">{season.name}</TableCell>
                        <TableCell className="text-center">
                          {index === 0 ? (
                            <Badge variant="default" className="text-xs">Current</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Past</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditSeason(season)}
                              data-testid={`button-edit-season-${season.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteSeasonMutation.mutate(season.id)}
                              data-testid={`button-delete-season-${season.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "tribes" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
              <CardTitle className="text-xl font-['Slackey'] tracking-wide flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Tribes
              </CardTitle>
              <Button onClick={openCreateTribe} className="gap-2" disabled={!selectedSeasonId} data-testid="button-add-tribe">
                <Plus className="h-4 w-4" />
                New Tribe
              </Button>
            </CardHeader>
            <CardContent>
              {!selectedSeasonId ? (
                <p className="text-center text-muted-foreground py-8">Select a season to manage tribes.</p>
              ) : tribesLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : tribes.length === 0 ? (
                <div className="text-center py-12">
                  <Palette className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h2 className="text-xl font-semibold mb-2">No Tribes Yet</h2>
                  <p className="text-muted-foreground mb-4">Create tribes for this season.</p>
                  <Button onClick={openCreateTribe} className="gap-2" data-testid="button-create-first-tribe">
                    <Plus className="h-4 w-4" />
                    Create First Tribe
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Color</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="w-24 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tribes.map((tribe) => (
                      <TableRow key={tribe.id} data-testid={`row-tribe-${tribe.id}`}>
                        <TableCell>
                          <div
                            className="h-5 w-5 rounded-full border"
                            style={{ backgroundColor: tribe.color }}
                            data-testid={`swatch-tribe-${tribe.id}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{tribe.name}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditTribe(tribe)}
                              data-testid={`button-edit-tribe-${tribe.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteTribeMutation.mutate(tribe.id)}
                              data-testid={`button-delete-tribe-${tribe.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        <Dialog open={addEventContestantId !== null} onOpenChange={(open) => { if (!open) setAddEventContestantId(null); }}>
          <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="font-['Slackey'] tracking-wide">
                Add Events - {contestants.find(c => c.id === addEventContestantId)?.name}
              </DialogTitle>
            </DialogHeader>

            {!showCustomEvent ? (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search events..."
                    value={eventSearchQuery}
                    onChange={(e) => setEventSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-events"
                  />
                </div>

                <div className="overflow-y-auto flex-1 max-h-[40vh] space-y-1">
                  {filteredEvents.map((event) => {
                    const isSelected = selectedEventKeys.includes(event.eventKey);
                    return (
                      <button
                        key={event.eventKey}
                        onClick={() => toggleEventKey(event.eventKey)}
                        className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between gap-2 transition-colors ${
                          isSelected ? "bg-primary/10 border border-primary/30" : "hover-elevate"
                        }`}
                        data-testid={`option-event-${event.eventKey}`}
                      >
                        <span className="text-sm truncate">{event.eventName}</span>
                        <Badge variant={event.points >= 0 ? "secondary" : "destructive"} className="shrink-0">
                          {event.points > 0 ? `+${event.points}` : event.points}
                        </Badge>
                      </button>
                    );
                  })}
                </div>

                <DialogFooter className="flex-col gap-2 sm:flex-col">
                  <Button
                    variant="outline"
                    onClick={() => setShowCustomEvent(true)}
                    className="w-full"
                    data-testid="button-custom-event"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Custom Event
                  </Button>
                  <Button
                    onClick={handleConfirmAddEvents}
                    disabled={selectedEventKeys.length === 0 || addEventsMutation.isPending}
                    className="w-full"
                    data-testid="button-confirm-events"
                  >
                    {addEventsMutation.isPending ? "Adding..." : `Add ${selectedEventKeys.length} Event${selectedEventKeys.length !== 1 ? "s" : ""}`}
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <div className="space-y-4">
                <Input
                  placeholder="Event name"
                  value={customEventName}
                  onChange={(e) => setCustomEventName(e.target.value)}
                  data-testid="input-custom-event-name"
                />
                <Input
                  type="number"
                  placeholder="Points"
                  value={customEventPoints}
                  onChange={(e) => setCustomEventPoints(e.target.value)}
                  data-testid="input-custom-event-points"
                />
                <DialogFooter className="flex-col gap-2 sm:flex-col">
                  <Button variant="outline" onClick={() => setShowCustomEvent(false)} className="w-full">
                    Back to Event List
                  </Button>
                  <Button
                    onClick={handleAddCustomEvent}
                    disabled={!customEventName.trim() || addEventsMutation.isPending}
                    className="w-full"
                    data-testid="button-add-custom-event"
                  >
                    {addEventsMutation.isPending ? "Adding..." : "Add Custom Event"}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {activeTab === "bonus" && selectedSeasonId && (
          <AdminBonusTab selectedSeasonId={selectedSeasonId} weeks={weeks} />
        )}

        <Dialog open={seasonDialogOpen} onOpenChange={(open) => { if (!open) closeSeasonDialog(); else setSeasonDialogOpen(open); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-['Slackey'] text-xl tracking-wide">
                {editingSeason ? "Edit Season" : "New Season"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSeasonSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seasonNumber">Season Number</Label>
                <Input
                  id="seasonNumber"
                  type="number"
                  value={seasonNumber}
                  onChange={(e) => setSeasonNumber(e.target.value)}
                  placeholder="e.g. 49"
                  data-testid="input-season-number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seasonName">Season Name</Label>
                <Input
                  id="seasonName"
                  value={seasonName}
                  onChange={(e) => setSeasonName(e.target.value)}
                  placeholder="e.g. Season 49"
                  data-testid="input-season-name"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeSeasonDialog}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createSeasonMutation.isPending || updateSeasonMutation.isPending}
                  data-testid="button-submit-season"
                >
                  {editingSeason ? "Save Changes" : "Create Season"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={tribeDialogOpen} onOpenChange={(open) => { if (!open) closeTribeDialog(); else setTribeDialogOpen(open); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-['Slackey'] text-xl tracking-wide">
                {editingTribe ? "Edit Tribe" : "New Tribe"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleTribeSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tribeName">Tribe Name</Label>
                <Input
                  id="tribeName"
                  value={tribeName}
                  onChange={(e) => setTribeName(e.target.value)}
                  placeholder="e.g. Lavo"
                  data-testid="input-tribe-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tribeColor">Tribe Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    id="tribeColor"
                    type="color"
                    value={tribeColor}
                    onChange={(e) => setTribeColor(e.target.value)}
                    className="h-9 w-14 cursor-pointer rounded-md border"
                    data-testid="input-tribe-color"
                  />
                  <Input
                    value={tribeColor}
                    onChange={(e) => setTribeColor(e.target.value)}
                    placeholder="#808080"
                    className="flex-1"
                    data-testid="input-tribe-color-hex"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeTribeDialog}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createTribeMutation.isPending || updateTribeMutation.isPending}
                  data-testid="button-submit-tribe"
                >
                  {editingTribe ? "Save Changes" : "Create Tribe"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default function Admin() {
  return (
    <PinGate>
      <AdminContent />
    </PinGate>
  );
}
