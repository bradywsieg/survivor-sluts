import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy } from "lucide-react";

interface Team {
  id: number;
  name: string;
  imageUrl?: string;
  totalPoints: number;
}

interface StandingsTableProps {
  teams: Team[];
}

export default function StandingsTable({ teams }: StandingsTableProps) {
  const sortedTeams = [...teams].sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-2xl font-bold font-['Titan_One'] tracking-wide">
          <Trophy className="h-6 w-6 text-primary" />
          Team Standings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-center">Rank</TableHead>
              <TableHead>Team</TableHead>
              <TableHead className="text-right">Points</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTeams.map((team, index) => (
              <TableRow key={team.id} data-testid={`row-team-${team.id}`}>
                <TableCell className="text-center">
                  <span className="text-xl font-bold text-muted-foreground">
                    {index + 1}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={team.imageUrl} alt={team.name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {team.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-lg">{team.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-lg font-semibold">{team.totalPoints}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {sortedTeams.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No teams yet. Create your first team to get started!</p>
        )}
      </CardContent>
    </Card>
  );
}
