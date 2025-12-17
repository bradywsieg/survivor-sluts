import WeeklyScoring from "../WeeklyScoring";

// todo: remove mock functionality
const mockContestants = [
  { id: 1, name: "Marcus" },
  { id: 2, name: "Elena" },
  { id: 3, name: "Jake" },
  { id: 4, name: "Sophia" },
  { id: 5, name: "Tyler" },
  { id: 6, name: "Maya", eliminated: true },
];

const mockTeams = [
  { id: 1, name: "Tribal Council" },
  { id: 2, name: "Island Survivors" },
  { id: 3, name: "Fire Makers" },
];

const mockWeeks = [1, 2, 3, 4, 5];

export default function WeeklyScoringExample() {
  return (
    <WeeklyScoring
      contestants={mockContestants}
      teams={mockTeams}
      weeks={mockWeeks}
      onSave={(week, scores, bonuses) => {
        console.log("Saved week", week, "scores:", scores, "bonuses:", bonuses);
      }}
    />
  );
}
