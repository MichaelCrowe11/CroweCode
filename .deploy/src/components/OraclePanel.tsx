"use client";

import React, { useState, useEffect } from "react";
import { 
  Database, 
  Table, 
  Server, 
  Cloud, 
  RefreshCw, 
  Play, 
  Settings,
  Shield,
  ChevronRight,
  ChevronDown,
  Search,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface OracleConnection {
  configured: boolean;
  connectionString?: string;
}

interface OCIConnection {
  configured: boolean;
  region?: string;
  tenancy?: string;
}

interface Table {
  TABLE_NAME: string;
  NUM_ROWS: number;
  LAST_ANALYZED: string;
  TABLESPACE_NAME: string;
}

interface Column {
  COLUMN_NAME: string;
  DATA_TYPE: string;
  DATA_LENGTH: number;
  NULLABLE: string;
  DATA_DEFAULT: string;
  COLUMN_ID: number;
}

export default function OraclePanel() {
  const [activeTab, setActiveTab] = useState<'database' | 'cloud' | 'query'>('database');
  const [dbStatus, setDbStatus] = useState<OracleConnection | null>(null);
  const [ociStatus, setOciStatus] = useState<OCIConnection | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableColumns, setTableColumns] = useState<Column[]>([]);
  const [query, setQuery] = useState("SELECT * FROM dual");
  const [queryResult, setQueryResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schemas, setSchemas] = useState<string[]>([]);
  const [selectedSchema, setSelectedSchema] = useState<string>('USER');

  // Check Oracle status
  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/oracle?action=status');
      const data = await response.json();
      setDbStatus(data.database);
      setOciStatus(data.oci);
    } catch (error) {
      console.error('Failed to check Oracle status:', error);
    }
  };

  // Load tables
  const loadTables = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/oracle?action=tables&schema=${selectedSchema}`);
      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else {
        setTables(data.tables || []);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load schemas
  const loadSchemas = async () => {
    try {
      const response = await fetch('/api/oracle?action=schemas');
      const data = await response.json();
      if (data.schemas) {
        setSchemas(['USER', ...data.schemas.map((s: any) => s.SCHEMA_NAME)]);
      }
    } catch (error) {
      console.error('Failed to load schemas:', error);
    }
  };

  // Describe table
  const describeTable = async (tableName: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/oracle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'describe',
          tableName,
          schema: selectedSchema === 'USER' ? undefined : selectedSchema,
        }),
      });
      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else {
        setTableColumns(data.columns || []);
        setSelectedTable(tableName);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Execute query
  const executeQuery = async () => {
    setLoading(true);
    setError(null);
    setQueryResult(null);
    try {
      const response = await fetch('/api/oracle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'query',
          sql: query,
        }),
      });
      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else {
        setQueryResult(data);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Test connection
  const testConnection = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/oracle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test' }),
      });
      const data = await response.json();
      if (data.connected) {
        setError(null);
        alert('Oracle connection successful!');
      } else {
        setError('Connection test failed');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-zinc-900">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
        <Database className="h-4 w-4 text-orange-500" />
        <span className="text-xs font-medium">Oracle Integration</span>
        <div className="ml-auto flex items-center gap-2">
          {dbStatus?.configured ? (
            <span className="flex items-center gap-1 text-xs text-green-400">
              <CheckCircle className="h-3 w-3" />
              Connected
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-yellow-400">
              <AlertCircle className="h-3 w-3" />
              Not Configured
            </span>
          )}
          <button
            onClick={checkStatus}
            className="p-1 hover:bg-white/10 rounded"
            title="Refresh Status"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab('database')}
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 text-xs transition-colors ${
            activeTab === 'database' 
              ? 'bg-zinc-800 text-white border-b-2 border-orange-500' 
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          <Database className="h-3 w-3" />
          Database
        </button>
        <button
          onClick={() => setActiveTab('cloud')}
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 text-xs transition-colors ${
            activeTab === 'cloud' 
              ? 'bg-zinc-800 text-white border-b-2 border-orange-500' 
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          <Cloud className="h-3 w-3" />
          OCI
        </button>
        <button
          onClick={() => setActiveTab('query')}
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 text-xs transition-colors ${
            activeTab === 'query' 
              ? 'bg-zinc-800 text-white border-b-2 border-orange-500' 
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          <Play className="h-3 w-3" />
          Query
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'database' && (
          <div className="p-3 space-y-3">
            {/* Connection Info */}
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">Connection</span>
                <button
                  onClick={testConnection}
                  className="px-2 py-1 text-xs bg-orange-500/20 hover:bg-orange-500/30 rounded"
                  disabled={loading || !dbStatus?.configured}
                >
                  Test
                </button>
              </div>
              <div className="space-y-1 text-xs text-white/70">
                <div>Status: {dbStatus?.configured ? 'Configured' : 'Not Configured'}</div>
                <div>Connection: {dbStatus?.connectionString || 'N/A'}</div>
              </div>
            </div>

            {/* Schema Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/50">Schema:</span>
              <select
                value={selectedSchema}
                onChange={(e) => setSelectedSchema(e.target.value)}
                className="flex-1 text-xs bg-white/10 rounded px-2 py-1 outline-none"
                onFocus={loadSchemas}
              >
                <option value="USER">Current User</option>
                {schemas.map(schema => (
                  <option key={schema} value={schema}>{schema}</option>
                ))}
              </select>
              <button
                onClick={loadTables}
                className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded"
                disabled={loading}
              >
                Load Tables
              </button>
            </div>

            {/* Tables List */}
            <div className="space-y-1">
              <div className="text-xs font-medium mb-2">Tables</div>
              {loading && (
                <div className="text-xs text-white/50 flex items-center gap-2">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Loading...
                </div>
              )}
              {tables.map(table => (
                <div
                  key={table.TABLE_NAME}
                  className="flex items-center gap-2 p-2 hover:bg-white/5 rounded cursor-pointer text-xs"
                  onClick={() => describeTable(table.TABLE_NAME)}
                >
                  <Table className="h-3 w-3 text-orange-400" />
                  <span className="flex-1">{table.TABLE_NAME}</span>
                  <span className="text-white/50">{table.NUM_ROWS || 0} rows</span>
                </div>
              ))}
            </div>

            {/* Table Details */}
            {selectedTable && tableColumns.length > 0 && (
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-xs font-medium mb-2">{selectedTable} Columns</div>
                <div className="space-y-1">
                  {tableColumns.map(col => (
                    <div key={col.COLUMN_ID} className="flex items-center gap-2 text-xs">
                      <span className="text-orange-400">{col.COLUMN_NAME}</span>
                      <span className="text-white/50">{col.DATA_TYPE}({col.DATA_LENGTH})</span>
                      {col.NULLABLE === 'N' && (
                        <span className="text-red-400">NOT NULL</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'cloud' && (
          <div className="p-3 space-y-3">
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-xs font-medium mb-2">OCI Configuration</div>
              <div className="space-y-1 text-xs text-white/70">
                <div>Status: {ociStatus?.configured ? 'Configured' : 'Not Configured'}</div>
                <div>Region: {ociStatus?.region || 'N/A'}</div>
                <div>Tenancy: {ociStatus?.tenancy || 'N/A'}</div>
              </div>
            </div>

            {!ociStatus?.configured && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-xs">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <div>
                    <div className="font-medium mb-1">OCI Not Configured</div>
                    <div className="text-white/70">
                      Add the following to your .env.local file:
                    </div>
                    <pre className="mt-2 bg-black/30 p-2 rounded text-[10px]">
{`OCI_TENANCY=ocid1.tenancy.oc1..xxx
OCI_USER=ocid1.user.oc1..xxx
OCI_FINGERPRINT=xx:xx:xx:xx
OCI_PRIVATE_KEY_PATH=/path/to/key.pem
OCI_REGION=us-ashburn-1
OCI_COMPARTMENT_ID=ocid1.compartment.oc1..xxx`}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'query' && (
          <div className="p-3 space-y-3">
            {/* Query Editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">SQL Query</span>
                <button
                  onClick={executeQuery}
                  className="px-3 py-1 text-xs bg-orange-500 hover:bg-orange-600 rounded flex items-center gap-1"
                  disabled={loading || !dbStatus?.configured}
                >
                  <Play className="h-3 w-3" />
                  Execute
                </button>
              </div>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-32 bg-black/50 text-xs font-mono p-2 rounded border border-white/10 outline-none focus:border-orange-500/50"
                placeholder="Enter SQL query..."
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded p-2 text-xs text-red-400">
                {error}
              </div>
            )}

            {/* Query Results */}
            {queryResult && (
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-xs font-medium mb-2">
                  Results ({queryResult.rows?.length || 0} rows)
                </div>
                {queryResult.rows && queryResult.rows.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/10">
                          {queryResult.metaData?.map((col: any, i: number) => (
                            <th key={i} className="text-left p-1 font-medium">
                              {col.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {queryResult.rows.slice(0, 100).map((row: any, i: number) => (
                          <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                            {Object.values(row).map((val: any, j: number) => (
                              <td key={j} className="p-1 text-white/70">
                                {val !== null ? String(val) : 'NULL'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {queryResult.rows.length > 100 && (
                      <div className="text-center text-white/50 mt-2">
                        Showing first 100 rows of {queryResult.rows.length}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-white/10 text-[10px] text-white/50">
        {!dbStatus?.configured && (
          <div>
            Configure Oracle in .env.local: ORACLE_DB_USER, ORACLE_DB_PASSWORD, ORACLE_DB_CONNECTION_STRING
          </div>
        )}
      </div>
    </div>
  );
}