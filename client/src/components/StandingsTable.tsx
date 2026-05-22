import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Trophy } from "lucide-react";

interface Team {
  id: number;
  name: string;
  imageUrl?: string;
  totalPoints: number;
  isWinner?: boolean;
  hasSoleSurvivor?: boolean;
}

interface StandingsTableProps {
  teams: Team[];
}

const torchStyle: React.CSSProperties = {
  filter: "brightness(0) saturate(100%) invert(23%) sepia(95%) saturate(900%) hue-rotate(335deg)",
};

export default function StandingsTable({ teams }: StandingsTableProps) {
  const sortedTeams = [...teams].sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <TooltipProvider delayDuration={200}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2 text-2xl font-bold font-['Slackey'] tracking-wide">
            <Trophy className="h-6 w-6 text-primary" />
            Team Standings
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="w-full">
            {/* Header */}
            <div className="grid grid-cols-[2.5rem_1fr_auto] gap-2 px-2 pb-2 border-b text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <span className="text-center">#</span>
              <span>Team</span>
              <span>Pts</span>
            </div>
            {/* Rows */}
            {sortedTeams.map((team, index) => (
              <div
                key={team.id}
                data-testid={`row-team-${team.id}`}
                className={`grid grid-cols-[2.5rem_1fr_auto] gap-2 items-center px-2 py-3 border-b last:border-0 ${
                  team.isWinner ? "bg-amber-50/60 dark:bg-amber-900/10" : ""
                }`}
              >
                {/* Rank */}
                <span className="text-center text-lg font-bold text-muted-foreground">
                  {index + 1}
                </span>

                {/* Team info */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={team.imageUrl} alt={team.name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                      {team.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={`font-semibold truncate ${
                      team.isWinner ? "text-amber-700" : ""
                    }`}
                  >
                    {team.name}
                  </span>
                  {/* Icons next to name */}
                  <div className="flex items-center gap-1 shrink-0">
                    {team.isWinner && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <img
                            src="/trophy.svg"
                            alt="Champion"
                            className="h-5 w-5 cursor-help"
                            style={torchStyle}
                            data-testid={`icon-champion-${team.id}`}
                          />
                        </TooltipTrigger>
                        <TooltipContent>Team Champion</TooltipContent>
                      </Tooltip>
                    )}
                    {team.hasSoleSurvivor && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <img
                            src="/torch.png"
                            alt="Sole Survivor"
                            className="h-5 w-5 cursor-help"
                            style={torchStyle}
                            data-testid={`icon-sole-survivor-${team.id}`}
                          />
                        </TooltipTrigger>
                        <TooltipContent>Sole Survivor</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>

                {/* Points */}
                <span className="font-semibold text-base tabular-nums">{team.totalPoints}</span>
              </div>
            ))}
            {sortedTeams.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No teams yet. Create your first team to get started!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
