import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, UserCheck, UserX, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import type { UserRole } from "@/types";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "suspended";
  joined: string;
}

const mockUsers: AdminUser[] = [
  { id: "1", name: "Mariam Khaled", email: "mariam@example.com", role: "pet_owner", status: "active", joined: "Dec 2024" },
  { id: "2", name: "Dr. Ahmed Hassan", email: "ahmed@example.com", role: "veterinarian", status: "active", joined: "Nov 2024" },
  { id: "3", name: "Youssef Said", email: "youssef@example.com", role: "pet_owner", status: "active", joined: "Oct 2024" },
  { id: "4", name: "Sara El-Masry", email: "sara@example.com", role: "veterinarian", status: "active", joined: "Sep 2024" },
  { id: "5", name: "Mohamed Ali", email: "mohamed@example.com", role: "shop_owner", status: "active", joined: "Aug 2024" },
  { id: "6", name: "Nadia Raouf", email: "nadia@example.com", role: "pet_owner", status: "suspended", joined: "Jul 2024" },
  { id: "7", name: "Omar Farouk", email: "omar@example.com", role: "shop_owner", status: "active", joined: "Jun 2024" },
];

const roleBadge: Record<UserRole, string> = {
  pet_owner: "bg-primary/10 text-primary border-primary/20",
  veterinarian: "bg-secondary/10 text-secondary border-secondary/20",
  shop_owner: "bg-accent/10 text-accent-foreground border-accent/20",
  admin: "bg-info/10 text-info border-info/20",
};

const AdminUsers = () => {
  const [users, setUsers] = useState(mockUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const filtered = users.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const toggleStatus = (id: string) => {
    setUsers(users.map((u) => u.id === id ? { ...u, status: u.status === "active" ? "suspended" as const : "active" as const } : u));
    toast.success("User status updated");
  };

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">Manage Users</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search users…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="pet_owner">Pet Owners</SelectItem>
            <SelectItem value="veterinarian">Veterinarians</SelectItem>
            <SelectItem value="shop_owner">Shop Owners</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`capitalize text-xs ${roleBadge[u.role]}`}>
                      {u.role.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={u.status === "active" ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"}>
                      {u.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.joined}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toggleStatus(u.id)}>
                          {u.status === "active" ? <><UserX className="mr-2 h-4 w-4" /> Suspend</> : <><UserCheck className="mr-2 h-4 w-4" /> Activate</>}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;
