"use client";

import * as React from "react";
import { Plus, UserPlus } from "lucide-react";
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

interface NewPatientDialogProps {
  onCreated: (newPatient: RegisteredPatient) => void;
}

export function NewPatientDialog({ onCreated }: NewPatientDialogProps) {
  const [open, setOpen] = React.useState(false);

  // Demographic & Contact Form state
  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [gender, setGender] = React.useState<"Male" | "Female">("Female");
  const [age, setAge] = React.useState(45);
  const [address, setAddress] = React.useState("");
  const [state, setState] = React.useState("Lagos State");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !phone.trim()) {
      toast.error("Please fill in patient name and phone number.");
      return;
    }

    const newId = `pat-${Date.now().toString().slice(-4)}`;
    const newMrn = `MRN-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPatient: RegisteredPatient = {
      id: newId,
      mrn: newMrn,
      fullName,
      gender,
      age,
      phone,
      email: email || `${fullName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
      address: address || "Residential Address",
      state,
      centreCode: "MLCC",
      centreName: "MedServe LUTH Cancer Centre",
      primaryDiagnosis: "General Clinical Record",
      primaryService: "Outpatient Care",
      doctorInCharge: "Attending Oncologist",
      status: "ACTIVE",
      registrationDate: new Date().toISOString().split("T")[0],
      totalVisits: 0,
      completedVisits: 0,
      remainingVisits: 0,
      visits: [],
      commLogs: [
        {
          id: `cl-${Date.now()}`,
          timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
          // SMS logic commented out for Resend email transition
          // channel: "SMS",
          // recipient: phone,
          channel: "EMAIL",
          type: "CHECK_IN_CONFIRM",
          recipient: email || `${fullName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
          status: "DELIVERED",
          messageSnippet: `Welcome to MedServe, ${fullName}. Your Patient Record Number is ${newMrn}.`,
        },
      ],
    };

    onCreated(newPatient);

    toast.success("Patient Record Registered", {
      description: `${fullName} has been enrolled with MRN: ${newMrn}.`,
    });

    // Reset
    setFullName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setAge(45);
    setOpen(false);
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
            Create a master patient identity record with automatic MRN assignment and contact details.
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

          <div className="space-y-1">
            <Label className="text-xs">Residential Address</Label>
            <Input
              placeholder="e.g. 15 Gana Street, Maitama"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
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
              <option value="Federal Capital Territory">Federal Capital Territory (Abuja)</option>
              <option value="Oyo State">Oyo State</option>
              <option value="Kaduna State">Kaduna State</option>
              <option value="Rivers State">Rivers State</option>
              <option value="Enugu State">Enugu State</option>
            </select>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create Patient Record</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
