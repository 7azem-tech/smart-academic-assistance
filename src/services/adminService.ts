

export type CredentialStatus = 'active' | 'revoked' | 'expired';

export interface AdminUser {
    id: string;
    username: string; // Used for login
    firstName: string;
    lastName: string;
    email: string;
    role: 'admin' | 'student' | 'staff';
    passwordHash?: string;
    createdAt: string;
    suspended: boolean;
    credentialStatus: CredentialStatus;
    universityId?: string; // Optional custom ID
    profileImage?: string; // User profile picture
    phoneNumber?: string;
    deleted?: boolean; // Soft delete
}

// Simple mock for bcrypt - in production use real bcrypt on server
// Simple mock for bcrypt - in production use real bcrypt on server
const hashPassword = (password: string) => {
    try {
        return `hashed_${btoa(unescape(encodeURIComponent(password)))}`;
    } catch (e) {
        console.error("Hashing error", e);
        return `hashed_${btoa(password)}`; // Fallback
    }
};
const checkPassword = (password: string, hash: string) => {
    try {
        const newHash = `hashed_${btoa(unescape(encodeURIComponent(password)))}`;
        if (hash === newHash) return true;
    } catch (e) {
        // Ignore
    }
    // Fallback for legacy hashes or simple ASCII
    try {
        return hash === `hashed_${btoa(password)}`;
    } catch {
        return false;
    }
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[\d\s-]{10,}$/;

export interface Announcement {
    id: string;
    title: string;
    content: string;
    date: string;
    author: string;
}

export interface Subject {
    id: string;
    name: string;
    code: string;
    credits: number;
    capacity: number;
    enrolled: number;
    botProfileImage?: string; // Admin can replace dicebear image with custom avatar
}

const INITIAL_SUBJECTS = [
    "Electronics", "Mathematics-1", "Technical Report Writing", "Human Rights", "Discrete Math", "Introduction to Computers",
    "Probability and Statistics-1", "Creative and Scientific Thinking", "Mathematics-2", "Micro Economics", "Logic Design", "Programming Language",
    "Object Oriented Programming", "Introduction to Database Systems", "Mathematics-3", "Computer Networks Technology", "Probability and Statistics-2", "Introduction to Software Engineering",
    "Introduction to Operation Research", "Data Structure", "Machine Learning Fundamentals", "Web Technology", "Entrepreneurship", "Networking Fundamentals Lab",
    "Network Routing and Switching-Lab", "Artificial Intelligence", "Operating Systems", "Digital Signal Processing", "Computer Organization", "Algorithms Analysis and Design",
    "Pattern Recognition", "Information Computer Networks Security", "Natural Language Processing", "Advanced Software Engineering", "Microcontroller", "Ethical Hacking-Lab",
    "Selected Labs in Software Engineering", "Embedded Systems", "Computer Graphics", "Advanced Computer Networks", "Project (1)", "Communication Technology",
    "Cloud Computing Networking", "Semantic Web and Ontology", "Wireless and Mobile Networks", "Fundamental of Management", "Project (2)", "Selected Labs in AI"
];

class AdminService {
    private static instance: AdminService;

    private constructor() {
        this.init();
    }

    public static getInstance(): AdminService {
        if (!AdminService.instance) {
            AdminService.instance = new AdminService();
        }
        return AdminService.instance;
    }

    private init() {
        if (!localStorage.getItem('app_subjects_v4')) {
            const subjects: Subject[] = INITIAL_SUBJECTS.map(name => ({
                id: crypto.randomUUID(),
                name,
                code: name.substring(0, 3).toUpperCase() + Math.floor(Math.random() * 900 + 100),
                credits: 3, // Default
                capacity: 600, // Default to 600
                enrolled: 0 // Initialize to 0 as requested
            }));
            localStorage.setItem('app_subjects_v4', JSON.stringify(subjects));
        }

        // Initialize or Fix Admin User
        const existingUsersStr = localStorage.getItem('app_users_v3');
        let users: AdminUser[] = existingUsersStr ? JSON.parse(existingUsersStr) : [];

        const adminIndex = users.findIndex(u => u.username === 'admin');
        const defaultAdmin: AdminUser = {
            id: 'admin-1',
            username: 'admin',
            firstName: 'System',
            lastName: 'Admin',
            email: 'admin@eelu.edu.eg',
            role: 'admin',
            passwordHash: hashPassword('password123'),
            createdAt: new Date().toISOString(),
            suspended: false,
            credentialStatus: 'active',
            universityId: 'ADMIN-001'
        };

        if (adminIndex >= 0) {
            // Force reset admin password to ensure access but keep the rest of the profile intact
            users[adminIndex].passwordHash = defaultAdmin.passwordHash;
        } else {
            users.push(defaultAdmin);
        }

        localStorage.setItem('app_users_v3', JSON.stringify(users));

        if (!localStorage.getItem('app_announcements')) {
            localStorage.setItem('app_announcements', JSON.stringify([]));
        }
    }

    // User Management
    getUsers(): AdminUser[] {
        const allUsers: AdminUser[] = JSON.parse(localStorage.getItem('app_users_v3') || '[]');
        return allUsers.filter(u => !u.deleted);
    }

    generateUniversityId(): string {
        const users = this.getUsers();
        const year = new Date().getFullYear().toString().slice(-2);
        let id = "";
        let isUnique = false;

        while (!isUnique) {
            const random = Math.floor(10000 + Math.random() * 90000).toString(); // 5 digits
            id = `${year}${random}`;
            if (!users.some(u => u.universityId === id)) {
                isUnique = true;
            }
        }
        return id;
    }

    createUser(user: Omit<AdminUser, 'id' | 'createdAt' | 'credentialStatus' | 'deleted' | 'passwordHash' | 'suspended'> & { password?: string; suspended?: boolean }): AdminUser {
        const users = JSON.parse(localStorage.getItem('app_users_v3') || '[]');

        // 1. Sanitize & Validate
        const sanitizedUsername = user.username.trim();
        if (!sanitizedUsername || sanitizedUsername.length < 3) throw new Error("Username must be at least 3 characters");
        if (!user.email || !EMAIL_REGEX.test(user.email)) throw new Error("Invalid email address");
        // Phone number is optional, but if provided, validate it
        if (user.phoneNumber && !PHONE_REGEX.test(user.phoneNumber)) throw new Error("Invalid phone number format");
        if (!user.role) throw new Error("User role is required");
        if (!user.password) throw new Error("Password is required");

        // 2. Uniqueness Checks
        if (users.some((u: AdminUser) => !u.deleted && u.username.toLowerCase() === sanitizedUsername.toLowerCase())) {
            throw new Error(`Username '${sanitizedUsername}' is already taken`);
        }
        if (users.some((u: AdminUser) => !u.deleted && u.email.toLowerCase() === user.email.toLowerCase())) {
            throw new Error(`Email '${user.email}' is already registered`);
        }

        // 3. Create User Object
        const newUser: AdminUser = {
            ...user,
            username: sanitizedUsername,
            id: crypto.randomUUID(),
            // Auto-generate university ID if not provided or if it's empty
            universityId: user.universityId || this.generateUniversityId(),
            createdAt: new Date().toISOString(),
            suspended: user.suspended || false,
            credentialStatus: user.suspended ? 'revoked' : 'active',
            passwordHash: user.password ? hashPassword(user.password) : undefined,
            deleted: false
        };

        // Remove raw password if it accidentally slipped in
        delete (newUser as any).password;

        users.push(newUser);
        localStorage.setItem('app_users_v3', JSON.stringify(users));
        return newUser;
    }

    updateUser(id: string, updates: Partial<AdminUser>): AdminUser {
        const users = JSON.parse(localStorage.getItem('app_users_v3') || '[]');
        const index = users.findIndex((u: AdminUser) => u.id === id);
        if (index === -1) throw new Error("User not found");

        const updatedUser = { ...users[index], ...updates };
        users[index] = updatedUser;
        localStorage.setItem('app_users_v3', JSON.stringify(users));
        return updatedUser;
    }

    getUser(id: string): AdminUser | undefined {
        return this.getUsers().find(u => u.id === id);
    }

    updateProfileImage(userId: string, imageData: string): AdminUser {
        return this.updateUser(userId, { profileImage: imageData });
    }

    deleteUser(userId: string) {
        const users = JSON.parse(localStorage.getItem('app_users_v3') || '[]');
        const user = users.find((u: AdminUser) => u.id === userId);
        if (user) {
            user.deleted = true; // Soft delete
            localStorage.setItem('app_users_v3', JSON.stringify(users));
        }
    }

    toggleUserStatus(userId: string) {
        const users = JSON.parse(localStorage.getItem('app_users_v3') || '[]');
        const user = users.find((u: AdminUser) => u.id === userId);
        if (user) {
            user.suspended = !user.suspended;
            user.credentialStatus = user.suspended ? 'revoked' : 'active';
            localStorage.setItem('app_users_v3', JSON.stringify(users));
        }
        return user;
    }

    resetCredentials(userId: string, newPassword: string) {
        const users = JSON.parse(localStorage.getItem('app_users_v3') || '[]');
        const user = users.find((u: AdminUser) => u.id === userId);
        if (user) {
            console.log(`[AdminService] Resetting credentials for ${user.username}`);
            user.passwordHash = hashPassword(newPassword);
            user.credentialStatus = 'active';
            user.suspended = false;
            try {
                localStorage.setItem('app_users_v3', JSON.stringify(users));
                console.log(`[AdminService] Credentials saved.`);
            } catch (e) {
                console.error("[AdminService] Failed to save credentials", e);
            }
        }
    }

    terminateCredentials(userId: string) {
        const users = JSON.parse(localStorage.getItem('app_users_v3') || '[]');
        const user = users.find((u: AdminUser) => u.id === userId);
        if (user) {
            user.credentialStatus = 'revoked';
            user.suspended = true;
            user.passwordHash = ""; // Clear password
            localStorage.setItem('app_users_v3', JSON.stringify(users));
        }
    }

    generateStrongPassword(): string {
        const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const lower = "abcdefghijklmnopqrstuvwxyz";
        const numbers = "0123456789";
        const special = "!@#$%^&*()_+~`|}{[]:;?><,./-=";
        const all = upper + lower + numbers + special;

        let password = "";
        // Ensure at least one of each
        password += upper[Math.floor(Math.random() * upper.length)];
        password += lower[Math.floor(Math.random() * lower.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += special[Math.floor(Math.random() * special.length)];

        for (let i = 0; i < 12; i++) {
            password += all.charAt(Math.floor(Math.random() * all.length));
        }
        // Shuffle
        return password.split('').sort(() => 0.5 - Math.random()).join('');
    }

    // Announcements
    getAnnouncements(): Announcement[] {
        return JSON.parse(localStorage.getItem('app_announcements') || '[]');
    }

    postAnnouncement(announcement: Omit<Announcement, 'id' | 'date'>) {
        const announcements = this.getAnnouncements();
        const newAnnouncement: Announcement = {
            ...announcement,
            id: crypto.randomUUID(),
            date: new Date().toLocaleDateString(),
        };
        announcements.unshift(newAnnouncement);
        localStorage.setItem('app_announcements', JSON.stringify(announcements));
        return newAnnouncement;
    }

    deleteAnnouncement(id: string) {
        let announcements = this.getAnnouncements();
        announcements = announcements.filter(a => a.id !== id);
        localStorage.setItem('app_announcements', JSON.stringify(announcements));
    }

    // Subjects
    getSubjects(): Subject[] {
        return JSON.parse(localStorage.getItem('app_subjects_v4') || '[]');
    }

    addSubject(subject: Omit<Subject, 'id' | 'enrolled'>) {
        const subjects = this.getSubjects();
        const newSubject: Subject = {
            ...subject,
            id: crypto.randomUUID(),
            enrolled: 0
        };
        subjects.push(newSubject);
        localStorage.setItem('app_subjects_v4', JSON.stringify(subjects));
        return newSubject;
    }

    removeSubject(id: string) {
        let subjects = this.getSubjects();
        subjects = subjects.filter(s => s.id !== id);
        localStorage.setItem('app_subjects_v4', JSON.stringify(subjects));
    }

    updateSubjectBotAvatar(id: string, imageData: string) {
        let subjects = this.getSubjects();
        const index = subjects.findIndex(s => s.id === id);
        if (index > -1) {
            subjects[index].botProfileImage = imageData;
            localStorage.setItem('app_subjects_v4', JSON.stringify(subjects));
        }
    }

    verifyUser(username: string, password: string, role: string): { success: boolean; error?: string; userId?: string } {
        const users = this.getUsers();
        // Normalize input
        const normalizedInputUsername = username.trim().toLowerCase();

        // Debugging logs
        console.log(`[AdminService] verifying user: '${username}' as '${role}'`);

        // First check if user exists at all (ignoring role, case-insensitive)
        const userAnyRole = users.find(u =>
            u.username.trim().toLowerCase() === normalizedInputUsername && !u.deleted
        );

        if (!userAnyRole) {
            console.warn(`[AdminService] User '${username}' not found.`);
            return { success: false, error: 'user_not_found' };
        }

        // Check if role matches
        if (userAnyRole.role !== role) {
            console.warn(`[AdminService] Role mismatch for '${username}'. Found role: '${userAnyRole.role}', Expected: '${role}'`);
            return { success: false, error: 'role_mismatch' };
        }

        const user = userAnyRole;

        if (!user.passwordHash || !checkPassword(password, user.passwordHash)) {
            console.warn(`[AdminService] Password failed for '${username}'`);
            return { success: false, error: 'wrong_password' };
        }

        if (user.suspended) return { success: false, error: 'account_suspended' };
        if (user.credentialStatus === 'revoked') return { success: false, error: 'credentials_revoked' };
        if (user.credentialStatus === 'expired') return { success: false, error: 'credentials_expired' };

        console.log(`[AdminService] Login successful for '${username}'`);
        return { success: true, userId: user.id };
    }

    recoverPassword(userId: string): string {
        const users = this.getUsers();
        const user = users.find(u => u.id === userId);
        if (user && user.passwordHash) {
            try {
                return atob(user.passwordHash.replace('hashed_', ''));
            } catch (e) {
                return "Error decoding";
            }
        }
        return "Not Set";
    }

    // WhatsApp Integration
    getWhatsAppLogs(): WhatsAppLog[] {
        return JSON.parse(localStorage.getItem('app_whatsapp_logs') || '[]');
    }

    async sendWhatsAppMessage(recipients: string[], message: string): Promise<{ success: boolean; error?: string; count?: number }> {
        const WASENDER_TOKEN = "ea4dba73b54792b10fcaccdc066ba3d0c4c559e2e4fa437ea9c7fa21cae10c1d";
        // Using the endpoint found in search results. Note: If CORS issues occur, a proxy might be needed.
        const API_URL = "https://wasenderapi.com/api/send-message";

        const logs = this.getWhatsAppLogs();
        const timestamp = new Date().toISOString();
        let successCount = 0;
        let failCount = 0;

        // Verify we have recipients
        if (!recipients || recipients.length === 0) {
            return { success: false, error: "No recipients selected" };
        }

        const sendToRecipient = async (number: string) => {
            try {
                // Formatting number: Ensure it starts with + or is in international format if API requires specific format
                // Wasender typically expects E.164 (e.g., +1234567890)
                let formattedNumber = number.trim();

                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${WASENDER_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        phone: formattedNumber, // Some APIs use 'phone', some 'to'. Checking documentation... 
                        // Search result #1 says 'to' parameter for one provider, but let's try 'phone' or 'to' based on common patterns.
                        // Re-reading search result #1 carefully... "to: The recipient's phone number"
                        // So 'to' is likely correct.
                        to: formattedNumber,
                        message: message // 'text' or 'message'? Search result #1 says 'text'.
                        // Let's try to include both to be safe or stick to 'text' as per search result #1.
                    })
                });

                // If the first attempt fails with 400/422, it might be parameter name mismatch. 
                // However, search result #1 explicitly mentioned 'to' and 'text'.
                // Let's refine the body to match 'to' and 'text'.

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error("Wasender API Error:", errorData);
                    throw new Error(errorData.message || `API Error: ${response.status}`);
                }

                const data = await response.json();
                return { success: true, data };
            } catch (err: any) {
                console.error("Send Error:", err);
                return { success: false, error: err.message };
            }
        };

        // Correcting the fetch body based on search result #1 which said 'to' and 'text'.
        const sendToRecipientCorrect = async (number: string) => {
            try {
                const response = await fetch("https://wasenderapi.com/api/send-message", {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${WASENDER_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        to: number,
                        text: message
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`API Error ${response.status}: ${errorText}`);
                }

                return { success: true };
            } catch (err: any) {
                return { success: false, error: err.message };
            }
        }

        const logEntries: WhatsAppLog[] = [];

        for (const recipient of recipients) {
            const result = await sendToRecipientCorrect(recipient);

            const logEntry: WhatsAppLog = {
                id: crypto.randomUUID(),
                recipient,
                message,
                timestamp,
                status: result.success ? 'success' : 'failure',
                error: result.error
            };

            logEntries.push(logEntry);
            if (result.success) successCount++;
            else failCount++;
        }

        // Save logs
        localStorage.setItem('app_whatsapp_logs', JSON.stringify([...logEntries, ...logs]));

        if (successCount === 0 && failCount > 0) {
            return { success: false, error: "Failed to send to all recipients. Check console for CORS or API errors." };
        }

        return { success: true, count: successCount };
    }
}

export interface WhatsAppLog {
    id: string;
    recipient: string;
    message: string;
    timestamp: string;
    status: 'success' | 'failure';
    error?: string;
}

export const adminService = AdminService.getInstance();
