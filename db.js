/**
 * User Database Utility (Supabase Cloud Backend)
 */

// 1. Supabase Credentials
const SUPABASE_URL = 'https://gipxccfydceahzmqdoks.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpcHhjY2Z5ZGNlYWh6bXFkb2tzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NjI2NDQsImV4cCI6MjA4NjAzODY0NH0.evPHM1GdBOufR2v2KYARiG8r81McUtUAPNVovn6P6-s';

// 2. Initialize Supabase Client
let dbClient = null;

function initSupabase() {
    if (dbClient) return dbClient;

    const lib = window.supabase || (typeof supabasejs !== 'undefined' ? supabasejs : null);

    if (lib && SUPABASE_URL && SUPABASE_KEY) {
        dbClient = lib.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log("Supabase Client Initialized Successfully.");
        return dbClient;
    }
    return null;
}

const DB = {
    CURRENT_USER_KEY: 'avendus_current_user',

    getClient() {
        return initSupabase();
    },

    // Register a new user
    async register(mobile, password) {
        const client = this.getClient();
        if (!client) {
            return { success: false, message: 'DATABASE ERROR: Supabase Library not loaded. Please check your internet or CDN link.' };
        }

        try {
            const { data, error } = await client
                .from('users')
                .insert([{
                    mobile: mobile,
                    password: password,
                    username: "User" + mobile.slice(-4),
                    kyc: 'Pending',
                    balance: 0.00,
                    invested: 0.00,
                    credit_score: 100,
                    vip: 0
                }])
                .select();

            if (error) {
                console.error("Supabase Insert Error:", error);
                return { success: false, message: `Cloud Error: ${error.message}` };
            }

            if (!data || data.length === 0) {
                throw new Error("Registration failed - no data returned.");
            }

            // Auto-login after registration
            const user = { ...data[0], creditScore: data[0].credit_score };
            localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
            return { success: true, user };
        } catch (error) {
            console.error('Registration Exception:', error);
            return { success: false, message: `System Error: ${error.message}` };
        }
    },

    // Global Login
    async login(mobile, password) {
        // 1. Hardcoded Demo Login (For Testing)
        const demoUser = {
            mobile: '918108038029',
            password: 'password123',
            user: { id: 1, mobile: '918108038029', username: 'Sharad Madhukar Mali', kyc: 'Approved', creditScore: 100, vip: 0, balance: 125000.50, invested: 46410128.48 }
        };

        if (mobile === demoUser.mobile && password === demoUser.password) {
            localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(demoUser.user));
            return { success: true, user: demoUser.user };
        }

        // 2. Cloud Login
        const client = this.getClient();
        if (!client) {
            return { success: false, message: 'Connection Error: Cloud backend not reachable.' };
        }

        try {
            const { data, error } = await client
                .from('users')
                .select('*')
                .eq('mobile', mobile)
                .single();

            if (error || !data) {
                return { success: false, message: 'Login Error: User not found or mobile not registered.' };
            }

            if (data.password === password) {
                const user = { ...data, creditScore: data.credit_score };
                localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
                return { success: true, user };
            } else {
                return { success: false, message: 'Login Error: Incorrect password.' };
            }
        } catch (error) {
            console.error('Login Exception:', error);
            return { success: false, message: 'System Error: Connection timeout.' };
        }
    },

    async resetPassword(mobile, newPassword) {
        const client = this.getClient();
        if (!client) return { success: false, message: 'Cloud connection not initialized.' };

        try {
            const { error } = await client
                .from('users')
                .update({ password: newPassword })
                .eq('mobile', mobile);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    getCurrentUser() {
        const userJson = localStorage.getItem(this.CURRENT_USER_KEY);
        return userJson ? JSON.parse(userJson) : null;
    },

    logout() {
        localStorage.removeItem(this.CURRENT_USER_KEY);
        window.location.href = 'index.html';
    }
};
