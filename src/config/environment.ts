/**
 * Environment Configuration
 * 
 * Centralized configuration for the Azure-based CustomCoachPro platform.
 * All services now run on Azure infrastructure.
 */

export const config = {
  // API Configuration
  api: {
    // Azure backend API URL - aligned with api.ts (port 3000)
    baseUrl: import.meta.env.VITE_API_URL || "http://localhost:3000",
    functionsPath: "/api",
  },

  // Authentication Provider
  auth: {
    // 'azure' - Custom JWT authentication via Express backend
    provider: (import.meta.env.VITE_AUTH_PROVIDER as string) || "azure",
  },

  // Database Provider
  database: {
    // 'azure_sql' - Azure SQL Database
    provider: (import.meta.env.VITE_DATABASE_PROVIDER as string) || "azure_sql",
  },

  // Storage Provider
  storage: {
    // 'azure_blob' - Azure Blob Storage
    provider: (import.meta.env.VITE_STORAGE_PROVIDER as string) || "azure_blob",
  },

  // Email Configuration
  email: {
    // Gmail SMTP settings (used in edge functions)
    senderEmail: "s.susheel9@gmail.com",
    senderName: "CustomCoachPro",
  },

  // Feature Flags
  features: {
    enableEmailNotifications: true,
    enablePushNotifications: false,
    enableRealtime: true,
  },

  // Azure-specific configuration
  azure: {
    // Azure Functions URL - aligned with api.ts (port 3000)
    apiUrl: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
    functionsUrl: import.meta.env.VITE_AZURE_FUNCTIONS_URL || "",
    storageUrl: import.meta.env.VITE_AZURE_STORAGE_URL || "",
    googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
  },
} as const;

// Helper to check current environment
export const isProduction = import.meta.env.PROD;
export const isDevelopment = import.meta.env.DEV;

// Helper to check which provider is active
export const isUsingAzure = {
  auth: config.auth.provider === "azure",
  database: config.database.provider === "azure_sql",
  storage: config.storage.provider === "azure_blob",
};
