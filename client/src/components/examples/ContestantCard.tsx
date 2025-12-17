import ContestantCard from "../ContestantCard";

export default function ContestantCardExample() {
  return (
    <div className="space-y-4">
      <ContestantCard
        id={1}
        name="Marcus"
        totalPoints={85}
        teamName="Tribal Council"
        onEdit={(id) => console.log("Edit contestant", id)}
        onDelete={(id) => console.log("Delete contestant", id)}
      />
      <ContestantCard
        id={2}
        name="Maya"
        totalPoints={42}
        teamName="Fire Makers"
        eliminated
        onEdit={(id) => console.log("Edit contestant", id)}
        onDelete={(id) => console.log("Delete contestant", id)}
      />
    </div>
  );
}
