declare module 'oracledb' {
  export interface ConnectionAttributes {
    user: string;
    password: string;
    connectString: string;
  }

  export interface Connection {
    execute(sql: string, binds?: any, options?: any): Promise<any>;
    close(): Promise<void>;
  }

  export interface Pool {
    getConnection(): Promise<Connection>;
    close(): Promise<void>;
  }

  export const POOL_STATUS_OPEN: number;
  export const POOL_STATUS_DRAINING: number;
  export const POOL_STATUS_CLOSED: number;

  export function createPool(config: any): Promise<Pool>;
  export function getConnection(config: ConnectionAttributes): Promise<Connection>;
  
  export const poolMin: number;
  export const poolMax: number;
  export const poolIncrement: number;
}