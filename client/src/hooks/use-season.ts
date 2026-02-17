import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface Season {
  id: number;
  name: string;
  number: number;
}

export function useSeason() {
  const { data: seasons = [], isLoading } = useQuery<Season[]>({
    queryKey: ["/api/seasons"],
  });

  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");

  useEffect(() => {
    if (seasons.length > 0 && !selectedSeasonId) {
      setSelectedSeasonId(seasons[0].id.toString());
    }
  }, [seasons, selectedSeasonId]);

  const selectedSeason = seasons.find(s => s.id.toString() === selectedSeasonId);

  return {
    seasons,
    selectedSeasonId,
    setSelectedSeasonId,
    selectedSeason,
    isLoading,
  };
}
