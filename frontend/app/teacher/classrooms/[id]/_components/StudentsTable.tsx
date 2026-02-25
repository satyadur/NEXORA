"use client";

import { useQuery } from "@tanstack/react-query";
import { getClassroomStudentsApi } from "@/lib/api/teacher.api";

import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function StudentsTable({
  classroomId,
  performanceData,
}: {
  classroomId: string;
  performanceData: any[];
}) {
  const { data = [] } = useQuery({
    queryKey: ["classroom-students", classroomId],
    queryFn: () => getClassroomStudentsApi(classroomId),
  });

  const [hoveredStudent, setHoveredStudent] =
    useState<any>(null);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const hoveredPerformance = performanceData?.find(
    (p) => p.studentId === hoveredStudent?._id
  );

  return (
    <div className="grid md:grid-cols-3 gap-6">

      {/* ================= TABLE ================= */}
      <div className="md:col-span-2 space-y-4">

        <Input
          placeholder="Search students..."
          value={globalFilter}
          onChange={(e) =>
            setGlobalFilter(e.target.value)
          }
        />

        <Card className="overflow-hidden rounded-xl border shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              {table.getHeaderGroups().map(
                (headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(
                      (header) => (
                        <th
                          key={header.id}
                          className="p-3 text-left font-medium"
                        >
                          {flexRender(
                            header.column.columnDef
                              .header,
                            header.getContext()
                          )}
                        </th>
                      )
                    )}
                  </tr>
                )
              )}
            </thead>

            <tbody>
              {table.getRowModel().rows.map(
                (row) => (
                  <tr
                    key={row.id}
                    onMouseEnter={() =>
                      setHoveredStudent(
                        row.original
                      )
                    }
                    className="border-t hover:bg-muted/40 transition cursor-pointer"
                  >
                    {row
                      .getVisibleCells()
                      .map((cell) => (
                        <td
                          key={cell.id}
                          className="p-3"
                        >
                          {flexRender(
                            cell.column.columnDef
                              .cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                  </tr>
                )
              )}
            </tbody>
          </table>
        </Card>

        {/* ================= PAGINATION ================= */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              table.previousPage()
            }
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>

          <span className="text-sm text-muted-foreground">
            Page{" "}
            {table.getState().pagination.pageIndex +
              1}{" "}
            of {table.getPageCount()}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              table.nextPage()
            }
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      {/* ================= HOVER ANALYTICS PANEL ================= */}
      <Card className="p-6 shadow-xl border rounded-2xl space-y-6">

        {hoveredStudent && hoveredPerformance ? (
          <>
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">
                  {hoveredStudent.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Performance Overview
                </p>
              </div>

              <Badge variant="outline">
                {
                  hoveredPerformance.submissionRate
                }
                %
              </Badge>
            </div>

            {/* Donut Chart */}
            <div className="h-[220px]">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: "Submitted",
                        value:
                          hoveredPerformance.submittedAssignments,
                      },
                      {
                        name: "Pending",
                        value:
                          hoveredPerformance.unsubmittedAssignments,
                      },
                    ]}
                    dataKey="value"
                    innerRadius={60}
                    outerRadius={90}
                  >
                    <Cell fill="var(--color-chart-1)" />
                    <Cell fill="var(--color-chart-4)" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Metrics */}
            <div className="space-y-3 text-sm">

              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Submitted
                </span>
                <span className="font-semibold">
                  {
                    hoveredPerformance.submittedAssignments
                  }
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Pending
                </span>
                <span className="font-semibold">
                  {
                    hoveredPerformance.unsubmittedAssignments
                  }
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Average Score
                </span>
                <span className="font-bold text-primary">
                  {
                    hoveredPerformance.averageScore
                  }
                </span>
              </div>

            </div>
          </>
        ) : (
          <div className="text-muted-foreground text-center py-20">
            Hover a student to see analytics
          </div>
        )}
      </Card>
    </div>
  );
}
