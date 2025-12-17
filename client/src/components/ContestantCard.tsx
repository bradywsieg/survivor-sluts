import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";

interface ContestantCardProps {
  id: number;
  name: string;
  imageUrl?: string;
  totalPoints: number;
  teamName?: string;
  eliminated?: boolean;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export default function ContestantCard({ 
  id, 
  name, 
  imageUrl, 
  totalPoints, 
  teamName,
  eliminated = false,
  onEdit, 
  onDelete 
}: ContestantCardProps) {
  return (
    <Card 
      className={`group ${eliminated ? 'opacity-60' : ''}`} 
      data-testid={`card-contestant-${id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={imageUrl} alt={name} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{name}</h3>
                {eliminated && (
                  <Badge variant="destructive" className="text-xs">Eliminated</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm text-muted-foreground">{totalPoints} pts</span>
                {teamName && (
                  <span className="text-sm text-muted-foreground">
                    <span className="mx-1">|</span>
                    {teamName}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-1 visibility-hidden group-hover:visibility-visible">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onEdit?.(id)}
              data-testid={`button-edit-contestant-${id}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onDelete?.(id)}
              data-testid={`button-delete-contestant-${id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
