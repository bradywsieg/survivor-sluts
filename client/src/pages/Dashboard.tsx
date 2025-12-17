import { useQuery } from "@tanstack/react-query";
import HeroBanner from "@/components/HeroBanner";
import StandingsTable from "@/components/StandingsTable";
import TeamPointsChart from "@/components/TeamPointsChart";
import ContestantPerformanceChart from "@/components/ContestantPerformanceChart";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface DashboardData {
  teams: { id: number; name: string; imageUrl?: string; totalPoints: number; contestants: any[] }[];
  contestants: { id: number; name: string; imageUrl?: string; totalPoints: number; teamName?: string; eliminated?: boolean }[];
  weeks: { id: number; weekNumber: number }[];
  weeklyData: Record<string, string | number>[];
  teamNames: string[];
}

export default function Dashboard() {
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
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

  const contestantChartData = contestants.map(c => ({
    name: c.name,
    points: c.totalPoints,
    eliminated: c.eliminated,
  }));

  return (
    <div className="min-h-screen bg-background">
      <HeroBanner />
      
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <StandingsTable teams={teams} />
          {weeklyData.length > 0 && teamNames.length > 0 ? (
            <TeamPointsChart data={weeklyData} teamNames={teamNames} />
          ) : (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                Add teams and enter weekly scores to see the points chart.
              </CardContent>
            </Card>
          )}
        </div>
        
        <div className="mt-8">
          {contestantChartData.length > 0 ? (
            <ContestantPerformanceChart data={contestantChartData} />
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
