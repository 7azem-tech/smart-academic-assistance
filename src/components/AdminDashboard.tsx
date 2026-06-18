import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    Users, BookOpen, Bell, Shield, Plus, Trash2,
    Search, Key, Mail, UserPlus, FileText, CheckCircle,
    AlertCircle, Megaphone, BarChart3, Lock,
    GraduationCap, Ban, RefreshCw, MoreVertical, Edit,
    Download, Filter, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, XCircle, Bot
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ScrollArea } from "./ui/scroll-area";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "./ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { adminService, Subject, AdminUser, Announcement } from "../services/adminService";
import { toast } from "sonner";
import { SmartAssistantTab } from "./SmartAssistantTab";

export function AdminDashboard() {
    const [activeTab, setActiveTab] = useState("overview");
    const [isLoading, setIsLoading] = useState(true);

    // Data States
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);

    useEffect(() => {
        const loadData = () => {
            setUsers(adminService.getUsers());
            setSubjects(adminService.getSubjects());
            setAnnouncements(adminService.getAnnouncements());
            setIsLoading(false);
        };
        setTimeout(loadData, 300);
    }, []);

    const renderTabContent = () => {
        switch (activeTab) {
            case "overview":
                return <OverviewTab users={users} subjects={subjects} announcements={announcements} setActiveTab={setActiveTab} />;
            case "users":
                return <UserManagementTab users={users} setUsers={setUsers} />;
            case "subjects":
                return <SubjectManagementTab subjects={subjects} setSubjects={setSubjects} />;
            case "announcements":
                return <AnnouncementManagementTab announcements={announcements} setAnnouncements={setAnnouncements} />;
            case "assistant":
                return <SmartAssistantTab />;
            default:
                return null;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[600px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-1">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Admin Portal</h1>
                    <p className="text-gray-500">Enterprise System Management</p>
                </div>
                <div className="flex bg-gray-100/80 p-1 rounded-lg backdrop-blur-sm self-start">
                    {[
                        { id: "overview", label: "Overview", icon: BarChart3 },
                        { id: "users", label: "Users", icon: Users },
                        { id: "subjects", label: "Subjects", icon: BookOpen },
                        { id: "announcements", label: "Announcements", icon: Megaphone },
                        { id: "assistant", label: "Smart Assistant", icon: Bot },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                              relative px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2
                              ${activeTab === tab.id ? "text-primary-foreground shadow-sm" : "text-gray-600 hover:bg-white/60"}
                            `}
                        >
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="active-pill"
                                    className="absolute inset-0 bg-primary rounded-md shadow-sm"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                                <tab.icon className="w-4 h-4" />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </span>
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="relative z-0"
                >
                    {renderTabContent()}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

// ------------------------------------------------------------------
// OVERVIEW TAB
// ------------------------------------------------------------------
function OverviewTab({ users, subjects, announcements, setActiveTab }: any) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard title="Total Users" value={users.length} icon={Users} color="bg-blue-500" trend="+5%" />
            <StatsCard title="Active Subjects" value={subjects.length} icon={BookOpen} color="bg-purple-500" trend="Stable" />
            <StatsCard title="Announcements" value={announcements.length} icon={Megaphone} color="bg-amber-500" trend="New" />

            <Card className="md:col-span-2 border-none shadow-md">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Recent Activity</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => setActiveTab('announcements')}>View All</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {announcements.slice(0, 3).map((ann: Announcement, i: number) => (
                            <motion.div
                                key={ann.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-sm transition-all"
                            >
                                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                                    <Bell className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">{ann.title}</h4>
                                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ann.content}</p>
                                    <span className="text-xs text-gray-400 mt-2 block">{ann.date} • {ann.author}</span>
                                </div>
                            </motion.div>
                        ))}
                        {announcements.length === 0 && <p className="text-gray-500 text-sm">No recent announcements.</p>}
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-md">
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('users')}>
                        <UserPlus className="w-4 h-4 mr-2" /> Add New User
                    </Button>
                    <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('subjects')}>
                        <Plus className="w-4 h-4 mr-2" /> Add Subject
                    </Button>
                    <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('announcements')}>
                        <Megaphone className="w-4 h-4 mr-2" /> Post Announcement
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

// ------------------------------------------------------------------
// USER MANAGEMENT TAB
// ------------------------------------------------------------------
function UserManagementTab({ users, setUsers }: { users: AdminUser[], setUsers: (u: AdminUser[]) => void }) {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const ITEMS_PER_PAGE = 8;

    const [sortConfig, setSortConfig] = useState<{ key: keyof AdminUser; direction: 'asc' | 'desc' } | null>(null);

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.universityId && u.universityId.includes(search)) ||
        u.firstName.toLowerCase().includes(search.toLowerCase()) ||
        u.lastName.toLowerCase().includes(search.toLowerCase())
    );

    const sortedUsers = [...filteredUsers].sort((a, b) => {
        if (!sortConfig) return 0;
        const aValue = a[sortConfig.key] || "";
        const bValue = b[sortConfig.key] || "";
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const totalPages = Math.ceil(sortedUsers.length / ITEMS_PER_PAGE);
    const paginatedUsers = sortedUsers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    const requestSort = (key: keyof AdminUser) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
            adminService.deleteUser(id);
            setUsers(adminService.getUsers());
            toast.success("User deleted successfully");
        }
    };

    const handleToggleStatus = (id: string) => {
        adminService.toggleUserStatus(id);
        setUsers(adminService.getUsers());
        toast.info("User status updated");
    };

    const handleSave = () => {
        setUsers(adminService.getUsers());
        setShowForm(false);
        setEditingUser(null);
    };

    const handleCreateClick = () => {
        setEditingUser(null);
        setShowForm(true);
    };

    const handleEditClick = (user: AdminUser) => {
        setEditingUser(user);
        setShowForm(true);
        // Scroll to top to see form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
                <motion.div
                    initial={{ width: 300 }}
                    animate={{ width: isSearchFocused ? 350 : 300, boxShadow: isSearchFocused ? "0 0 0 2px rgba(59, 130, 246, 0.5)" : "none" }}
                    transition={{ duration: 0.3 }}
                    className="relative max-w-sm rounded-md transition-all"
                >
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <Input
                        placeholder="Search users..."
                        value={search}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 transition-all border-gray-200 focus:border-blue-500"
                    />
                </motion.div>

                <AnimatePresence>
                    {!showForm && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Button
                                onClick={handleCreateClick}
                                className="!bg-black !text-white hover:!bg-neutral-800 border-2 border-transparent hover:border-gray-800 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-full px-6 py-2 font-medium tracking-wide flex items-center gap-2 relative z-50 pointer-events-auto"
                            >
                                <UserPlus className="w-5 h-5" />
                                <span>Add New User</span>
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <UserForm
                            user={editingUser}
                            onSave={handleSave}
                            onCancel={() => { setShowForm(false); setEditingUser(null); }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <Card className="border-none shadow-md overflow-hidden">
                <div className="rounded-md border">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow>
                                <TableHead className="cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSort('firstName')}>
                                    <div className="flex items-center gap-1">
                                        User
                                        {sortConfig?.key === 'firstName' && (
                                            <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
                                                {sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                            </motion.div>
                                        )}
                                    </div>
                                </TableHead>
                                <TableHead className="w-[150px] cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSort('universityId')}>
                                    <div className="flex items-center gap-1">
                                        University ID
                                        {sortConfig?.key === 'universityId' && (
                                            <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
                                                {sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                            </motion.div>
                                        )}
                                    </div>
                                </TableHead>
                                <TableHead className="cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSort('username')}>
                                    <div className="flex items-center gap-1">
                                        Username
                                        {sortConfig?.key === 'username' && (
                                            <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
                                                {sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                            </motion.div>
                                        )}
                                    </div>
                                </TableHead>
                                <TableHead className="cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSort('phoneNumber')}>
                                    <div className="flex items-center gap-1">
                                        Phone
                                        {sortConfig?.key === 'phoneNumber' && (
                                            <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
                                                {sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                            </motion.div>
                                        )}
                                    </div>
                                </TableHead>
                                <TableHead className="cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSort('role')}>
                                    <div className="flex items-center gap-1">
                                        Role
                                        {sortConfig?.key === 'role' && (
                                            <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
                                                {sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                            </motion.div>
                                        )}
                                    </div>
                                </TableHead>
                                <TableHead>Password</TableHead>
                                <TableHead className="cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSort('credentialStatus')}>
                                    <div className="flex items-center gap-1">
                                        Status
                                        {sortConfig?.key === 'credentialStatus' && (
                                            <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
                                                {sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                            </motion.div>
                                        )}
                                    </div>
                                </TableHead>
                                <TableHead className="cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSort('createdAt')}>
                                    <div className="flex items-center gap-1">
                                        Created
                                        {sortConfig?.key === 'createdAt' && (
                                            <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
                                                {sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                            </motion.div>
                                        )}
                                    </div>
                                </TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <AnimatePresence mode='popLayout'>
                                {paginatedUsers.length > 0 ? (
                                    paginatedUsers.map((user, index) => (
                                        <motion.tr
                                            key={user.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.3, delay: index * 0.05 }}
                                            className="group border-b transition-colors hover:bg-gray-50/50 data-[state=selected]:bg-muted"
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    {user.profileImage ? (
                                                        <img
                                                            src={user.profileImage}
                                                            alt={`${user.firstName} ${user.lastName}`}
                                                            className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm"
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                            user.role === 'staff' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                                            }`}>
                                                            {user.firstName[0]}{user.lastName[0]}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                                                        <div className="text-xs text-gray-500">{user.email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">{user.universityId || user.id.slice(0, 4)}</TableCell>
                                            <TableCell className="text-sm font-medium">{user.username}</TableCell>
                                            <TableCell className="text-sm text-gray-500">{user.phoneNumber || "-"}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="capitalize font-normal">
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs bg-gray-50 px-2 py-1 rounded select-all w-32 truncate max-w-[150px]" title="Click to select">
                                                {adminService.recoverPassword(user.id)}
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge status={user.credentialStatus} />
                                            </TableCell>
                                            <TableCell className="text-xs text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.95 }}>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors rounded-full"
                                                            title="Edit User"
                                                            onClick={() => handleEditClick(user)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </motion.div>
                                                    <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.95 }}>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 hover:bg-green-50 text-green-600 hover:text-green-700 transition-colors rounded-full"
                                                            title="Reset Password"
                                                            onClick={() => {
                                                                const pass = adminService.generateStrongPassword();
                                                                adminService.resetCredentials(user.id, pass);
                                                                setUsers(adminService.getUsers());
                                                                toast.success(`Password reset to: ${pass}`, { duration: 10000, description: "Copy this immediately." });
                                                            }}
                                                        >
                                                            <RefreshCw className="h-4 w-4" />
                                                        </Button>
                                                    </motion.div>
                                                    <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.95 }}>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className={`h-8 w-8 rounded-full transition-colors ${user.suspended ? 'hover:bg-green-50 text-green-600' : 'hover:bg-yellow-50 text-yellow-600'}`}
                                                            title={user.suspended ? "Activate User" : "Suspend User"}
                                                            onClick={() => handleToggleStatus(user.id)}
                                                        >
                                                            {user.suspended ? <CheckCircle className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                                        </Button>
                                                    </motion.div>
                                                    <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.95 }}>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 hover:bg-orange-50 text-orange-600 hover:text-orange-700 transition-colors rounded-full"
                                                            title="Terminate Access (Revoke Credentials)"
                                                            onClick={() => {
                                                                if (confirm(`Are you sure you want to terminate access for ${user.username}?`)) {
                                                                    adminService.terminateCredentials(user.id);
                                                                    setUsers(adminService.getUsers());
                                                                    toast.warning("User access terminated immediately");
                                                                }
                                                            }}
                                                        >
                                                            <Ban className="h-4 w-4" />
                                                        </Button>
                                                    </motion.div>
                                                    <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.95 }}>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors rounded-full"
                                                            title="Delete User Permanently"
                                                            onClick={() => handleDelete(user.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </motion.div>
                                                </div>
                                            </TableCell>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <motion.tr
                                        key="empty"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        <TableCell colSpan={9} className="h-24 text-center">
                                            No users found.
                                        </TableCell>
                                    </motion.tr>
                                )}
                            </AnimatePresence>
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Pagination */}
            {
                totalPages > 1 && (
                    <div className="flex items-center justify-end space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-sm text-gray-500">
                            Page {page} of {totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                )
            }
        </div>
    );
}

// ------------------------------------------------------------------
// USER FORM (INLINE)
// ------------------------------------------------------------------
function UserForm({ user, onSave, onCancel }: { user: AdminUser | null, onSave: () => void, onCancel: () => void }) {
    const isEditing = !!user;
    const [formData, setFormData] = useState({
        firstName: "", lastName: "", username: "", email: "", universityId: "", role: "student", password: "", phoneNumber: "", suspended: false
    });
    const [passwordStrength, setPasswordStrength] = useState<any>(null);

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                email: user.email,
                universityId: user.universityId || "",
                role: user.role,
                password: "", // Don't show hash
                phoneNumber: user.phoneNumber || "",
                suspended: user.suspended
            });
        } else {
            // Generate ID for new user display
            const generatedId = adminService.generateUniversityId();
            setFormData({
                firstName: "", lastName: "", username: "", email: "",
                universityId: generatedId,
                role: "student", password: "", phoneNumber: "", suspended: false
            });
        }
    }, [user]);

    const handleGeneratePassword = () => {
        const pass = adminService.generateStrongPassword();
        setFormData({ ...formData, password: pass });
        setPasswordStrength('very-strong');
    };

    const handleSubmit = () => {
        try {
            if (isEditing) {
                adminService.updateUser(user.id, formData as any);
                if (formData.password) {
                    adminService.resetCredentials(user.id, formData.password);
                }
                toast.success("User updated successfully");
            } else {
                if (!formData.password) throw new Error("Password is required for new users");
                adminService.createUser({
                    ...formData,
                    role: formData.role as any,
                    suspended: formData.suspended
                }); // Validation happens in service
                toast.success("User created successfully");
            }
            onSave();
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    return (
        <Card className="border-none shadow-lg bg-white/50 backdrop-blur-sm mb-6 border border-gray-100/50">
            <CardHeader>
                <CardTitle>{isEditing ? "Edit User" : "Create New User"}</CardTitle>
                <CardDescription>
                    {isEditing ? "Update user details. Leave password blank to keep current." : "Add a new user to the organization."}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>First Name <span className="text-red-500">*</span></Label>
                            <Input value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Last Name <span className="text-red-500">*</span></Label>
                            <Input value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Username <span className="text-red-500">*</span></Label>
                            <Input value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} disabled={isEditing} />
                        </div>
                        <div className="space-y-2">
                            <Label>Student ID <span className="text-xs text-blue-500">(Auto-Generated)</span></Label>
                            <div className="relative">
                                <Input value={formData.universityId} readOnly className="pl-10 bg-gray-50/50 font-mono text-gray-700 border-dashed border-gray-300" />
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Email <span className="text-red-500">*</span></Label>
                            <Input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Phone Number</Label>
                            <Input value={formData.phoneNumber} onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })} placeholder="+20..." />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 relative z-50">
                            <Label>Role</Label>
                            <Select value={formData.role} onValueChange={(val: string) => setFormData({ ...formData, role: val })}>
                                <SelectTrigger className="bg-white border-gray-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px] z-[9999] bg-white shadow-xl border border-gray-100">
                                    <SelectItem value="student">Student</SelectItem>
                                    <SelectItem value="staff">Staff - Faculty</SelectItem>
                                    <SelectItem value="admin">Administrator</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 relative z-40">
                            <Label>Account Status</Label>
                            <Select value={formData.suspended ? "inactive" : "active"} onValueChange={(val: string) => setFormData({ ...formData, suspended: val === "inactive" })}>
                                <SelectTrigger className="bg-white border-gray-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="z-[9999] bg-white shadow-xl border border-gray-100">
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Suspended</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t">
                        <Label>Credentials</Label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Input
                                    type="text"
                                    className="font-mono bg-white"
                                    placeholder={isEditing ? "Leave blank to keep current" : "Generate secure password"}
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                                {formData.password && (
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                        <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
                                    </div>
                                )}
                            </div>
                            <Button variant="outline" type="button" onClick={handleGeneratePassword} className="shrink-0">
                                <Key className="w-4 h-4 mr-2" /> Generate
                            </Button>
                        </div>
                        {passwordStrength && (
                            <div className="text-xs text-green-600 flex items-center gap-1">
                                <Shield className="w-3 h-3" /> Very Strong Password Generated
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="ghost" type="button" onClick={onCancel}>Cancel</Button>
                    <Button type="button" onClick={handleSubmit} className="min-w-[120px]">
                        {isEditing ? "Save Changes" : "Create User"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

// ------------------------------------------------------------------
// SUBJECT MANAGEMENT TAB
// ------------------------------------------------------------------
function SubjectManagementTab({ subjects, setSubjects }: any) {
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

    const filtered = subjects.filter((s: Subject) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.code.toLowerCase().includes(search.toLowerCase())
    );

    const handleCreateClick = () => {
        setEditingSubject(null);
        setShowForm(true);
    };

    const handleSave = () => {
        setSubjects(adminService.getSubjects());
        setShowForm(false);
        setEditingSubject(null);
    };

    const handleRemove = (id: string) => {
        if (confirm("Are you sure you want to delete this subject?")) {
            adminService.removeSubject(id);
            setSubjects(adminService.getSubjects());
            toast.info("Subject removed");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <Input
                        placeholder="Search subjects..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 h-10 transition-all border-gray-200 focus:border-blue-500"
                    />
                </div>

                <AnimatePresence>
                    {!showForm && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Button
                                onClick={handleCreateClick}
                                className="!bg-black !text-white hover:!bg-neutral-800 border-2 border-transparent hover:border-gray-800 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-full px-6 py-2 font-medium tracking-wide flex items-center gap-2 relative z-50 pointer-events-auto"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                <span>Add Subject</span>
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <SubjectForm
                            subject={editingSubject}
                            onSave={handleSave}
                            onCancel={() => { setShowForm(false); setEditingSubject(null); }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {filtered.map((subject: Subject) => (
                        <motion.div
                            key={subject.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            layout
                        >
                            <Card className="hover:shadow-lg transition-all group border-gray-100 h-full flex flex-col justify-between">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <Badge variant="outline" className="font-mono bg-blue-50 text-blue-700 border-blue-200">{subject.code}</Badge>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-red-500" onClick={() => handleRemove(subject.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <CardTitle className="text-lg mt-2">{subject.name}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <span className="flex items-center gap-1"><GraduationCap className="w-4 h-4" /> {subject.credits} Cr</span>
                                        <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {subject.enrolled}/{subject.capacity}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {filtered.length === 0 && <div className="col-span-full text-center text-gray-500 py-10">No subjects found.</div>}
            </div>
        </div>
    );
}

function SubjectForm({ subject, onSave, onCancel }: { subject: Subject | null, onSave: () => void, onCancel: () => void }) {
    const isEditing = !!subject;
    const [formData, setFormData] = useState({
        name: "", code: "", credits: 3, capacity: 600
    });

    useEffect(() => {
        if (subject) {
            setFormData({
                name: subject.name,
                code: subject.code,
                credits: subject.credits,
                capacity: subject.capacity
            });
        }
    }, [subject]);

    const handleSubmit = () => {
        if (!formData.name || !formData.code) {
            toast.error("Subject name and code are required");
            return;
        }

        try {
            // Since we don't have updateSubject implemented in service yet, we'll just focus on add for now or mock it if needed
            // But the user mainly asked for "Add Subject" flow.
            // For now, let's assume valid add.

            // Note: adminService.addSubject doesn't support update yet, so we only handle create logic basically similar to previous code
            // If editing was needed we'd need to update service, but keeping scope to "fix add subject"

            adminService.addSubject({
                name: formData.name,
                code: formData.code,
                credits: Number(formData.credits),
                capacity: Number(formData.capacity)
            });
            toast.success("Subject added successfully");
            onSave();
        } catch (e: any) {
            toast.error("Failed to save subject");
        }
    };

    return (
        <Card className="border-none shadow-lg bg-white/50 backdrop-blur-sm mb-6 border border-gray-100/50">
            <CardHeader>
                <CardTitle>{isEditing ? "Edit Subject" : "Add New Subject"}</CardTitle>
                <CardDescription>
                    {isEditing ? "Update subject details." : "Define a new course for the academic roadmap."}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Subject Name <span className="text-red-500">*</span></Label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Advanced Artificial Intelligence"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Subject Code <span className="text-red-500">*</span></Label>
                            <Input
                                value={formData.code}
                                onChange={e => setFormData({ ...formData, code: e.target.value })}
                                placeholder="e.g. CS405"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Credits</Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    min="1"
                                    value={formData.credits}
                                    onChange={e => setFormData({ ...formData, credits: parseInt(e.target.value) || 0 })}
                                    className="pl-10"
                                />
                                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Capacity</Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    min="1"
                                    value={formData.capacity}
                                    onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                                    className="pl-10"
                                />
                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="ghost" type="button" onClick={onCancel}>Cancel</Button>
                    <Button type="button" onClick={handleSubmit} className="min-w-[120px]">
                        Save Subject
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

// ------------------------------------------------------------------
// ANNOUNCEMENT TAB
// ------------------------------------------------------------------
function AnnouncementManagementTab({ announcements, setAnnouncements }: any) {
    const [newAnnouncement, setNewAnnouncement] = useState({ title: "", content: "" });

    const handlePost = () => {
        if (!newAnnouncement.title || !newAnnouncement.content) return;
        adminService.postAnnouncement({ ...newAnnouncement, author: "Admin" });
        setAnnouncements(adminService.getAnnouncements());
        setNewAnnouncement({ title: "", content: "" });
        toast.success("Announcement posted");
    };

    const handleDelete = (id: string) => {
        if (confirm("Delete this announcement?")) {
            adminService.deleteAnnouncement(id);
            setAnnouncements(adminService.getAnnouncements());
            toast.success("Announcement deleted");
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <Card className="border-none shadow-lg sticky top-6">
                    <CardHeader>
                        <CardTitle>Post New Announcement</CardTitle>
                        <CardDescription>Broadcast updates to the entire campus.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input placeholder="e.g. Exam Schedule Release" value={newAnnouncement.title} onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Content</Label>
                            <textarea
                                className="w-full min-h-[150px] p-3 rounded-md border text-sm"
                                placeholder="Details..."
                                value={newAnnouncement.content}
                                onChange={e => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                            />
                        </div>
                        <Button className="w-full" onClick={handlePost}>Post Now</Button>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2 space-y-6">
                <h3 className="font-semibold text-lg">Timeline</h3>
                <div className="relative border-l-2 border-gray-200 ml-3 space-y-8 pl-8 pb-8">
                    {announcements.map((ann: Announcement) => (
                        <div key={ann.id} className="relative group">
                            <span className="absolute -left-[43px] top-1 h-6 w-6 rounded-full bg-blue-500 border-4 border-white shadow-sm"></span>
                            <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-base">{ann.title}</CardTitle>
                                            <span className="text-xs text-gray-500">{ann.date}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleDelete(ann.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <CardDescription>{ann.author}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-600">{ann.content}</p>
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                    {announcements.length === 0 && <p className="text-gray-500">No announcements posted yet.</p>}
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'active') return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">Active</Badge>;
    if (status === 'revoked') return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200">Revoked</Badge>;
    return <Badge variant="outline">Unknown</Badge>;
}

function StatsCard({ title, value, icon: Icon, color, trend }: any) {
    return (
        <Card className="border-none shadow-md">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">{title}</p>
                        <h3 className="text-2xl font-bold mt-1">{value}</h3>
                        <p className="text-xs text-green-600 mt-1 font-medium">{trend}</p>
                    </div>
                    <div className={`p-3 rounded-xl ${color.replace('bg-', 'bg-opacity-10 text-')}`}>
                        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
