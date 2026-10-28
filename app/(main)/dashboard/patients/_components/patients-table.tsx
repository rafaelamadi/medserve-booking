"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { type PaginationState } from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { RegisteredPatient } from "@/data/patient-registry-data";

interface PatientsTableProps {
  data: RegisteredPatient[];
  onDataChange?: (updater: (prev: RegisteredPatient[]) => RegisteredPatient[]) => void;
}

export function PatientsTable({ data }: PatientsTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Client filtering: by name, MRN, phone, email, state
  const filteredData = React.useMemo(() => {
    let result = [...data];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.fullName.toLowerCase().includes(q) ||
          p.mrn.toLowerCase().includes(q) ||
          p.phone.includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.state.toLowerCase().includes(q),
      );
    }

    // Default newest first
    result.sort((a, b) => b.registrationDate.localeCompare(a.registrationDate));

    return result;
  }, [data, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / pagination.pageSize);
  const paginatedData = React.useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize;
    return filteredData.slice(start, start + pagination.pageSize);
  }, [filteredData, pagination]);

  const handleRowClick = (patientId: string) => {
    router.push(`/dashboard/patients/${patientId}`);
  };

  const handleExportCSV = () => {
    const headers = [
      "MRN",
      "Full Name",
      "Gender",
      "Age",
      "Phone",
      "Email",
      "Location",
      "Registration Date",
    ];

    const rows = filteredData.map((p) => [
      `"${p.mrn}"`,
      `"${p.fullName}"`,
      `"${p.gender}"`,
      p.age,
      `"${p.phone}"`,
      `"${p.email}"`,
      `"${p.state}"`,
      `"${p.registrationDate}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `medserve-patient-registry-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("CSV Export Generated", {
      description: `Exported ${filteredData.length} patient records.`,
    });
  };

  return (
    <div className="space-y-4">
      {/* Search and Action Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, patient ref number (MRN), phone, email, location..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
            className="pl-10 h-10 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-10 gap-1.5 text-sm text-muted-foreground"
            onClick={handleExportCSV}
          >
            <Download className="size-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Main Clean Patients Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[140px] font-semibold text-sm text-foreground py-3.5">
                Patient Ref
              </TableHead>
              <TableHead className="font-semibold text-sm text-foreground py-3.5">
                Patient Name
              </TableHead>
              <TableHead className="w-[130px] font-semibold text-sm text-foreground py-3.5">
                Gender & Age
              </TableHead>
              <TableHead className="w-[180px] font-semibold text-sm text-foreground py-3.5">
                Phone Number
              </TableHead>
              <TableHead className="font-semibold text-sm text-foreground py-3.5">
                Email
              </TableHead>
              <TableHead className="w-[160px] font-semibold text-sm text-foreground py-3.5">
                Location
              </TableHead>
              <TableHead className="w-[130px] font-semibold text-sm text-foreground py-3.5">
                Registered
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-sm text-muted-foreground"
                >
                  No registered patients match your search.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((patient) => (
                <TableRow
                  key={patient.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors group"
                  onClick={() => handleRowClick(patient.id)}
                >
                  {/* 1. Patient Ref Number (plain text, no pill) */}
                  <TableCell className="font-mono text-sm font-semibold text-primary py-3.5">
                    {patient.mrn}
                  </TableCell>

                  {/* 2. Patient Name (clean text, no box initials) */}
                  <TableCell className="py-3.5">
                    <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                      {patient.fullName}
                    </span>
                  </TableCell>

                  {/* 3. Gender & Age */}
                  <TableCell className="text-sm text-muted-foreground py-3.5">
                    {patient.gender}, {patient.age}y
                  </TableCell>

                  {/* 4. Phone Number (own column) */}
                  <TableCell className="text-sm font-mono text-foreground py-3.5">
                    {patient.phone}
                  </TableCell>

                  {/* 5. Email (own column) */}
                  <TableCell className="text-sm text-muted-foreground py-3.5">
                    {patient.email}
                  </TableCell>

                  {/* 6. Location (own column) */}
                  <TableCell className="text-sm text-muted-foreground py-3.5">
                    {patient.state}
                  </TableCell>

                  {/* 7. Date Registered */}
                  <TableCell className="text-sm font-mono text-muted-foreground py-3.5">
                    {patient.registrationDate}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground pt-1">
        <div>
          Showing{" "}
          <span className="font-medium text-foreground">
            {filteredData.length === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1}
          </span>{" "}
          to{" "}
          <span className="font-medium text-foreground">
            {Math.min((pagination.pageIndex + 1) * pagination.pageSize, filteredData.length)}
          </span>{" "}
          of{" "}
          <span className="font-medium text-foreground">{filteredData.length}</span> registered
          patients
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="size-9"
            disabled={pagination.pageIndex === 0}
            onClick={() => setPagination((p) => ({ ...p, pageIndex: p.pageIndex - 1 }))}
          >
            <ChevronLeft className="size-4" />
          </Button>

          <span className="px-2 font-medium">
            Page {pagination.pageIndex + 1} of {Math.max(1, totalPages)}
          </span>

          <Button
            variant="outline"
            size="icon"
            className="size-9"
            disabled={pagination.pageIndex >= totalPages - 1}
            onClick={() => setPagination((p) => ({ ...p, pageIndex: p.pageIndex + 1 }))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
