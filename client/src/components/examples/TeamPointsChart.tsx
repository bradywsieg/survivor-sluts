import TeamPointsChart from "../TeamPointsChart";

// todo: remove mock functionality
const mockData = [
  { week: "Week 1", "Tribal Council": 45, "Island Survivors": 38, "Fire Makers": 32, "Hidden Immunity": 28 },
  { week: "Week 2", "Tribal Council": 92, "Island Survivors": 78, "Fire Makers": 65, "Hidden Immunity": 55 },
  { week: "Week 3", "Tribal Council": 145, "Island Survivors": 125, "Fire Makers": 98, "Hidden Immunity": 88 },
  { week: "Week 4", "Tribal Council": 198, "Island Survivors": 172, "Fire Makers": 142, "Hidden Immunity": 115 },
  { week: "Week 5", "Tribal Council": 285, "Island Survivors": 242, "Fire Makers": 198, "Hidden Immunity": 156 },
];

const teamNames = ["Tribal Council", "Island Survivors", "Fire Makers", "Hidden Immunity"];

export default function TeamPointsChartExample() {
  return <TeamPointsChart data={mockData} teamNames={teamNames} />;
}
