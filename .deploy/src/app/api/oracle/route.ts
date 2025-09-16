import { NextRequest, NextResponse } from "next/server";
import { 
  executeQuery, 
  initializeOracleDB, 
  closeOracleDB,
  initializeOCI,
  getOracleServiceClient,
  OracleService,
  getOracleDBConfig,
  getOCIConfig
} from "@/lib/oracle-config";
import * as oci from 'oci-sdk';

// Initialize Oracle on first request
let initialized = false;

async function ensureInitialized() {
  if (!initialized) {
    try {
      await initializeOracleDB();
      initialized = true;
    } catch (error) {
      console.error('Failed to initialize Oracle:', error);
    }
  }
}

export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get("action");
  
  try {
    switch (action) {
      case 'status':
        // Check Oracle connection status
        const dbConfig = getOracleDBConfig();
        const ociConfig = getOCIConfig();
        
        return NextResponse.json({
          database: {
            configured: !!(dbConfig.user && dbConfig.password && dbConfig.connectionString),
            connectionString: dbConfig.connectionString ? `${dbConfig.connectionString.split('@')[1] || dbConfig.connectionString}` : 'Not configured',
          },
          oci: {
            configured: !!(ociConfig.tenancy && ociConfig.user),
            region: ociConfig.region,
            tenancy: ociConfig.tenancy ? `${ociConfig.tenancy.substring(0, 8)}...` : 'Not configured',
          }
        });
        
      case 'databases':
        // List available databases
        await ensureInitialized();
        const dbResult = await executeQuery(`
          SELECT 
            name, 
            created, 
            log_mode,
            open_mode,
            database_role
          FROM v$database
        `);
        
        return NextResponse.json({
          databases: dbResult.rows || []
        });
        
      case 'tables':
        // List tables in current schema
        await ensureInitialized();
        const schema = request.nextUrl.searchParams.get("schema") || 'USER';
        const tablesResult = await executeQuery(`
          SELECT 
            table_name,
            num_rows,
            last_analyzed,
            tablespace_name
          FROM ${schema === 'ALL' ? 'all_tables' : 'user_tables'}
          ORDER BY table_name
        `);
        
        return NextResponse.json({
          tables: tablesResult.rows || []
        });
        
      case 'schemas':
        // List available schemas
        await ensureInitialized();
        const schemasResult = await executeQuery(`
          SELECT DISTINCT owner as schema_name
          FROM all_tables
          WHERE owner NOT IN ('SYS', 'SYSTEM', 'DBSNMP', 'APPQOSSYS', 'DBSFWUSER')
          ORDER BY owner
        `);
        
        return NextResponse.json({
          schemas: schemasResult.rows || []
        });
        
      case 'oci-services':
        // List OCI services
        try {
          const authProvider = initializeOCI();
          const identityClient = getOracleServiceClient(OracleService.IDENTITY, authProvider) as oci.identity.IdentityClient;
          const compartmentId = getOCIConfig().compartmentId;
          
          if (!compartmentId) {
            return NextResponse.json({
              error: 'OCI compartment ID not configured',
              services: []
            });
          }
          
          // List compartments
          const compartments = await identityClient.listCompartments({
            compartmentId: compartmentId,
            limit: 100,
          });
          
          return NextResponse.json({
            compartments: compartments.items || [],
            region: getOCIConfig().region,
          });
        } catch (error: any) {
          return NextResponse.json({
            error: 'OCI not configured or authentication failed',
            message: error.message,
            services: []
          });
        }
        
      default:
        return NextResponse.json({
          error: 'Invalid action',
          availableActions: ['status', 'databases', 'tables', 'schemas', 'oci-services']
        }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Oracle API error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to execute Oracle operation',
      code: error.errorNum,
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sql, binds = [], options = {} } = body;
    
    await ensureInitialized();
    
    switch (action) {
      case 'query':
        // Execute a custom query
        if (!sql) {
          return NextResponse.json({
            error: 'SQL query is required'
          }, { status: 400 });
        }
        
        // Security: Only allow SELECT statements in query mode
        if (!sql.trim().toUpperCase().startsWith('SELECT')) {
          return NextResponse.json({
            error: 'Only SELECT statements are allowed in query mode'
          }, { status: 400 });
        }
        
        const queryResult = await executeQuery(sql, binds, options);
        
        return NextResponse.json({
          rows: queryResult.rows || [],
          metaData: queryResult.metaData || [],
          rowsAffected: queryResult.rowsAffected,
        });
        
      case 'execute':
        // Execute DML/DDL statements (requires additional validation)
        if (!sql) {
          return NextResponse.json({
            error: 'SQL statement is required'
          }, { status: 400 });
        }
        
        // Add transaction control
        const execResult = await executeQuery(sql, binds, {
          ...options,
          autoCommit: true,
        });
        
        return NextResponse.json({
          success: true,
          rowsAffected: execResult.rowsAffected,
          outBinds: execResult.outBinds,
        });
        
      case 'describe':
        // Describe a table structure
        const { tableName, schema = 'USER' } = body;
        
        if (!tableName) {
          return NextResponse.json({
            error: 'Table name is required'
          }, { status: 400 });
        }
        
        const describeResult = await executeQuery(`
          SELECT 
            column_name,
            data_type,
            data_length,
            nullable,
            data_default,
            column_id
          FROM ${schema === 'USER' ? 'user_tab_columns' : 'all_tab_columns'}
          WHERE table_name = UPPER(:tableName)
          ${schema !== 'USER' ? 'AND owner = UPPER(:schema)' : ''}
          ORDER BY column_id
        `, schema === 'USER' ? [tableName] : [tableName, schema]);
        
        return NextResponse.json({
          columns: describeResult.rows || [],
          tableName: tableName.toUpperCase(),
        });
        
      case 'test':
        // Test database connection
        const testResult = await executeQuery('SELECT 1 FROM DUAL');
        
        return NextResponse.json({
          connected: true,
          serverVersion: testResult.rows?.[0]?.[0] === 1,
          timestamp: new Date().toISOString(),
        });
        
      default:
        return NextResponse.json({
          error: 'Invalid action',
          availableActions: ['query', 'execute', 'describe', 'test']
        }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Oracle API error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to execute Oracle operation',
      code: error.errorNum,
      offset: error.offset,
    }, { status: 500 });
  }
}

// Cleanup on DELETE
export async function DELETE(request: NextRequest) {
  try {
    await closeOracleDB();
    initialized = false;
    
    return NextResponse.json({
      message: 'Oracle connection closed successfully'
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message || 'Failed to close Oracle connection'
    }, { status: 500 });
  }
}