"use client";

import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Download,
  Loader2,
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
import {
  getLiveStaffUsers,
  enrollStaffMemberServer,
  toggleStaffStatusServer,
  resendStaffInviteServer,
} from "@/server/staff";
import { useCentreScope } from "@/shared/context/centre-scope-context";

interface StaffPermissionsManagementProps {
  staffList?: StaffHubUser[];
  setStaffList?: React.Dispatch<React.SetStateAction<StaffHubUser[]>>;
}

export function StaffPermissionsManagement({
  staffList: propStaffList,
  setStaffList: propSetStaffList,
}: StaffPermissionsManagementProps) {
  const { selectedCentre, isAllCentres } = useCentreScope();

  const [localStaffList, setLocalStaffList] = React.useState<StaffHubUser[]>(STAFF_HUB_USERS_DATA);
  const staffList = propStaffList ?? localStaffList;
  const setStaffList = propSetStaffList ?? setLocalStaffList;

  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [resendingStaffId, setResendingStaffId] = React.useState<string | null>(null);

  const [searchQuery, setSearchQuery] = React.useState("");
  const [inviteOpen, setInviteOpen] = React.useState(false);

  // Invite form state
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [role, setRole] = React.useState<StaffHubUser["role"]>("CLINICIAN");
  const [primaryCentre, setPrimaryCentre] = React.useState<"MLCC" | "MKDC" | "MUDC">("MLCC");

  // Sync primaryCentre with the active facility when opening the invite dialog
  React.useEffect(() => {
    if (inviteOpen) {
      if (!isAllCentres && (selectedCentre.code === "MKDC" || selectedCentre.code === "MUDC" || selectedCentre.code === "MLCC")) {
        setPrimaryCentre(selectedCentre.code as "MLCC" | "MKDC" | "MUDC");
      }
    }
  }, [inviteOpen, isAllCentres, selectedCentre.code]);

  // Load live staff on mount if not controlled externally
  React.useEffect(() => {
    let isMounted = true;
    async function loadStaff() {
      setIsLoading(true);
      try {
        const live = await getLiveStaffUsers();
        if (isMounted && live && live.length > 0) {
          setStaffList(live);
        }
      } catch (err) {
        console.error("Failed to load staff list:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadStaff();
    return () => {
      isMounted = false;
    };
  }, [setStaffList]);

  const filteredStaff = React.useMemo(() => {
    let result = [...staffList];
    if (!isAllCentres && selectedCentre.code) {
      result = result.filter((s) => s.primaryCentre === selectedCentre.code);
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
  }, [staffList, isAllCentres, selectedCentre.code, searchQuery]);

  const handleInviteStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail) {
      toast.error("Please fill in staff member name and email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await enrollStaffMemberServer({
        fullName: trimmedName,
        email: trimmedEmail,
        phone: phone.trim() || "+234 800 000 0000",
        role,
        primaryCentre,
      });

      if (res.success && res.staff) {
        const enrolled = res.staff;
        // Immediately update table
        setStaffList((prev) => [enrolled, ...prev.filter((s) => s.id !== enrolled.id && s.email.toLowerCase() !== enrolled.email.toLowerCase())]);

        toast.success("Staff Member Enrolled", {
          description: `Assigned MFA Code ${enrolled.mfaCode}. Onboarding invitation email sent to ${enrolled.email}.`,
        });

        setInviteOpen(false);
        setFullName("");
        setEmail("");
        setPhone("");
      } else {
        toast.error("Enrollment Failed", {
          description: res.error || "Unable to save staff member to database.",
        });
      }
    } catch (err) {
      console.error("Enrollment error:", err);
      toast.error("Enrollment Failed", {
        description: "An unexpected error occurred while saving the staff member.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (staffId: string) => {
    const staffMember = staffList.find((s) => s.id === staffId);
    if (!staffMember) return;

    const targetStatus = staffMember.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

    // Optimistic UI update
    setStaffList((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, status: targetStatus } : s))
    );

    try {
      const res = await toggleStaffStatusServer(staffId, targetStatus);
      if (res.success) {
        toast.info(`Status Updated: ${staffMember.fullName}`, {
          description: `Account has been set to ${targetStatus}.`,
        });
      } else {
        // Revert on failure
        setStaffList((prev) =>
          prev.map((s) => (s.id === staffId ? { ...s, status: staffMember.status } : s))
        );
        toast.error("Status Update Failed", {
          description: res.error || "Could not update status in database.",
        });
      }
    } catch (err) {
      console.error("Toggle status error:", err);
      // Revert on failure
      setStaffList((prev) =>
        prev.map((s) => (s.id === staffId ? { ...s, status: staffMember.status } : s))
      );
      toast.error("Status Update Failed", {
        description: "Network error updating staff account.",
      });
    }
  };

  const handleResendInvite = async (staffMember: StaffHubUser) => {
    setResendingStaffId(staffMember.id);
    try {
      const res = await resendStaffInviteServer(staffMember);
      if (res.success) {
        toast.success("Invitation Resent", {
          description: `Onboarding email with MFA code ${staffMember.mfaCode} resent to ${staffMember.email}.`,
        });
      } else {
        toast.error("Failed to Resend Invite", {
          description: res.error || "Could not deliver onboarding email.",
        });
      }
    } catch (err) {
      console.error("Resend invite error:", err);
      toast.error("Failed to Resend Invite", {
        description: "A network error occurred while attempting to send the email.",
      });
    } finally {
      setResendingStaffId(null);
    }
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
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button className="h-10 gap-1.5 text-sm">
                <UserPlus className="size-4" />
                Invite Staff Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg p-6">
              <DialogHeader className="space-y-1.5 pb-1">
                <DialogTitle className="text-lg font-semibold tracking-tight">
                  Enroll New Staff Member
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Create staff profile with Supabase persistence and automated MFA onboarding email dispatch.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleInviteStaff} className="space-y-4 pt-2">
                {/* Full Legal Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="s-name" className="text-xs font-medium text-foreground">
                    Full Legal Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="s-name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Bello Ibrahim"
                    className="h-10 text-sm w-full"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {/* Email Address & Phone Number - 2 Columns with generous gaps */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <Label htmlFor="s-email" className="text-xs font-medium text-foreground">
                      Email Address <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="s-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="bello@medserve.ng"
                      className="h-10 text-sm w-full"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <Label htmlFor="s-phone" className="text-xs font-medium text-foreground">
                      Phone Number
                    </Label>
                    <Input
                      id="s-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+234 803 000 0000"
                      className="h-10 text-sm w-full"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Assigned Facility Centre & Role Permission - 2 Columns with no overlap */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <Label htmlFor="s-centre" className="text-xs font-medium text-foreground truncate block">
                      Assigned Facility Centre
                    </Label>
                    <Select
                      value={primaryCentre}
                      onValueChange={(val: "MLCC" | "MKDC" | "MUDC") => setPrimaryCentre(val)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="s-centre" className="h-10 text-sm w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MLCC">MLCC (MedServe LUTH)</SelectItem>
                        <SelectItem value="MKDC">MKDC (Kano)</SelectItem>
                        <SelectItem value="MUDC">MUDC (Umuahia)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <Label htmlFor="s-role" className="text-xs font-medium text-foreground truncate block">
                      Role Permission
                    </Label>
                    <Select
                      value={role}
                      onValueChange={(val: StaffHubUser["role"]) => setRole(val)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="s-role" className="h-10 text-sm w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CLINICIAN">Clinician</SelectItem>
                        <SelectItem value="CENTRE_MANAGER">Centre Manager</SelectItem>
                        <SelectItem value="STAFF">Clinical & Facility Staff</SelectItem>
                        <SelectItem value="SUPER_ADMIN">System Admin</SelectItem>
                        <SelectItem value="VIEWER">Read-Only Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter className="pt-3 gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setInviteOpen(false)}
                    disabled={isSubmitting}
                    className="h-10 text-xs font-medium"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-10 text-xs font-medium min-w-[170px]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin mr-1.5" />
                        Saving & Sending...
                      </>
                    ) : (
                      "Generate MFA & Enroll"
                    )}
                  </Button>
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
              <TableHead className="w-[130px] text-right font-semibold text-sm text-foreground py-3.5">
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
                  {searchQuery.trim()
                    ? "No staff members match your search."
                    : isAllCentres
                      ? "No staff accounts registered yet."
                      : `No staff accounts registered for ${selectedCentre.code}.`}
                </TableCell>
              </TableRow>
            ) : (
              filteredStaff.map((staff) => (
                <TableRow key={staff.id} className="hover:bg-muted/40 transition-colors">
                  {/* 1. MFA Code */}
                  <TableCell className="font-mono text-sm font-semibold text-primary py-3.5">
                    {staff.mfaCode}
                  </TableCell>

                  {/* 2. Name */}
                  <TableCell className="py-3.5 font-medium text-sm text-foreground">
                    <div>{staff.fullName}</div>
                    <div className="text-[11px] text-muted-foreground font-normal">{staff.roleLabel}</div>
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

                  {/* 6. Status (Emerald for ACTIVE, Amber for PENDING, Rose for SUSPENDED) */}
                  <TableCell className="py-3.5">
                    {staff.status === "ACTIVE" ? (
                      <Badge
                        variant="outline"
                        className="text-emerald-700 bg-emerald-500/10 border-emerald-500/25 dark:text-emerald-400 text-xs font-semibold"
                      >
                        ACTIVE
                      </Badge>
                    ) : staff.status === "PENDING" || staff.status === "INVITED" ? (
                      <Badge
                        variant="outline"
                        className="text-amber-700 bg-amber-500/10 border-amber-500/25 dark:text-amber-400 text-xs font-semibold"
                      >
                        PENDING
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-rose-700 bg-rose-500/10 border-rose-500/25 dark:text-rose-400 text-xs font-semibold"
                      >
                        SUSPENDED
                      </Badge>
                    )}
                  </TableCell>

                  {/* 7. Action: Dropdown with Resend Invite, Suspend/Activate, and Delete */}
                  <TableCell className="text-right py-3.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 min-w-[102px] justify-between text-xs font-medium border-border/80 bg-background hover:bg-muted"
                        >
                          <span>
                            {staff.status === "ACTIVE"
                              ? "Suspend"
                              : staff.status === "SUSPENDED"
                                ? "Activate"
                                : "Pending"}
                          </span>
                          <ChevronDown className="size-3.5 text-muted-foreground ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        {(staff.status === "PENDING" || staff.status === "INVITED") && (
                          <DropdownMenuItem
                            onClick={() => handleResendInvite(staff)}
                            disabled={resendingStaffId === staff.id}
                            className="cursor-pointer text-xs"
                          >
                            {resendingStaffId === staff.id ? (
                              <Loader2 className="size-3.5 mr-2 animate-spin text-primary" />
                            ) : (
                              <Mail className="size-3.5 mr-2 text-primary" />
                            )}
                            <span>Resend Invite</span>
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(staff.id)}
                          className="cursor-pointer text-xs"
                        >
                          {staff.status === "ACTIVE" ? (
                            <>
                              <XCircle className="size-3.5 mr-2 text-rose-600" />
                              <span>Suspend Account</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="size-3.5 mr-2 text-emerald-600" />
                              <span>Activate Account</span>
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
