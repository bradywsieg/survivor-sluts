import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil, Trash2, Users, X } from "lucide-react";

interface Contestant {
  id: number;
  name: string;
  imageUrl?: string;
  tribeColor?: string;
  tribeName?: string;
  eliminated?: boolean;
  bio?: string;
  teamName?: string;
}

interface ContestantEvent {
  id: number;
  weekNumber?: number;
  eventName: string;
  eventKey: string | null;
  points: number;
}

interface TeamCardProps {
  id: number;
  name: string;
  imageUrl?: string;
  totalPoints: number;
  contestants: Contestant[];
  seasonId?: string;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export default function TeamCard({ 
  id, 
  name, 
  imageUrl, 
  totalPoints, 
  contestants, 
  seasonId,
  onEdit, 
  onDelete 
}: TeamCardProps) {
  const [selectedContestant, setSelectedContestant] = useState<Contestant | null>(null);

  const { data: contestantEvents = [] } = useQuery<ContestantEvent[]>({
    queryKey: ["/api/contestants", selectedContestant?.id, "events", { seasonId }],
    queryFn: async () => {
      const res = await fetch(`/api/contestants/${selectedContestant!.id}/events?seasonId=${seasonId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!selectedContestant && !!seasonId,
  });

  const eventsByWeek = contestantEvents.reduce((acc, evt) => {
    const week = evt.weekNumber ?? 0;
    if (!acc[week]) acc[week] = [];
    acc[week].push(evt);
    return acc;
  }, {} as Record<number, ContestantEvent[]>);

  return (
    <>
      <Card className="group" data-testid={`card-team-${id}`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={imageUrl} alt={name} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                  {name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-bold font-['Slackey'] tracking-wide">{name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-sm">
                    {totalPoints} pts
                  </Badge>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {contestants.length} contestants
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-1 visibility-hidden group-hover:visibility-visible">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => onEdit?.(id)}
                data-testid={`button-edit-team-${id}`}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => onDelete?.(id)}
                data-testid={`button-delete-team-${id}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {contestants.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {contestants.map((contestant) => (
                <button 
                  key={contestant.id}
                  onClick={() => setSelectedContestant(contestant)}
                  className={`flex items-center gap-2 rounded-full pl-1 pr-3 py-1 cursor-pointer transition-all hover:ring-2 hover:ring-primary/40 ${!contestant.tribeColor ? 'bg-muted' : ''} ${contestant.eliminated ? 'opacity-50 grayscale' : ''}`}
                  style={contestant.tribeColor 
                    ? { backgroundColor: `${contestant.tribeColor}20`, border: `1px solid ${contestant.tribeColor}40` }
                    : undefined
                  }
                  data-testid={`button-contestant-pill-${contestant.id}`}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={contestant.imageUrl} alt={contestant.name} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {contestant.name.substring(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{contestant.name}</span>
                  {contestant.eliminated && (
                    <X className="h-3 w-3 text-destructive" />
                  )}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedContestant} onOpenChange={(open) => { if (!open) setSelectedContestant(null); }}>
        <DialogContent className="max-w-md" data-testid="dialog-contestant-detail">
          {selectedContestant && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedContestant.imageUrl} alt={selectedContestant.name} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {selectedContestant.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="block">{selectedContestant.name}</span>
                    <div className="flex items-center gap-2 mt-1">
                      {selectedContestant.tribeName && (
                        <Badge 
                          variant="outline" 
                          className="text-xs font-normal"
                          style={selectedContestant.tribeColor ? { 
                            borderColor: selectedContestant.tribeColor,
                            color: selectedContestant.tribeColor,
                          } : undefined}
                        >
                          {selectedContestant.tribeName}
                        </Badge>
                      )}
                      {selectedContestant.eliminated && (
                        <Badge variant="destructive" className="text-xs">Eliminated</Badge>
                      )}
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>

              {selectedContestant.bio && (
                <p className="text-sm text-muted-foreground mt-2">{selectedContestant.bio}</p>
              )}

              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-3">Events & Scores</h4>
                {contestantEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No events recorded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(eventsByWeek)
                      .sort(([a], [b]) => parseInt(a) - parseInt(b))
                      .map(([weekNum, evts]) => (
                        <div key={weekNum}>
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Week {weekNum}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {evts.map((evt) => (
                              <Badge key={evt.id} variant="outline" className="gap-1" data-testid={`badge-event-${evt.id}`}>
                                <span className="truncate max-w-[140px]">{evt.eventName}</span>
                                <span className={`text-xs font-mono ${evt.points >= 0 ? "text-green-600" : "text-red-500"}`}>
                                  {evt.points > 0 ? `+${evt.points}` : evt.points}
                                </span>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
