# 🐳 Oracle Database 23ai Free - Docker Setup Guide

## Prerequisites

✅ **Docker Desktop is installed** (version 28.3.3 detected)  
❌ **Docker Desktop is not running** - Please start it first!

## Quick Start Instructions

### Step 1: Start Docker Desktop

1. **Open Docker Desktop** from your Start Menu or Desktop
2. Wait for Docker to fully start (whale icon in system tray should be steady)
3. Verify Docker is running:
   ```cmd
   docker ps
   ```

### Step 2: Run the Setup Script

Once Docker is running, execute the setup script:

```cmd
cd crowe-logic-platform
oracle-docker-setup.bat
```

This script will:
- Pull Oracle Database 23ai Free Lite image (833 MB)
- Create a persistent data directory at `C:\oracle-data`
- Start the container with password `Welcome123`
- Wait for the database to be ready

### Step 3: Update Your .env.local

After the container is running, update your `.env.local`:

```env
# Oracle Database Configuration
ORACLE_DB_USER=system
ORACLE_DB_PASSWORD=Welcome123
ORACLE_DB_CONNECTION_STRING=localhost:1521/FREE

# Or use the PDB (Pluggable Database) for better isolation:
# ORACLE_DB_CONNECTION_STRING=localhost:1521/FREEPDB1
```

### Step 4: Test the Connection

1. Restart your development server:
   ```cmd
   npm run dev
   ```

2. Open the IDE: http://localhost:3000/ide

3. Go to the Oracle panel and click "Test Connection"

## Manual Docker Commands

If you prefer to run commands manually:

### Pull the image:
```bash
docker pull container-registry.oracle.com/database/free:latest-lite
```

### Run Oracle container:
```bash
docker run -d ^
  --name oracle-free ^
  -p 1521:1521 ^
  -e ORACLE_PWD=Welcome123 ^
  -v C:\oracle-data:/opt/oracle/oradata ^
  container-registry.oracle.com/database/free:latest-lite
```

### Check container status:
```bash
docker ps
docker logs oracle-free
```

### Connect to database from container:
```bash
docker exec -it oracle-free sqlplus system/Welcome123@FREE
```

## Container Management

### Stop the container:
```bash
docker stop oracle-free
```

### Start the container:
```bash
docker start oracle-free
```

### Remove the container:
```bash
docker stop oracle-free
docker rm oracle-free
```

### View logs:
```bash
docker logs -f oracle-free
```

## Connection Details

Once the container is running:

| Property | Value |
|----------|-------|
| **Host** | localhost |
| **Port** | 1521 |
| **Service (CDB)** | FREE |
| **Service (PDB)** | FREEPDB1 |
| **Username** | system |
| **Password** | Welcome123 |
| **SYS Password** | Welcome123 |

### Connection Strings:

- **JDBC**: `jdbc:oracle:thin:@localhost:1521:FREE`
- **Node.js**: `localhost:1521/FREE`
- **SQL*Plus**: `system/Welcome123@//localhost:1521/FREE`

## Features Available

The Oracle Database 23ai Free container includes:
- ✅ Full SQL and PL/SQL support
- ✅ JSON, XML, and spatial data
- ✅ Partitioning (basic)
- ✅ Advanced analytics
- ✅ Machine learning algorithms
- ✅ 2 CPUs, 2 GB RAM limit
- ✅ 12 GB data storage limit

## Troubleshooting

### Docker not starting?
1. Check if virtualization is enabled in BIOS
2. Enable Hyper-V in Windows Features
3. Restart your computer

### Container won't start?
```bash
# Check logs
docker logs oracle-free

# Check if port 1521 is already in use
netstat -an | findstr :1521
```

### Can't connect to database?
1. Wait 2-3 minutes after container starts
2. Check container health:
   ```bash
   docker ps --format "table {{.Names}}\t{{.Status}}"
   ```
3. Look for "(healthy)" status

### Performance issues?
- Allocate more resources in Docker Desktop settings
- Use the full image instead of lite for better performance
- Consider using Oracle Instant Client thick mode

## Useful SQL Commands

Once connected, try these:

```sql
-- Check database version
SELECT * FROM v$version;

-- List all users
SELECT username FROM all_users ORDER BY username;

-- Create a test table
CREATE TABLE test_table (
    id NUMBER PRIMARY KEY,
    name VARCHAR2(100),
    created_date DATE DEFAULT SYSDATE
);

-- Insert test data
INSERT INTO test_table (id, name) VALUES (1, 'Test from Docker');
COMMIT;

-- Check tablespaces
SELECT tablespace_name, status FROM dba_tablespaces;
```

## Next Steps

1. **Start Docker Desktop** 
2. **Run the setup script**: `oracle-docker-setup.bat`
3. **Update .env.local** with connection details
4. **Test in the IDE** at http://localhost:3000/ide
5. **Create your schema** and start developing!

## Resources

- [Oracle Database 23ai Documentation](https://docs.oracle.com/en/database/oracle/oracle-database/23/)
- [Docker Hub - Oracle Database](https://container-registry.oracle.com/)
- [Oracle SQL Developer](https://www.oracle.com/database/sqldeveloper/)
- [Oracle Live SQL](https://livesql.oracle.com/) - Try SQL online