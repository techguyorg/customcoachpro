// Configuration - Hardcoded values + secrets from environment
// Only 4 secrets needed: SQL_USER, SQL_PASSWORD, JWT_SECRET, GOOGLE_APP_PASSWORD

export const config = {
  // Server
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Frontend URL (hardcoded)
  frontendUrl: 'https://customcoachpro.azurewebsites.net',
  
  // JWT Settings (hardcoded durations)
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    accessTokenExpiry: '1h',
    refreshTokenExpiry: '7d',
  },
  
  // Azure SQL Database (server/database hardcoded, credentials from env)
  database: {
    server: 'sql-ccp-prod.database.windows.net',
    database: 'sqldb-ccp-prod',
    user: process.env.SQL_USER || '',
    password: process.env.SQL_PASSWORD || '',
    options: {
      encrypt: true,
      trustServerCertificate: false,
      enableArithAbort: true,
      connectionTimeout: 30000,
      requestTimeout: 30000,
    },
  },
  
  // Google OAuth (client ID hardcoded, secret from env)
  google: {
    clientId: '123456789-abcdefghijklmnop.apps.googleusercontent.com', // Replace with actual
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: 'https://customcoachpro.azurewebsites.net/auth/google/callback',
  },
  
  // Email (SMTP settings hardcoded, app password from env)
  email: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    from: 's.susheel9@gmail.com',
    user: 's.susheel9@gmail.com',
    password: process.env.GOOGLE_APP_PASSWORD || '',
  },
  
  // Azure Storage (hardcoded account, connection string from env)
  storage: {
    accountName: 'customcoachpro',
    containerName: 'progress-photos',
    connectionString: 'DefaultEndpointsProtocol=https;AccountName=customcoachpro;AccountKey=RRUkiMb45XalPwMAfG2Qzi9yxngePT13AIYAL31NO5a4jfpIpko+2autLahhwlkEB1PzuRYeuvDt+AStzy+F9Q==;EndpointSuffix=core.windows.net',
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // requests per window
  },
  
  // Password Hashing
  bcrypt: {
    saltRounds: 12,
  },
};

// Validate required secrets in production
export function validateConfig(): void {
  if (config.nodeEnv === 'production') {
    const required = ['SQL_USER', 'SQL_PASSWORD', 'JWT_SECRET', 'GOOGLE_APP_PASSWORD'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
}
