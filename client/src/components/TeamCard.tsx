import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Users } from "lucide-react";

interface Contestant {
  id: number;
  name: string;
  imageUrl?: string;
}

interface TeamCardProps {
  id: number;
  name: string;
  imageUrl?: string;
  totalPoints: number;
  contestants: Contestant[];
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export default function TeamCard({ 
  id, 
  name, 
  imageUrl, 
  totalPoints, 
  contestants, 
  onEdit, 
  onDelete 
}: TeamCardProps) {
  return (
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
              <h3 className="text-xl font-semibold font-[Montserrat]">{name}</h3>
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
              <div 
                key={contestant.id}
                className="flex items-center gap-2 bg-muted rounded-full pl-1 pr-3 py-1"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={contestant.imageUrl} alt={contestant.name} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {contestant.name.substring(0, 1)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{contestant.name}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
