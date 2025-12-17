import { useState } from "react";
import HeroBanner from "@/components/HeroBanner";
import StandingsTable from "@/components/StandingsTable";
import TeamPointsChart from "@/components/TeamPointsChart";
import ContestantPerformanceChart from "@/components/ContestantPerformanceChart";

// todo: remove mock functionality
const mockTeams = [
  { id: 1, name: "Tribal Council", totalPoints: 285 },
  { id: 2, name: "Island Survivors", totalPoints: 242 },
  { id: 3, name: "Fire Makers", totalPoints: 198 },
  { id: 4, name: "Hidden Immunity", totalPoints: 156 },
];

const mockWeeklyData = [
  { week: "Week 1", "Tribal Council": 45, "Island Survivors": 38, "Fire Makers": 32, "Hidden Immunity": 28 },
  { week: "Week 2", "Tribal Council": 92, "Island Survivors": 78, "Fire Makers": 65, "Hidden Immunity": 55 },
  { week: "Week 3", "Tribal Council": 145, "Island Survivors": 125, "Fire Makers": 98, "Hidden Immunity": 88 },
  { week: "Week 4", "Tribal Council": 198, "Island Survivors": 172, "Fire Makers": 142, "Hidden Immunity": 115 },
  { week: "Week 5", "Tribal Council": 285, "Island Survivors": 242, "Fire Makers": 198, "Hidden Immunity": 156 },
];

const mockContestantData = [
  { name: "Marcus", points: 85 },
  { name: "Elena", points: 72 },
  { name: "Jake", points: 68 },
  { name: "Sophia", points: 55 },
  { name: "Tyler", points: 48 },
  { name: "Maya", points: 42, eliminated: true },
  { name: "Chris", points: 35, eliminated: true },
];

export default function Dashboard() {
  const teamNames = mockTeams.map(t => t.name);

  return (
    <div className="min-h-screen bg-background">
      <HeroBanner />
      
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <StandingsTable teams={mockTeams} />
          <TeamPointsChart data={mockWeeklyData} teamNames={teamNames} />
        </div>
        
        <div className="mt-8">
          <ContestantPerformanceChart data={mockContestantData} />
        </div>
      </div>
    </div>
  );
}
