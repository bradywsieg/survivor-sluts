import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Season {
  id: number;
  name: string;
  number: number;
}

interface SeasonSelectorProps {
  seasons: Season[];
  selectedSeasonId: string;
  onSeasonChange: (seasonId: string) => void;
}

export default function SeasonSelector({ seasons, selectedSeasonId, onSeasonChange }: SeasonSelectorProps) {
  if (seasons.length === 0) return null;

  return (
    <Select value={selectedSeasonId} onValueChange={onSeasonChange}>
      <SelectTrigger className="w-48" data-testid="select-season">
        <SelectValue placeholder="Select Season" />
      </SelectTrigger>
      <SelectContent>
        {seasons.map((season) => (
          <SelectItem key={season.id} value={season.id.toString()} data-testid={`option-season-${season.id}`}>
            {season.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
