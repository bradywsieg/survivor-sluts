import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Tv } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

interface Season {
  id: number;
  name: string;
  number: number;
}

export default function Seasons() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");

  const { data: seasons = [], isLoading } = useQuery<Season[]>({
    queryKey: ["/api/seasons"],
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; number: number }) =>
      apiRequest("POST", "/api/seasons", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasons"] });
      toast({ title: "Season Created", description: "New season has been added." });
      closeDialog();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create season.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; number: number } }) =>
      apiRequest("PATCH", `/api/seasons/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasons"] });
      toast({ title: "Season Updated", description: "Season has been updated." });
      closeDialog();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update season.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/seasons/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasons"] });
      toast({ title: "Season Deleted", description: "Season has been removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete season.", variant: "destructive" });
    },
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingSeason(null);
    setName("");
    setNumber("");
  };

  const openCreate = () => {
    setEditingSeason(null);
    const nextNumber = seasons.length > 0 ? Math.max(...seasons.map(s => s.number)) + 1 : 1;
    setName(`Season ${nextNumber}`);
    setNumber(nextNumber.toString());
    setDialogOpen(true);
  };

  const openEdit = (season: Season) => {
    setEditingSeason(season);
    setName(season.name);
    setNumber(season.number.toString());
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(number);
    if (!name.trim() || isNaN(num)) return;

    if (editingSeason) {
      updateMutation.mutate({ id: editingSeason.id, data: { name: name.trim(), number: num } });
    } else {
      createMutation.mutate({ name: name.trim(), number: num });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
          <Skeleton className="h-10 w-48 mb-8" />
          <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Tv className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold font-['Slackey'] tracking-wide" data-testid="text-page-title">
              Seasons
            </h1>
          </div>
          <Button onClick={openCreate} className="gap-2" data-testid="button-add-season">
            <Plus className="h-4 w-4" />
            New Season
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
            <CardTitle className="text-xl font-semibold">All Seasons</CardTitle>
          </CardHeader>
          <CardContent>
            {seasons.length === 0 ? (
              <div className="text-center py-12">
                <Tv className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No Seasons Yet</h2>
                <p className="text-muted-foreground mb-4">Create your first season to get started!</p>
                <Button onClick={openCreate} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create First Season
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24 text-center">Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-24 text-center">Status</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {seasons.map((season, index) => (
                    <TableRow key={season.id} data-testid={`row-season-${season.id}`}>
                      <TableCell className="text-center font-semibold">{season.number}</TableCell>
                      <TableCell className="font-medium">{season.name}</TableCell>
                      <TableCell className="text-center">
                        {index === 0 ? (
                          <Badge variant="default" className="text-xs">Current</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Past</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(season)}
                            data-testid={`button-edit-season-${season.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(season.id)}
                            data-testid={`button-delete-season-${season.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setDialogOpen(open); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-['Slackey'] text-xl tracking-wide">
                {editingSeason ? "Edit Season" : "New Season"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seasonNumber">Season Number</Label>
                <Input
                  id="seasonNumber"
                  type="number"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="e.g. 49"
                  data-testid="input-season-number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seasonName">Season Name</Label>
                <Input
                  id="seasonName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Season 49"
                  data-testid="input-season-name"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit-season"
                >
                  {editingSeason ? "Save Changes" : "Create Season"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
