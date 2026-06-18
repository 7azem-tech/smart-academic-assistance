import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { adminService, AdminUser } from "../services/adminService";
import { Loader2, Send, Phone, Users, CheckCircle, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

interface WhatsAppAlertModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function WhatsAppAlertModal({ isOpen, onClose }: WhatsAppAlertModalProps) {
    const [recipientType, setRecipientType] = useState<"manual" | "group" | "all">("manual");
    const [manualNumber, setManualNumber] = useState("");
    const [selectedGroup, setSelectedGroup] = useState("");
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSend = async () => {
        if (!message.trim()) {
            toast.error("Please enter a message content");
            return;
        }

        let recipients: string[] = [];

        if (recipientType === "manual") {
            if (!manualNumber.trim()) {
                toast.error("Please enter at least one phone number");
                return;
            }
            recipients = manualNumber
                .split(',')
                .map(n => n.trim())
                .filter(n => n.length > 0);

            if (recipients.length === 0) {
                toast.error("Invalid phone number format");
                return;
            }
        } else if (recipientType === "all") {
            // Fetch all users with phone numbers
            const users = adminService.getUsers();
            recipients = users
                .filter(u => u.phoneNumber)
                .map(u => u.phoneNumber as string);

            if (recipients.length === 0) {
                toast.error("No users found with valid phone numbers");
                return;
            }
        } else if (recipientType === "group") {
            // Mock groups for now since groups aren't fully defined in adminService yet
            if (!selectedGroup) {
                toast.error("Please select a group");
                return;
            }
            // Simulation: In a real app, query by group ID
            // Here we just pick a few users or empty
            const users = adminService.getUsers();
            recipients = users
                .filter(u => u.phoneNumber && u.role === selectedGroup) // Assuming group maps to role for this demo
                .map(u => u.phoneNumber as string);

            if (recipients.length === 0) {
                toast.error(`No users found in group ${selectedGroup} with phone numbers`);
                // For demo purposes, let's add a dummy number so the admin can see it working even with empty db
                recipients = ["+1234567890"];
                toast.info("Using simulation number for empty group");
            }
        }

        setIsSending(true);
        try {
            const result = await adminService.sendWhatsAppMessage(recipients, message);
            if (result.success) {
                setIsSuccess(true);
                toast.success(`Message sent to ${result.count} recipient(s)`);
                setTimeout(() => {
                    handleClose();
                }, 2000);
            } else {
                toast.error(result.error || "Failed to send message");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsSending(false);
        }
    };

    const handleClose = () => {
        setIsSuccess(false);
        setMessage("");
        setManualNumber("");
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && handleClose()}>
            <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 h-full">
                    {/* Left Side: Form */}
                    <div className="p-6 flex flex-col h-full">
                        <DialogHeader className="mb-6">
                            <DialogTitle className="text-xl flex items-center gap-2">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <MessageCircleIcon className="w-5 h-5 text-green-600" />
                                </div>
                                New WhatsApp Alert
                            </DialogTitle>
                            <DialogDescription>
                                Send notifications directly to student and staff WhatsApp accounts via Wasender.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 space-y-6">
                            <div className="space-y-4">
                                <Label>Recipient Selection</Label>
                                <Tabs value={recipientType} onValueChange={(v: string) => setRecipientType(v as any)} className="w-full">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="manual" className="flex items-center gap-2">
                                            <Phone className="w-4 h-4" /> Custom Numbers
                                        </TabsTrigger>
                                        <TabsTrigger value="group" className="flex items-center gap-2">
                                            <Users className="w-4 h-4" /> Group
                                        </TabsTrigger>
                                        <TabsTrigger value="all" className="flex items-center gap-2">
                                            <Users className="w-4 h-4" /> All Users
                                        </TabsTrigger>
                                    </TabsList>

                                    <div className="mt-4 min-h-[80px]">
                                        <AnimatePresence mode="wait">
                                            {recipientType === "manual" && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0 }}
                                                >
                                                    <Label htmlFor="phone" className="text-xs text-gray-500 mb-1 block">Phone Numbers (comma separated)</Label>
                                                    <Textarea
                                                        id="phone"
                                                        placeholder="+1234567890, +9876543210"
                                                        value={manualNumber}
                                                        onChange={(e) => setManualNumber(e.target.value)}
                                                        className="min-h-[80px] font-mono text-sm"
                                                    />
                                                    <p className="text-[10px] text-gray-400 mt-1">
                                                        Enter one or more numbers separated by commas.
                                                    </p>
                                                </motion.div>
                                            )}
                                            {recipientType === "group" && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0 }}
                                                >
                                                    <Label className="text-xs text-gray-500 mb-1 block">Target Group</Label>
                                                    <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a group" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="student">All Students</SelectItem>
                                                            <SelectItem value="staff">All Staff</SelectItem>
                                                            <SelectItem value="admin">Admins Only</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </motion.div>
                                            )}
                                            {recipientType === "all" && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0 }}
                                                    className="flex items-center justify-center h-[70px] bg-gray-50 rounded-lg border border-dashed border-gray-300"
                                                >
                                                    <p className="text-sm text-gray-500">Will send to all registered users with numbers</p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </Tabs>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message">Message Content</Label>
                                <Textarea
                                    id="message"
                                    placeholder="Type your message here..."
                                    className="min-h-[120px] resize-none focus-visible:ring-green-500"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                                <div className="text-xs text-right text-gray-400">
                                    {message.length} characters
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="mt-6">
                            <Button variant="outline" onClick={handleClose} disabled={isSending}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSend}
                                disabled={isSending || isSuccess}
                                className={`bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#20bd5a] hover:to-[#0e6f63] text-white min-w-[140px] shadow-lg transition-all duration-300 ${isSuccess ? 'bg-green-700' : ''}`}
                            >
                                {isSending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Sending...
                                    </>
                                ) : isSuccess ? (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Sent!
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Send Broadcast
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </div>

                    {/* Right Side: Preview */}
                    <div className="bg-gray-100 p-6 flex flex-col items-center justify-center border-l border-gray-200">
                        <h4 className="text-sm font-medium text-gray-500 mb-4 flex items-center gap-2">
                            <Smartphone className="w-4 h-4" /> Message Preview
                        </h4>

                        {/* Phone Mockup */}
                        <div className="relative w-[280px] h-[500px] bg-black rounded-[3rem] shadow-2xl border-[8px] border-black overflow-hidden flex flex-col">
                            {/* Status Bar */}
                            <div className="h-6 bg-black w-full flex items-center justify-between px-6">
                                <div className="text-[10px] text-white font-medium">9:41</div>
                                <div className="flex gap-1">
                                    <div className="w-3 h-3 bg-white rounded-full opacity-20"></div>
                                    <div className="w-3 h-3 bg-white rounded-full opacity-20"></div>
                                </div>
                            </div>

                            {/* App Header */}
                            <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3 shadow-md z-10">
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs">
                                    SA
                                </div>
                                <div>
                                    <div className="text-white text-sm font-medium">Smart Admin</div>
                                    <div className="text-white/70 text-[10px]">online</div>
                                </div>
                            </div>

                            {/* Chat Area */}
                            <div className="flex-1 bg-[#E5DDD5] p-3 overflow-y-auto relative">
                                {/* Background Pattern Simulation */}
                                <div className="absolute inset-0 opacity-[0.06] bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/1200px-WhatsApp.svg.png')] bg-repeat bg-[length:200px_200px]" style={{ filter: 'grayscale(1)' }}></div>

                                {message ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        className="bg-white p-2 rounded-lg rounded-tl-none shadow-sm max-w-[85%] relative mb-2"
                                    >
                                        <p className="text-sm text-gray-800 break-words whitespace-pre-wrap">{message}</p>
                                        <div className="text-[10px] text-gray-400 text-right mt-1 flex items-center justify-end gap-1">
                                            10:30 AM
                                            <span className="text-blue-500">✓✓</span>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                                        <p className="text-xs text-center px-4">Type a message to see preview</p>
                                    </div>
                                )}
                            </div>

                            {/* Input Area (Visual only) */}
                            <div className="bg-[#F0F0F0] p-2 flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gray-300"></div>
                                <div className="flex-1 h-8 bg-white rounded-full border border-gray-200"></div>
                                <div className="w-8 h-8 rounded-full bg-[#00897B] flex items-center justify-center">
                                    <Send className="w-4 h-4 text-white" />
                                </div>
                            </div>
                        </div>

                        <p className="text-xs text-gray-400 mt-4 text-center max-w-[250px]">
                            Calculated preview. Actual appearance may vary by device.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function MessageCircleIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
        </svg>
    )
}
