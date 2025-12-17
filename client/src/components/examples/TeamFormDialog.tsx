import { useState } from "react";
import { Button } from "@/components/ui/button";
import TeamFormDialog from "../TeamFormDialog";
import { Plus } from "lucide-react";

export default function TeamFormDialogExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4">
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Team
      </Button>
      <TeamFormDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={(data) => console.log("Team submitted:", data)}
      />
    </div>
  );
}
