"use client";

import * as React from "react";
import {
  Building2,
  CheckCircle2,
  Clock,
  Edit,
  Mail,
  MapPin,
  Phone,
  Plus,
  ShieldCheck,
  Stethoscope,
  Users,
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
  CANCER_CENTRES_DATA,
  type CancerCentreDetail,
} from "@/data/centre-settings-data";

export function CentresManagement() {
  const [centres, setCentres] = React.useState<CancerCentreDetail[]>(CANCER_CENTRES_DATA);
  const [editingCentre, setEditingCentre] = React.useState<CancerCentreDetail | null>(null);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);

  // Edit form state
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [dailyCapacity, setDailyCapacity] = React.useState(50);

  const openEdit = (centre: CancerCentreDetail) => {
    setEditingCentre(centre);
    setPhone(centre.phone);
    setEmail(centre.email);
    setAddress(centre.address);
    setDailyCapacity(centre.dailyCapacity);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCentre) return;

    setCentres((prev) =>
      prev.map((c) =>
        c.id === editingCentre.id
          ? {
              ...c,
              phone,
              email,
              address,
              dailyCapacity,
            }
          : c,
      ),
    );

    toast.success("Centre Details Updated", {
      description: `${editingCentre.name} operational parameters updated successfully.`,
    });
    setEditDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Cancer Treatment Centres
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage multi-centre facility addresses, contact channels, clinical leads, and active radiation vaults across Nigeria
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {centres.map((centre) => (
          <Card key={centre.id} className="relative flex flex-col justify-between shadow-xs border-border/80 hover:border-primary/40 transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <Badge
                  variant="outline"
                  className={
                    centre.code === "MLCC"
                      ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/10 font-semibold"
                      : centre.code === "MKDC"
                        ? "border-blue-500/30 text-blue-600 bg-blue-500/10 font-semibold"
                        : "border-purple-500/30 text-purple-600 bg-purple-500/10 font-semibold"
                  }
                >
                  {centre.code} • {centre.city}
                </Badge>

                <Badge variant="secondary" className="text-xs font-normal">
                  {centre.status === "ACTIVE" ? (
                    <span className="flex items-center gap-1.5 text-emerald-600">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active Hub
                    </span>
                  ) : (
                    centre.status
                  )}
                </Badge>
              </div>

              <CardTitle className="text-base font-bold text-foreground mt-2">
                {centre.name}
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed text-muted-foreground">
                {centre.fullName}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 text-xs pb-4">
              <div className="space-y-2 text-muted-foreground">
                <div className="flex items-start gap-2">
                  <MapPin className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{centre.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="size-3.5 text-muted-foreground shrink-0" />
                  <span>{centre.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="size-3.5 text-muted-foreground shrink-0" />
                  <span>{centre.email}</span>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/30 p-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[11px] font-medium text-foreground">Director:</span>
                  <span className="font-medium text-foreground">{centre.medicalDirector}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[11px] font-medium text-foreground">Physicist / RSO:</span>
                  <span>{centre.leadPhysicist}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[11px] font-medium text-foreground">Hours (Weekdays):</span>
                  <span>{centre.operatingHours.weekdays}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-[11px] font-medium text-foreground">Daily Capacity:</span>
                  <span className="font-semibold text-primary">{centre.dailyCapacity} patients/day</span>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1.5">
                  Treatment Suites & Vaults ({centre.rooms.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {centre.rooms.map((room, i) => (
                    <span
                      key={i}
                      className="inline-block rounded-md bg-secondary/80 px-2 py-0.5 text-[10px] text-secondary-foreground font-mono"
                    >
                      {room}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>

            <div className="p-4 pt-0 border-t mt-auto flex items-center justify-between bg-card/50">
              <span className="text-[11px] text-muted-foreground">
                {centre.activeVaultsCount} Active Radiation Vaults
              </span>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-xs"
                onClick={() => openEdit(centre)}
              >
                <Edit className="size-3.5" />
                Configure
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit Centre Modal */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Centre: {editingCentre?.name}</DialogTitle>
            <DialogDescription>
              Update contact numbers, facility address, and daily appointment quotas for {editingCentre?.city} centre.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="c-phone">Contact Phone</Label>
              <Input
                id="c-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 ..."
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="c-email">Official Operations Email</Label>
              <Input
                id="c-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="centre@medserve.ng"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="c-addr">Physical Facility Address</Label>
              <Input
                id="c-addr"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="c-cap">Daily Throughput Quota (Patients / Day)</Label>
              <Input
                id="c-cap"
                type="number"
                min={10}
                max={150}
                value={dailyCapacity}
                onChange={(e) => setDailyCapacity(Number(e.target.value))}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Controls appointment booking caps across linear accelerators and consultation suites.
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
