import TeamCard from "../TeamCard";

// todo: remove mock functionality
const mockContestants = [
  { id: 1, name: "Marcus" },
  { id: 2, name: "Elena" },
  { id: 3, name: "Jake" },
];

export default function TeamCardExample() {
  return (
    <TeamCard
      id={1}
      name="Tribal Council"
      totalPoints={285}
      contestants={mockContestants}
      onEdit={(id) => console.log("Edit team", id)}
      onDelete={(id) => console.log("Delete team", id)}
    />
  );
}
