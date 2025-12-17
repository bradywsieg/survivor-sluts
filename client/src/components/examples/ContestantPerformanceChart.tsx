import ContestantPerformanceChart from "../ContestantPerformanceChart";

// todo: remove mock functionality
const mockData = [
  { name: "Marcus", points: 85 },
  { name: "Elena", points: 72 },
  { name: "Jake", points: 68 },
  { name: "Sophia", points: 55 },
  { name: "Tyler", points: 48 },
  { name: "Maya", points: 42, eliminated: true },
  { name: "Chris", points: 35, eliminated: true },
];

export default function ContestantPerformanceChartExample() {
  return <ContestantPerformanceChart data={mockData} />;
}
