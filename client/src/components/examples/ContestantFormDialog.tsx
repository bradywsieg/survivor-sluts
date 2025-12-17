import { useState } from "react";
import { Button } from "@/components/ui/button";
import ContestantFormDialog from "../ContestantFormDialog";
import { Plus } from "lucide-react";

// todo: remove mock functionality
const mockTeams = [
  { id: 1, name: "Tribal Council" },
  { id: 2, name: "Island Survivors" },
  { id: 3, name: "Fire Makers" },
];

export default function ContestantFormDialogExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4">
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Contestant
      </Button>
      <ContestantFormDialog
        open={open}
        onOpenChange={setOpen}
        teams={mockTeams}
        onSubmit={(data) => console.log("Contestant submitted:", data)}
      />
    </div>
  );
}
