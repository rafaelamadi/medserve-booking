"use client";

import * as React from "react";
import {
  Activity,
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Cpu,
  Gauge,
  Plus,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CLINICAL_MACHINES_DATA,
  type ClinicalMachineVault,
} from "@/data/centre-settings-data";

export function MachinesManagement() {
  const [machines, setMachines] = React.useState<ClinicalMachineVault[]>(CLINICAL_MACHINES_DATA);
  const [centreFilter, setCentreFilter] = React.useState<string>("all");
  const [registerOpen, setRegisterOpen] = React.useState(false);

  // New machine form
  const [name, setName] = React.useState("");
  const [model, setModel] = React.useState("");
  const [manufacturer, setManufacturer] = React.useState<"Elekta" | "Varian" | "Siemens">("Elekta");
  const [centreCode, setCentreCode] = React.useState<"MLCC" | "MKDC" | "MUDC">("MLCC");
  const [vaultRoom, setVaultRoom] = React.useState("");
  const [type, setType] = React.useState<"LINAC" | "CT_SIMULATOR" | "BRACHYTHERAPY">("LINAC");
  const [maxFractions, setMaxFractions] = React.useState(40);

  const filteredMachines = React.useMemo(() => {
    if (centreFilter === "all") return machines;
    return machines.filter((m) => m.centreCode === centreFilter);
  }, [machines, centreFilter]);

  const handleToggleStatus = (machineId: string) => {
    setMachines((prev) =>
      prev.map((m) => {
        if (m.id !== machineId) return m;
        const nextStatus =
          m.status === "OPERATIONAL"
            ? "SCHEDULED_MAINTENANCE"
            : m.status === "SCHEDULED_MAINTENANCE"
              ? "CALIBRATION_QA"
              : "OPERATIONAL";

        toast.info(`Machine Status Updated: ${m.name}`, {
          description: `Vault switched to ${nextStatus.replace(/_/g, " ")}.`,
        });

        return { ...m, status: nextStatus };
      }),
    );
  };

  const handleRegisterMachine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !vaultRoom.trim()) {
      toast.error("Please provide equipment name and vault room name.");
      return;
    }

    const newMachine: ClinicalMachineVault = {
      id: `mac-${Date.now()}`,
      name,
      model: model || `${name} System`,
      manufacturer,
      centreCode,
      vaultRoom,
      type,
      modalities: ["VMAT", "IMRT", "3D-CRT"],
      status: "OPERATIONAL",
      uptimePercentage: 100,
      lastDailyQa: "Pending Verification",
      qaOfficer: "Engr. Babatunde Alabi",
      commissionedDate: new Date().toISOString().slice(0, 10),
      maxDailyFractions: maxFractions,
    };

    setMachines((prev) => [newMachine, ...prev]);
    toast.success("Equipment Vault Registered", {
      description: `${name} has been added to ${centreCode} radiotherapy schedule engine.`,
    });
    setRegisterOpen(false);
    setName("");
    setModel("");
    setVaultRoom("");
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Linear Accelerators & Clinical Vaults
          </h2>
          <p className="text-sm text-muted-foreground">
            Monitor linear accelerator uptime, daily physics QA clearances, and machine-specific treatment capacities
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Select value={centreFilter} onValueChange={setCentreFilter}>
            <SelectTrigger className="w-[180px] h-9 text-xs">
              <SelectValue placeholder="Filter by Centre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Centres ({machines.length})</SelectItem>
              <SelectItem value="MLCC">MLCC (Lagos)</SelectItem>
              <SelectItem value="MKDC">MKDC (Kano)</SelectItem>
              <SelectItem value="MUDC">MUDC (Abuja)</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 gap-1.5 text-xs">
                <Plus className="size-3.5" />
                Add Machine / Vault
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Register Clinical Vault / Equipment</DialogTitle>
                <DialogDescription>
                  Add a new linear accelerator, CT simulator, or high-dose afterloader into the MedServe scheduling directory.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleRegisterMachine} className="space-y-3.5 py-2">
                <div className="space-y-1">
                  <Label htmlFor="m-name">Equipment Name</Label>
                  <Input
                    id="m-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Elekta Versa HD (Vault 2)"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="m-manu">Manufacturer</Label>
                    <Select
                      value={manufacturer}
                      onValueChange={(val: "Elekta" | "Varian" | "Siemens") => setManufacturer(val)}
                    >
                      <SelectTrigger id="m-manu">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Elekta">Elekta</SelectItem>
                        <SelectItem value="Varian">Varian</SelectItem>
                        <SelectItem value="Siemens">Siemens Healthineers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="m-type">Equipment Type</Label>
                    <Select
                      value={type}
                      onValueChange={(val: "LINAC" | "CT_SIMULATOR" | "BRACHYTHERAPY") => setType(val)}
                    >
                      <SelectTrigger id="m-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LINAC">Linear Accelerator (Linac)</SelectItem>
                        <SelectItem value="CT_SIMULATOR">CT Simulator</SelectItem>
                        <SelectItem value="BRACHYTHERAPY">HDR Brachytherapy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="m-centre">Assigned Centre</Label>
                    <Select
                      value={centreCode}
                      onValueChange={(val: "MLCC" | "MKDC" | "MUDC") => setCentreCode(val)}
                    >
                      <SelectTrigger id="m-centre">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MLCC">MLCC (Lagos)</SelectItem>
                        <SelectItem value="MKDC">MKDC (Kano)</SelectItem>
                        <SelectItem value="MUDC">MUDC (Abuja)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="m-cap">Daily Patient Limit</Label>
                    <Input
                      id="m-cap"
                      type="number"
                      min={5}
                      max={80}
                      value={maxFractions}
                      onChange={(e) => setMaxFractions(Number(e.target.value))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="m-room">Physical Vault Room</Label>
                  <Input
                    id="m-room"
                    value={vaultRoom}
                    onChange={(e) => setVaultRoom(e.target.value)}
                    placeholder="e.g. Bunker Vault 3"
                    required
                  />
                </div>

                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRegisterOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Register Vault</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Machine Vault Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filteredMachines.map((machine) => (
          <Card key={machine.id} className="relative flex flex-col justify-between shadow-xs border-border/80 hover:border-primary/40 transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <Badge
                  variant="outline"
                  className={
                    machine.centreCode === "MLCC"
                      ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/10"
                      : machine.centreCode === "MKDC"
                        ? "border-blue-500/30 text-blue-600 bg-blue-500/10"
                        : "border-purple-500/30 text-purple-600 bg-purple-500/10"
                  }
                >
                  {machine.centreCode}
                </Badge>

                <Badge
                  variant="secondary"
                  className={
                    machine.status === "OPERATIONAL"
                      ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                      : machine.status === "SCHEDULED_MAINTENANCE"
                        ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                        : "bg-red-500/10 text-red-600 border border-red-500/20"
                  }
                >
                  {machine.status === "OPERATIONAL" && (
                    <span className="size-1.5 rounded-full bg-emerald-500 mr-1.5" />
                  )}
                  {machine.status.replace(/_/g, " ")}
                </Badge>
              </div>

              <CardTitle className="text-base font-bold text-foreground mt-2">
                {machine.name}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground line-clamp-1">
                {machine.model} • {machine.manufacturer}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 text-xs pb-4">
              <div className="grid grid-cols-2 gap-2 text-muted-foreground bg-muted/40 p-2.5 rounded-lg border">
                <div>
                  <span className="text-[11px] block font-medium text-foreground">Vault Location</span>
                  <span className="text-[11px] font-mono text-muted-foreground">{machine.vaultRoom}</span>
                </div>
                <div>
                  <span className="text-[11px] block font-medium text-foreground">Uptime Rate</span>
                  <span className="text-emerald-600 font-bold tabular-nums">{machine.uptimePercentage}%</span>
                </div>
                <div>
                  <span className="text-[11px] block font-medium text-foreground">Daily Limit</span>
                  <span className="text-foreground font-semibold tabular-nums">{machine.maxDailyFractions} slots</span>
                </div>
                <div>
                  <span className="text-[11px] block font-medium text-foreground">Commissioned</span>
                  <span className="tabular-nums">{machine.commissionedDate}</span>
                </div>
              </div>

              <div className="rounded-lg border border-border/80 p-2.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-foreground">Morning QA Check</span>
                  <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="size-3" />
                    Passed
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {machine.lastDailyQa} by {machine.qaOfficer}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1.5">
                  Supported Clinical Modalities
                </p>
                <div className="flex flex-wrap gap-1">
                  {machine.modalities.map((mod, i) => (
                    <span
                      key={i}
                      className="inline-block rounded-md bg-secondary/80 px-2 py-0.5 text-[10px] text-secondary-foreground"
                    >
                      {mod}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>

            <div className="p-4 pt-0 border-t mt-auto flex items-center justify-between bg-card/50">
              <span className="text-[11px] text-muted-foreground">
                Linac Beam Vault
              </span>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-xs"
                onClick={() => handleToggleStatus(machine.id)}
              >
                <Wrench className="size-3.5" />
                Change Status
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
