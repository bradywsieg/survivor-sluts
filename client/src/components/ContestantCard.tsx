import { useState } from "react";
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
  tribeColor?: string;
  tribeName?: string;
  bio?: string;
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
  tribeColor,
  tribeName,
  bio,
  onEdit, 
  onDelete 
}: ContestantCardProps) {
  const [bioExpanded, setBioExpanded] = useState(false);

  const bioPreviewLength = 80;
  const hasBio = bio && bio.length > 0;
  const bioIsTruncated = hasBio && bio.length > bioPreviewLength;
  const displayBio = bioExpanded ? bio : bio?.substring(0, bioPreviewLength);

  return (
    <Card 
      className={`group ${eliminated ? 'opacity-60' : ''}`}
      style={tribeColor ? { borderLeft: `4px solid ${tribeColor}` } : undefined}
      data-testid={`card-contestant-${id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-12 w-12 shrink-0">
              <AvatarImage src={imageUrl} alt={name} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold truncate">{name}</h3>
                {eliminated && (
                  <Badge variant="destructive" className="text-xs">Eliminated</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-sm text-muted-foreground">{totalPoints} pts</span>
                {teamName && (
                  <span className="text-sm text-muted-foreground">
                    <span className="mx-1">|</span>
                    {teamName}
                  </span>
                )}
                {tribeName && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <span className="mx-1">|</span>
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: tribeColor }}
                    />
                    {tribeName}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-1 visibility-hidden group-hover:visibility-visible shrink-0">
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
        {hasBio && (
          <div className="mt-2 text-sm text-muted-foreground" data-testid={`text-bio-${id}`}>
            {displayBio}
            {bioIsTruncated && !bioExpanded && "..."}
            {bioIsTruncated && (
              <button
                onClick={() => setBioExpanded(!bioExpanded)}
                className="ml-1 text-primary text-xs font-medium"
                data-testid={`button-bio-toggle-${id}`}
              >
                {bioExpanded ? "See less" : "See more"}
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
