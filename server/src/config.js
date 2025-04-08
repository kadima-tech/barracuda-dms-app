"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const zod_1 = require("zod");
// Define the environment schema using Zod
const envSchema = zod_1.z.object({
    EXCHANGE_TENANT_ID: zod_1.z.string().min(1, 'EXCHANGE_TENANT_ID is required'),
    EXCHANGE_CLIENT_ID: zod_1.z.string().min(1, 'EXCHANGE_CLIENT_ID is required'),
    EXCHANGE_CLIENT_SECRET: zod_1.z
        .string()
        .min(1, 'EXCHANGE_CLIENT_SECRET is required'),
    EXCHANGE_REDIRECT_URI: zod_1.z.string().default('http://localhost:8085/exchange/callback'),
    APP_URL: zod_1.z.string().default('http://192.168.2.128:5173'),
    SPOTIFY_CLIENT_ID: zod_1.z.string().min(1, 'SPOTIFY_CLIENT_ID is required'),
    SPOTIFY_CLIENT_SECRET: zod_1.z
        .string()
        .min(1, 'SPOTIFY_CLIENT_SECRET is required'),
    SPOTIFY_REDIRECT_URI: zod_1.z
        .string()
        .min(1, 'SPOTIFY_REDIRECT_URI is required'),
});
// Parse and validate environment variables
const parsedEnv = envSchema.safeParse(process.env);
// Check if validation was successful
if (!parsedEnv.success) {
    console.error('❌ Invalid environment variables:', parsedEnv.error.format());
    throw new Error('Invalid environment variables');
}
// Configuration with proper typing from validated env
exports.config = Object.assign(Object.assign({}, parsedEnv.data), { SCOPES: [
        'User.Read',
        'Calendars.Read',
        'Calendars.ReadWrite.Shared',
        'offline_access',
    ] });
