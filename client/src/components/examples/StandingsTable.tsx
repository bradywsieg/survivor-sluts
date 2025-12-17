import StandingsTable from "../StandingsTable";

// todo: remove mock functionality
const mockTeams = [
  { id: 1, name: "Tribal Council", totalPoints: 285 },
  { id: 2, name: "Island Survivors", totalPoints: 242 },
  { id: 3, name: "Fire Makers", totalPoints: 198 },
  { id: 4, name: "Hidden Immunity", totalPoints: 156 },
];

export default function StandingsTableExample() {
  return <StandingsTable teams={mockTeams} />;
}
