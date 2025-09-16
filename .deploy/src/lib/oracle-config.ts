// Oracle Database and Cloud Configuration
import oracledb from 'oracledb';
import * as oci from 'oci-sdk';

// Oracle Database Configuration
export interface OracleDBConfig {
  user: string;
  password: string;
  connectionString: string; // Format: hostname:port/servicename
  poolMin?: number;
  poolMax?: number;
  poolIncrement?: number;
}

// Oracle Cloud Infrastructure (OCI) Configuration
export interface OCIConfig {
  tenancy: string;
  user: string;
  fingerprint: string;
  privateKeyPath: string;
  region: string;
  compartmentId: string;
}

// Environment-based configuration
export const getOracleDBConfig = (): OracleDBConfig => ({
  user: process.env.ORACLE_DB_USER || '',
  password: process.env.ORACLE_DB_PASSWORD || '',
  connectionString: process.env.ORACLE_DB_CONNECTION_STRING || '',
  poolMin: parseInt(process.env.ORACLE_DB_POOL_MIN || '1'),
  poolMax: parseInt(process.env.ORACLE_DB_POOL_MAX || '4'),
  poolIncrement: parseInt(process.env.ORACLE_DB_POOL_INCREMENT || '1'),
});

export const getOCIConfig = (): OCIConfig => ({
  tenancy: process.env.OCI_TENANCY || '',
  user: process.env.OCI_USER || '',
  fingerprint: process.env.OCI_FINGERPRINT || '',
  privateKeyPath: process.env.OCI_PRIVATE_KEY_PATH || '',
  region: process.env.OCI_REGION || 'us-ashburn-1',
  compartmentId: process.env.OCI_COMPARTMENT_ID || '',
});

// Initialize Oracle Database connection pool
let connectionPool: oracledb.Pool | null = null;

export async function initializeOracleDB(config?: OracleDBConfig): Promise<void> {
  try {
    const dbConfig = config || getOracleDBConfig();
    
    if (!dbConfig.user || !dbConfig.password || !dbConfig.connectionString) {
      console.warn('Oracle DB configuration is incomplete. Skipping initialization.');
      return;
    }

    // Initialize Oracle client if using Instant Client
    if (process.env.ORACLE_CLIENT_PATH) {
      oracledb.initOracleClient({ libDir: process.env.ORACLE_CLIENT_PATH });
    }

    // Create connection pool
    connectionPool = await oracledb.createPool({
      user: dbConfig.user,
      password: dbConfig.password,
      connectionString: dbConfig.connectionString,
      poolMin: dbConfig.poolMin,
      poolMax: dbConfig.poolMax,
      poolIncrement: dbConfig.poolIncrement,
    });

    console.log('Oracle Database connection pool created successfully');
  } catch (error) {
    console.error('Failed to initialize Oracle Database:', error);
    throw error;
  }
}

// Get a connection from the pool
export async function getOracleConnection(): Promise<oracledb.Connection> {
  if (!connectionPool) {
    await initializeOracleDB();
  }
  if (!connectionPool) {
    throw new Error('Oracle Database connection pool not initialized');
  }
  return await connectionPool.getConnection();
}

// Execute a query
export async function executeQuery<T = any>(
  sql: string,
  binds: any = [],
  options: oracledb.ExecuteOptions = {}
): Promise<oracledb.Result<T>> {
  let connection;
  try {
    connection = await getOracleConnection();
    const result = await connection.execute<T>(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      ...options,
    });
    return result;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

// Initialize OCI SDK
export function initializeOCI(config?: OCIConfig): oci.common.ConfigFileAuthenticationDetailsProvider {
  const ociConfig = config || getOCIConfig();
  
  if (ociConfig.privateKeyPath) {
    // Use configuration file authentication
    return new oci.common.ConfigFileAuthenticationDetailsProvider(
      ociConfig.privateKeyPath
    );
  } else {
    // Use default configuration
    return new oci.common.ConfigFileAuthenticationDetailsProvider();
  }
}

// Close connection pool
export async function closeOracleDB(): Promise<void> {
  if (connectionPool) {
    await connectionPool.close(0);
    connectionPool = null;
    console.log('Oracle Database connection pool closed');
  }
}

// Oracle service types
export enum OracleService {
  DATABASE = 'database',
  COMPUTE = 'compute',
  STORAGE = 'storage',
  NETWORKING = 'networking',
  IDENTITY = 'identity',
  ANALYTICS = 'analytics',
  INTEGRATION = 'integration',
  BLOCKCHAIN = 'blockchain',
  AI = 'ai',
}

// Get Oracle service client
export function getOracleServiceClient(
  service: OracleService,
  authProvider: oci.common.ConfigFileAuthenticationDetailsProvider
) {
  switch (service) {
    case OracleService.DATABASE:
      return new oci.database.DatabaseClient({ authenticationDetailsProvider: authProvider });
    case OracleService.COMPUTE:
      return new oci.core.ComputeClient({ authenticationDetailsProvider: authProvider });
    case OracleService.STORAGE:
      return new oci.objectstorage.ObjectStorageClient({ authenticationDetailsProvider: authProvider });
    case OracleService.IDENTITY:
      return new oci.identity.IdentityClient({ authenticationDetailsProvider: authProvider });
    default:
      throw new Error(`Unsupported Oracle service: ${service}`);
  }
}