import { useQuery } from "@tanstack/react-query";
import HeroBanner from "@/components/HeroBanner";
import StandingsTable from "@/components/StandingsTable";
import TeamPointsChart from "@/components/TeamPointsChart";
import ContestantPerformanceChart from "@/components/ContestantPerformanceChart";
import SeasonSelector from "@/components/SeasonSelector";
import { useSeason } from "@/hooks/use-season";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";

interface Tribe {
  id: number;
  name: string;
  color: string;
  seasonId: number;
}

interface IdolWatchItem {
  contestantId: number;
  name: string;
  imageUrl?: string | null;
  tribeColor?: string | null;
  tribeName?: string | null;
  unplayedIdols: number;
  unplayedAdvantages: number;
}

interface DashboardData {
  teams: { id: number; name: string; imageUrl?: string; totalPoints: number; isWinner?: boolean; contestants: any[] }[];
  contestants: { id: number; name: string; imageUrl?: string; totalPoints: number; teamName?: string; teamId?: number | null; eliminated?: boolean; tribeId?: number | null; isSoleSurvivor?: boolean }[];
  weeks: { id: number; weekNumber: number }[];
  weeklyData: Record<string, string | number>[];
  teamNames: string[];
  teamImages: Record<string, string>;
  weeklyContestantScores: Record<number, { contestantId: number; points: number }[]>;
  tribes: Tribe[];
  idolWatch: IdolWatchItem[];
}

export default function Dashboard() {
  const { seasons, selectedSeasonId, setSelectedSeasonId } = useSeason();

  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard", { seasonId: selectedSeasonId }],
    queryFn: async () => {
      const url = selectedSeasonId ? `/api/dashboard?seasonId=${selectedSeasonId}` : `/api/dashboard`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!selectedSeasonId || seasons.length === 0,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <HeroBanner />
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="grid lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader><Skeleton className="h-8 w-48" /></CardHeader>
              <CardContent><Skeleton className="h-64 w-full" /></CardContent>
            </Card>
            <Card>
              <CardHeader><Skeleton className="h-8 w-48" /></CardHeader>
              <CardContent><Skeleton className="h-64 w-full" /></CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <HeroBanner />
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Failed to load dashboard data. Please try again later.
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const teams = data?.teams || [];
  const contestants = data?.contestants || [];
  const weeklyData = data?.weeklyData || [];
  const teamNames = data?.teamNames || [];
  const teamImages = data?.teamImages || {};
  const weeks = data?.weeks || [];
  const weeklyContestantScores = data?.weeklyContestantScores || {};
  const tribesList = data?.tribes || [];
  const idolWatch = data?.idolWatch || [];

  // Determine which teams have the Sole Survivor contestant
  const soleSurvivorTeamIds = new Set(
    contestants.filter(c => c.isSoleSurvivor && c.teamId).map(c => c.teamId)
  );
  const teamsWithFlags = teams.map(t => ({
    ...t,
    hasSoleSurvivor: soleSurvivorTeamIds.has(t.id),
  }));

  const contestantChartData = contestants.map(c => {
    const tribe = tribesList.find(t => t.id === c.tribeId);
    return {
      id: c.id,
      name: c.name,
      imageUrl: c.imageUrl,
      points: c.totalPoints,
      eliminated: c.eliminated,
      tribeColor: tribe?.color,
      isSoleSurvivor: c.isSoleSurvivor,
    };
  });

  return (
    <div className="min-h-screen bg-background">
      <HeroBanner />
      
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center justify-end mb-6">
          <SeasonSelector
            seasons={seasons}
            selectedSeasonId={selectedSeasonId}
            onSeasonChange={setSelectedSeasonId}
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <StandingsTable teams={teamsWithFlags} />
          {weeklyData.length > 0 && teamNames.length > 0 ? (
            <TeamPointsChart data={weeklyData} teamNames={teamNames} teamImages={teamImages} />
          ) : (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                Add teams and enter weekly scores to see the points chart.
              </CardContent>
            </Card>
          )}
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
              <CardTitle className="flex items-center gap-2 text-2xl font-bold font-['Slackey'] tracking-wide">
                <Eye className="h-6 w-6 text-primary" />
                Idol & Advantage Tracker
              </CardTitle>
            </CardHeader>
            <CardContent>
              {idolWatch.length > 0 ? (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {idolWatch.map((item) => (
                    <div
                      key={item.contestantId}
                      className="flex items-center gap-3 p-3 border rounded-md"
                      style={item.tribeColor ? { borderLeft: `4px solid ${item.tribeColor}` } : undefined}
                      data-testid={`idol-watch-${item.contestantId}`}
                    >
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={item.imageUrl || undefined} alt={item.name} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                          {item.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <span className="font-medium text-sm block truncate">{item.name}</span>
                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                          {item.unplayedIdols > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {item.unplayedIdols} unplayed {item.unplayedIdols === 1 ? "idol" : "idols"}
                            </Badge>
                          )}
                          {item.unplayedAdvantages > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {item.unplayedAdvantages} unplayed {item.unplayedAdvantages === 1 ? "advantage" : "advantages"}
                            </Badge>
                          )}
                          {item.tribeName && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <span
                                className="inline-block w-2 h-2 rounded-full"
                                style={{ backgroundColor: item.tribeColor || undefined }}
                              />
                              {item.tribeName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-6" data-testid="idol-watch-empty">
                  Currently there are no active idols or advantages
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-8">
          {contestantChartData.length > 0 ? (
            <ContestantPerformanceChart 
              data={contestantChartData} 
              weeks={weeks}
              weeklyContestantScores={weeklyContestantScores}
              contestants={contestants}
            />
          ) : (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                Add contestants to see their performance.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
