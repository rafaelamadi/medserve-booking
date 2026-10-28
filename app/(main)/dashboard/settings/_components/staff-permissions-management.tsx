"use client";

import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Download,
  Mail,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Shield,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  STAFF_HUB_USERS_DATA,
  type StaffHubUser,
} from "@/data/centre-settings-data";

export function StaffPermissionsManagement() {
  const [staffList, setStaffList] = React.useState<StaffHubUser[]>(STAFF_HUB_USERS_DATA);
  const [centreFilter, setCentreFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [inviteOpen, setInviteOpen] = React.useState(false);

  // Invite form state
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [role, setRole] = React.useState<StaffHubUser["role"]>("RADIATION_ONCOLOGIST");
  const [primaryCentre, setPrimaryCentre] = React.useState<"MLCC" | "MKDC" | "MUDC">("MLCC");

  const filteredStaff = React.useMemo(() => {
    let result = [...staffList];
    if (centreFilter !== "all") {
      result = result.filter((s) => s.primaryCentre === centreFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.phone.includes(q) ||
          s.mfaCode.toLowerCase().includes(q) ||
          s.primaryCentre.toLowerCase().includes(q),
      );
    }
    return result;
  }, [staffList, centreFilter, searchQuery]);

  const handleInviteStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      toast.error("Please fill in staff member name and email address.");
      return;
    }

    const newMfaCode = `MFA-${Math.floor(1000 + Math.random() * 9000)}`;

    const newStaff: StaffHubUser = {
      id: `usr-${Date.now()}`,
      mfaCode: newMfaCode,
      fullName,
      email,
      phone: phone || "+234 800 000 0000",
      role,
      roleLabel: "Clinical Staff Member",
      primaryCentre,
      status: "ACTIVE",
      mfaEnabled: true,
      lastLogin: "Just enrolled",
      licenseNumber: "MDCN-TEMP-01",
    };

    setStaffList((prev) => [newStaff, ...prev]);
    toast.success("Staff Member Enrolled", {
      description: `MFA Code ${newMfaCode} assigned and invitation sent to ${email}.`,
    });
    setInviteOpen(false);
    setFullName("");
    setEmail("");
    setPhone("");
  };

  const handleToggleStatus = (staffId: string) => {
    setStaffList((prev) =>
      prev.map((s) => {
        if (s.id !== staffId) return s;
        const nextStatus = s.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
        toast.info(`Status Updated: ${s.fullName}`, {
          description: `Account has been set to ${nextStatus}.`,
        });
        return { ...s, status: nextStatus };
      }),
    );
  };

  const handleDeleteStaff = (staffId: string, staffName: string) => {
    const staffMember = staffList.find((s) => s.id === staffId);
    setStaffList((prev) => prev.filter((s) => s.id !== staffId));
    toast.error("Staff Member Removed", {
      description: `${staffName} was removed from the directory.`,
      action: staffMember
        ? {
            label: "Undo",
            onClick: () => {
              setStaffList((prev) => [staffMember, ...prev]);
              toast.success(`Restored ${staffName}`);
            },
          }
        : undefined,
    });
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, MFA code, email, number, centre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 text-sm"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <Select value={centreFilter} onValueChange={setCentreFilter}>
            <SelectTrigger className="w-[170px] h-10 text-sm">
              <SelectValue placeholder="All Centres" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Centres ({staffList.length})</SelectItem>
              <SelectItem value="MLCC">MLCC (MedServe LUTH)</SelectItem>
              <SelectItem value="MKDC">MKDC (Kano)</SelectItem>
              <SelectItem value="MUDC">MUDC (Abuja)</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button className="h-10 gap-1.5 text-sm">
                <UserPlus className="size-4" />
                Invite Staff Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Enroll New Staff Member</DialogTitle>
                <DialogDescription className="text-xs">
                  Create staff profile with automated MFA authentication code assignment.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleInviteStaff} className="space-y-3.5 py-2">
                <div className="space-y-1">
                  <Label htmlFor="s-name" className="text-xs">Full Legal Name *</Label>
                  <Input
                    id="s-name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Aminu Bello"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="s-email" className="text-xs">Email Address *</Label>
                    <Input
                      id="s-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="aminu@medserve.ng"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="s-phone" className="text-xs">Phone Number *</Label>
                    <Input
                      id="s-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+234 80..."
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="s-centre" className="text-xs">Assigned Facility Centre</Label>
                  <Select
                    value={primaryCentre}
                    onValueChange={(val: "MLCC" | "MKDC" | "MUDC") => setPrimaryCentre(val)}
                  >
                    <SelectTrigger id="s-centre">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MLCC">MLCC (MedServe LUTH)</SelectItem>
                      <SelectItem value="MKDC">MKDC (Kano)</SelectItem>
                      <SelectItem value="MUDC">MUDC (Abuja)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setInviteOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Generate MFA & Enroll</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Staff Accounts Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[140px] font-semibold text-sm text-foreground py-3.5">
                MFA Code
              </TableHead>
              <TableHead className="font-semibold text-sm text-foreground py-3.5">
                Name
              </TableHead>
              <TableHead className="font-semibold text-sm text-foreground py-3.5">
                Email
              </TableHead>
              <TableHead className="w-[180px] font-semibold text-sm text-foreground py-3.5">
                Number
              </TableHead>
              <TableHead className="w-[120px] font-semibold text-sm text-foreground py-3.5">
                Centre
              </TableHead>
              <TableHead className="w-[120px] font-semibold text-sm text-foreground py-3.5">
                Status
              </TableHead>
              <TableHead className="w-[120px] text-right font-semibold text-sm text-foreground py-3.5">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredStaff.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-sm text-muted-foreground"
                >
                  No staff members match your search.
                </TableCell>
              </TableRow>
            ) : (
              filteredStaff.map((staff) => (
                <TableRow key={staff.id} className="hover:bg-muted/40 transition-colors">
                  {/* 1. MFA Code (plain text, no pill - like patient ref no.) */}
                  <TableCell className="font-mono text-sm font-semibold text-primary py-3.5">
                    {staff.mfaCode}
                  </TableCell>

                  {/* 2. Name (clean text, no box initials) */}
                  <TableCell className="py-3.5 font-medium text-sm text-foreground">
                    {staff.fullName}
                  </TableCell>

                  {/* 3. Email */}
                  <TableCell className="py-3.5 text-sm text-muted-foreground">
                    {staff.email}
                  </TableCell>

                  {/* 4. Number */}
                  <TableCell className="py-3.5 text-sm font-mono text-muted-foreground">
                    {staff.phone}
                  </TableCell>

                  {/* 5. Centre */}
                  <TableCell className="py-3.5">
                    <Badge
                      variant="outline"
                      className={
                        staff.primaryCentre === "MLCC"
                          ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/10 text-xs font-semibold"
                          : staff.primaryCentre === "MKDC"
                            ? "border-blue-500/30 text-blue-600 bg-blue-500/10 text-xs font-semibold"
                            : "border-purple-500/30 text-purple-600 bg-purple-500/10 text-xs font-semibold"
                      }
                    >
                      {staff.primaryCentre}
                    </Badge>
                  </TableCell>

                  {/* 6. Status */}
                  <TableCell className="py-3.5">
                    <Badge
                      variant={staff.status === "ACTIVE" ? "outline" : "secondary"}
                      className={
                        staff.status === "ACTIVE"
                          ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20 text-xs font-semibold"
                          : "text-amber-700 bg-amber-500/10 border-amber-500/20 dark:text-amber-400 text-xs font-semibold"
                      }
                    >
                      {staff.status}
                    </Badge>
                  </TableCell>

                  {/* 7. Action: Dropdown with suspend default & delete option */}
                  <TableCell className="text-right py-3.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 min-w-[96px] justify-between text-xs font-medium border-border/80 bg-background hover:bg-muted"
                        >
                          <span>{staff.status === "ACTIVE" ? "Suspend" : "Activate"}</span>
                          <ChevronDown className="size-3.5 text-muted-foreground ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(staff.id)}
                          className="cursor-pointer text-xs"
                        >
                          {staff.status === "ACTIVE" ? (
                            <>
                              <XCircle className="size-3.5 mr-2 text-amber-600" />
                              <span>Suspend</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="size-3.5 mr-2 text-emerald-600" />
                              <span>Activate</span>
                            </>
                          )}
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={() => handleDeleteStaff(staff.id, staff.fullName)}
                          className="cursor-pointer text-xs text-destructive focus:text-destructive focus:bg-destructive/10"
                        >
                          <Trash2 className="size-3.5 mr-2" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
