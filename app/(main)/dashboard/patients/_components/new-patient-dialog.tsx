"use client";

import * as React from "react";
import { Loader2, Plus, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import type { RegisteredPatient } from "@/data/patient-registry-data";
import { registerPatientServer } from "@/server/patients";
import { useCentreScope } from "@/shared/context/centre-scope-context";

interface NewPatientDialogProps {
  onCreated: (newPatient: RegisteredPatient) => void;
}

export function NewPatientDialog({ onCreated }: NewPatientDialogProps) {
  const { selectedCentre } = useCentreScope();
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Demographic & Contact Form state
  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [gender, setGender] = React.useState<"Male" | "Female">("Female");
  const [age, setAge] = React.useState(45);
  const [address, setAddress] = React.useState("");
  const [state, setState] = React.useState("Lagos State");
  const [centreCode, setCentreCode] = React.useState<"MLCC" | "MKDC" | "MUDC">("MLCC");

  // Sync default centre with active scoped centre if not 'ALL'
  React.useEffect(() => {
    if (selectedCentre && selectedCentre.code !== "ALL" && (selectedCentre.code === "MLCC" || selectedCentre.code === "MKDC" || selectedCentre.code === "MUDC")) {
      setCentreCode(selectedCentre.code);
    }
  }, [selectedCentre, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !phone.trim()) {
      toast.error("Please fill in patient name and phone number.");
      return;
    }

    try {
      setIsSubmitting(true);

      const centreNameMap: Record<string, string> = {
        MLCC: "MedServe LUTH Cancer Centre (Lagos)",
        MKDC: "MedServe Kano Diagnostic Centre",
        MUDC: "MedServe Umuahia Diagnostic Centre",
      };

      const result = await registerPatientServer({
        fullName,
        phone,
        email: email || undefined,
        gender,
        age,
        address,
        state,
        centreCode,
        centreName: centreNameMap[centreCode] || "MedServe Medical Centre",
      });

      if (!result.success || !result.patient) {
        toast.error("Registration Failed", {
          description: result.error || "Could not save patient to database.",
        });
        return;
      }

      onCreated(result.patient);

      toast.success("Patient Record Registered", {
        description: `${result.patient.fullName} enrolled with MRN: ${result.patient.mrn} (Saved to Supabase).`,
      });

      // Dispatch global sync events across the entire dashboard
      window.dispatchEvent(new CustomEvent("medserve:patient-sync"));
      window.dispatchEvent(new CustomEvent("medserve:appointment-sync"));
      try {
        window.localStorage.setItem("medserve:last-sync", Date.now().toString());
      } catch {
        // ignore storage errors
      }

      // Reset
      setFullName("");
      setPhone("");
      setEmail("");
      setAddress("");
      setAge(45);
      setOpen(false);
    } catch (err) {
      console.error("Error during registration:", err);
      toast.error("Unexpected error occurred while registering patient.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 h-9 text-xs">
          <UserPlus className="size-4" />
          <span>Register New Patient</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <UserPlus className="size-5" />
            <DialogTitle className="text-lg font-bold">
              Register New Patient
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Create a master patient identity record with automatic MRN assignment and real-time Supabase sync.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label className="text-xs">Full Legal Name *</Label>
            <Input
              placeholder="e.g. Fatima Bello"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Phone Number *</Label>
              <Input
                placeholder="+234 803 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Email Address</Label>
              <Input
                type="email"
                placeholder="patient@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Biological Sex</Label>
              <select
                className="h-9 w-full rounded-md border bg-background px-3 text-xs"
                value={gender}
                onChange={(e) => setGender(e.target.value as "Male" | "Female")}
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Age (Years)</Label>
              <Input
                type="number"
                min={1}
                max={120}
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Primary Facility</Label>
              <select
                className="h-9 w-full rounded-md border bg-background px-3 text-xs"
                value={centreCode}
                onChange={(e) => setCentreCode(e.target.value as "MLCC" | "MKDC" | "MUDC")}
              >
                <option value="MLCC">MLCC (Lagos)</option>
                <option value="MKDC">MKDC (Kano)</option>
                <option value="MUDC">MUDC (Umuahia)</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">State of Residence</Label>
              <select
                className="h-9 w-full rounded-md border bg-background px-3 text-xs"
                value={state}
                onChange={(e) => setState(e.target.value)}
              >
                <option value="Lagos State">Lagos State</option>
                <option value="Kano State">Kano State</option>
                <option value="Abia State">Abia State</option>
                <option value="Federal Capital Territory">Federal Capital Territory (Abuja)</option>
                <option value="Oyo State">Oyo State</option>
                <option value="Kaduna State">Kaduna State</option>
                <option value="Rivers State">Rivers State</option>
                <option value="Enugu State">Enugu State</option>
                <option value="Imo State">Imo State</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Residential Address</Label>
            <Input
              placeholder="e.g. 15 Gana Street, Maitama"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Saving to Supabase...
                </>
              ) : (
                "Create Patient Record"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
