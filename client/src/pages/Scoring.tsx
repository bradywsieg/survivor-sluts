import { useState } from "react";
import { Button } from "@/components/ui/button";
import WeeklyScoring from "@/components/WeeklyScoring";
import { Calendar, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// todo: remove mock functionality
const mockContestants = [
  { id: 1, name: "Marcus" },
  { id: 2, name: "Elena" },
  { id: 3, name: "Jake" },
  { id: 4, name: "Sophia" },
  { id: 5, name: "Tyler" },
  { id: 6, name: "Maya", eliminated: true },
  { id: 7, name: "Chris", eliminated: true },
];

const mockTeams = [
  { id: 1, name: "Tribal Council" },
  { id: 2, name: "Island Survivors" },
  { id: 3, name: "Fire Makers" },
  { id: 4, name: "Hidden Immunity" },
];

export default function Scoring() {
  const { toast } = useToast();
  const [weeks, setWeeks] = useState([1, 2, 3, 4, 5]);

  const handleAddWeek = () => {
    const newWeek = weeks.length + 1;
    setWeeks([...weeks, newWeek]);
    toast({
      title: "Week Added",
      description: `Week ${newWeek} is now available for scoring.`,
    });
  };

  const handleSaveScores = (weekNumber: number, scores: { contestantId: number; points: number }[], bonuses: { teamId: number; bonus: number }[]) => {
    console.log("Saving scores for week", weekNumber, scores, bonuses);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold font-[Montserrat]" data-testid="text-page-title">
              Weekly Scoring
            </h1>
          </div>
          <Button 
            onClick={handleAddWeek} 
            variant="outline"
            className="gap-2"
            data-testid="button-add-week"
          >
            <Plus className="h-4 w-4" />
            Add Week
          </Button>
        </div>

        <WeeklyScoring
          contestants={mockContestants}
          teams={mockTeams}
          weeks={weeks}
          onSave={handleSaveScores}
        />
      </div>
    </div>
  );
}
