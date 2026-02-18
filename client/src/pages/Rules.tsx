import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import SeasonSelector from "@/components/SeasonSelector";
import { useSeason } from "@/hooks/use-season";
import { BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface EventSetting {
  id: number;
  seasonId: number;
  eventKey: string;
  eventName: string;
  points: number;
}

export default function Rules() {
  const { seasons, selectedSeasonId, setSelectedSeasonId } = useSeason();

  const { data: events = [], isLoading } = useQuery<EventSetting[]>({
    queryKey: ["/api/seasons", selectedSeasonId, "events"],
    queryFn: async () => {
      const res = await fetch(`/api/seasons/${selectedSeasonId}/events`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!selectedSeasonId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
          <Skeleton className="h-10 w-48 mb-8" />
          <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold font-['Slackey'] tracking-wide" data-testid="text-page-title">
              Scoring Rules
            </h1>
          </div>
          <SeasonSelector
            seasons={seasons}
            selectedSeasonId={selectedSeasonId}
            onSeasonChange={setSelectedSeasonId}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-['Slackey'] tracking-wide flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Point Values
            </CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No scoring rules configured for this season.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead className="w-24 text-right">Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id} data-testid={`row-rule-${event.eventKey}`}>
                      <TableCell className="font-medium">{event.eventName}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={event.points >= 0 ? "secondary" : "destructive"}>
                          {event.points > 0 ? `+${event.points}` : event.points}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
