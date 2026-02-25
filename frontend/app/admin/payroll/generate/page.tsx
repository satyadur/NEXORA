// app/admin/payroll/generate/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Loader2,
  Search,
  Check,
  ChevronsUpDown,
  Briefcase,
  Mail,
  IndianRupee,
  Calculator,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import {
  generatePayslipApi,
  getAllEmployeesApi,
  Employee,
} from "@/lib/api/admin.api";
import { cn } from "@/lib/utils";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

const singlePayslipSchema = z.object({
  employeeId: z.string().min(1, "Please select an employee"),
  month: z.string().min(1, "Please select a month"),
  year: z.string().min(1, "Please select a year"),
  // Manual salary fields
  basic: z.number().min(0, "Basic salary must be positive"),
  hra: z.number().min(0, "HRA must be positive"),
  da: z.number().min(0, "DA must be positive").optional(),
  ta: z.number().min(0, "TA must be positive").optional(),
  specialAllowance: z.number().min(0).optional(),
  bonus: z.number().min(0).optional(),
  pf: z.number().min(0, "PF must be positive"),
  tax: z.number().min(0, "Tax must be positive"),
  professionalTax: z.number().min(0).optional(),
  loan: z.number().min(0).optional(),
  notes: z.string().optional(),
});

type SinglePayslipForm = z.infer<typeof singlePayslipSchema>;

export default function GeneratePayslipPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [calculatedValues, setCalculatedValues] = useState({
    totalEarnings: 0,
    totalDeductions: 0,
    netSalary: 0,
  });

  const form = useForm<SinglePayslipForm>({
    resolver: zodResolver(singlePayslipSchema),
    defaultValues: {
      month: months[new Date().getMonth()],
      year: currentYear.toString(),
      basic: 0,
      hra: 0,
      da: 0,
      ta: 0,
      specialAllowance: 0,
      bonus: 0,
      pf: 0,
      tax: 0,
      professionalTax: 0,
      loan: 0,
      notes: "",
    },
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Watch form values to calculate totals
  useEffect(() => {
    const subscription = form.watch((value) => {
      const basic = value.basic || 0;
      const hra = value.hra || 0;
      const da = value.da || 0;
      const ta = value.ta || 0;
      const specialAllowance = value.specialAllowance || 0;
      const bonus = value.bonus || 0;
      
      const pf = value.pf || 0;
      const tax = value.tax || 0;
      const professionalTax = value.professionalTax || 0;
      const loan = value.loan || 0;

      const totalEarnings = basic + hra + da + ta + specialAllowance + bonus;
      const totalDeductions = pf + tax + professionalTax + loan;
      const netSalary = totalEarnings - totalDeductions;

      setCalculatedValues({
        totalEarnings,
        totalDeductions,
        netSalary,
      });
    });
    
    return () => subscription.unsubscribe();
  }, [form.watch]);

  const fetchEmployees = async () => {
    try {
      const data = await getAllEmployeesApi();
      setEmployees(data);
    } catch (error) {
      toast.error("Failed to fetch employees");
    }
  };

  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee);
    form.setValue("employeeId", employee._id);
    
    // Auto-populate with employee's existing salary structure if available
    if (employee.employeeRecord?.salary) {
      form.setValue("basic", employee.employeeRecord.salary.basic || 0);
      form.setValue("hra", employee.employeeRecord.salary.hra || 0);
      form.setValue("da", employee.employeeRecord.salary.da || 0);
      form.setValue("ta", employee.employeeRecord.salary.ta || 0);
      form.setValue("pf", employee.employeeRecord.salary.pf || 0);
      form.setValue("tax", employee.employeeRecord.salary.tax || 0);
    }
    
    setSearchOpen(false);
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.employeeRecord?.employeeId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onSubmit = async (data: SinglePayslipForm) => {
    try {
      setLoading(true);

      const payslip = await generatePayslipApi({
        employeeId: data.employeeId,
        month: data.month,
        year: parseInt(data.year),
        earnings: {
          basic: data.basic,
          hra: data.hra,
          da: data.da || 0,
          ta: data.ta || 0,
          specialAllowance: data.specialAllowance || 0,
          bonus: data.bonus || 0,
        },
        deductions: {
          pf: data.pf,
          tax: data.tax,
          professionalTax: data.professionalTax || 0,
          loan: data.loan || 0,
        },
        notes: data.notes,
      });

      toast.success(`Payslip generated for ${selectedEmployee?.name}`);
      setTimeout(() => router.push(`/admin/payroll/${payslip._id}`), 1500);
    } catch (error: any) {
      toast.error(error.message || "Failed to generate payslip");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Generate Payslip</h1>
          <p className="text-muted-foreground mt-2">
            Generate salary payslip for an employee with manual entry
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payslip Details</CardTitle>
          <CardDescription>
            Search and select an employee, then enter salary details manually
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              {/* Employee Search */}
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Select Employee *</FormLabel>
                    <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={searchOpen}
                            className="w-full justify-between h-auto py-3"
                          >
                            {selectedEmployee ? (
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>
                                    {selectedEmployee.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="text-left">
                                  <p className="font-medium">{selectedEmployee.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {selectedEmployee.email} • {selectedEmployee.role}
                                    {selectedEmployee.employeeRecord?.employeeId && (
                                      <> • ID: {selectedEmployee.employeeRecord.employeeId}</>
                                    )}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Search className="h-4 w-4" />
                                <span>Search employee by name, email, or ID...</span>
                              </div>
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[500px] p-0">
                        <Command>
                          <CommandInput
                            placeholder="Search employees..."
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                          />
                          <CommandEmpty>No employees found.</CommandEmpty>
                          <CommandGroup>
                            <ScrollArea className="h-[300px]">
                              {filteredEmployees.map((emp) => (
                                <CommandItem
                                  key={emp._id}
                                  value={emp._id}
                                  onSelect={() => handleEmployeeSelect(emp)}
                                  className="cursor-pointer"
                                >
                                  <div className="flex items-center gap-3 w-full">
                                    <Avatar className="h-8 w-8">
                                      <AvatarFallback>
                                        {emp.name.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between">
                                        <p className="font-medium">{emp.name}</p>
                                      </div>
                                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                          <Mail className="h-3 w-3" />
                                          {emp.email}
                                        </span>
                                        {emp.employeeRecord?.employeeId && (
                                          <span className="flex items-center gap-1">
                                            <Briefcase className="h-3 w-3" />
                                            {emp.employeeRecord.employeeId}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <Check
                                      className={cn(
                                        "h-4 w-4",
                                        field.value === emp._id
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                  </div>
                                </CommandItem>
                              ))}
                            </ScrollArea>
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Month and Year Selection */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="month"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Month *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {months.map((month) => (
                            <SelectItem key={month} value={month}>
                              {month}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {years.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Salary Components */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <IndianRupee className="h-5 w-5" />
                  Earnings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="basic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Basic Salary *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              className="pl-9"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hra"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>HRA *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              className="pl-9"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="da"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dearness Allowance</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              className="pl-9"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ta"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Travel Allowance</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              className="pl-9"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="specialAllowance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Special Allowance</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              className="pl-9"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bonus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bonus</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              className="pl-9"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Deductions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-destructive">
                  <Calculator className="h-5 w-5" />
                  Deductions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="pf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PF *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              className="pl-9"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              className="pl-9"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="professionalTax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Professional Tax</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              className="pl-9"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="loan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loan Deduction</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              className="pl-9"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Add any additional notes..."
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Calculation Summary */}
              <Card className="bg-muted/50">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Total Earnings:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(calculatedValues.totalEarnings)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Deductions:</span>
                    <span className="font-medium text-destructive">
                      - {formatCurrency(calculatedValues.totalDeductions)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Net Salary:</span>
                    <span className="text-primary text-lg">
                      {formatCurrency(calculatedValues.netSalary)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading || !selectedEmployee}
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Generate Payslip
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}