import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

interface Score {
  contestantId: number;
  points: number;
}

interface TeamBonus {
  teamId: number;
  bonus: number;
}

interface WeeklyScoringProps {
  contestants: Contestant[];
  teams: Team[];
  weeks: number[];
  initialScores?: Score[];
  initialBonuses?: TeamBonus[];
  onSave: (weekNumber: number, scores: Score[], bonuses: TeamBonus[]) => void;
}

export default function WeeklyScoring({ 
  contestants, 
  teams, 
  weeks,
  initialScores = [],
  initialBonuses = [],
  onSave 
}: WeeklyScoringProps) {
  const { toast } = useToast();
  const [selectedWeek, setSelectedWeek] = useState<string>(weeks[weeks.length - 1]?.toString() || "1");
  const [scores, setScores] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {};
    initialScores.forEach(s => { initial[s.contestantId] = s.points; });
    return initial;
  });
  const [bonuses, setBonuses] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {};
    initialBonuses.forEach(b => { initial[b.teamId] = b.bonus; });
    return initial;
  });

  const handleScoreChange = (contestantId: number, value: string) => {
    const numValue = parseInt(value) || 0;
    setScores(prev => ({ ...prev, [contestantId]: numValue }));
  };

  const handleBonusChange = (teamId: number, value: string) => {
    const numValue = parseInt(value) || 0;
    setBonuses(prev => ({ ...prev, [teamId]: numValue }));
  };

  const handleSave = () => {
    const scoreArray: Score[] = Object.entries(scores).map(([id, points]) => ({
      contestantId: parseInt(id),
      points
    }));
    const bonusArray: TeamBonus[] = Object.entries(bonuses).map(([id, bonus]) => ({
      teamId: parseInt(id),
      bonus
    }));
    onSave(parseInt(selectedWeek), scoreArray, bonusArray);
    toast({
      title: "Scores Saved",
      description: `Week ${selectedWeek} scores have been saved successfully.`,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2 text-2xl font-bold font-[Montserrat]">
            <Calendar className="h-6 w-6 text-primary" />
            Weekly Scoring
          </CardTitle>
          <div className="flex items-center gap-4">
            <Select value={selectedWeek} onValueChange={setSelectedWeek}>
              <SelectTrigger className="w-32" data-testid="select-week">
                <SelectValue placeholder="Week" />
              </SelectTrigger>
              <SelectContent>
                {weeks.map((week) => (
                  <SelectItem key={week} value={week.toString()}>
                    Week {week}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleSave} className="gap-2" data-testid="button-save-scores">
              <Save className="h-4 w-4" />
              Save Scores
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
