# Oracle Integration Setup Guide

## ✅ Installation Status

Oracle Instant Client has been successfully installed and configured!

- **Version**: 23.9
- **Location**: `C:\Users\micha\oracle\instantclient_23_9`
- **PATH**: Configured ✓

## 📋 Next Steps

### 1. Configure Your Oracle Database Connection

Edit `.env.local` and update these values with your Oracle credentials:

```env
ORACLE_DB_USER=your_username
ORACLE_DB_PASSWORD=your_password
ORACLE_DB_CONNECTION_STRING=hostname:1521/servicename
```

### 2. Connection String Examples

#### Local Oracle Database:
```
ORACLE_DB_CONNECTION_STRING=localhost:1521/ORCL
```

#### Oracle Cloud Autonomous Database:
```
ORACLE_DB_CONNECTION_STRING=(description=(retry_count=20)(retry_delay=3)(address=(protocol=tcps)(port=1522)(host=adb.us-ashburn-1.oraclecloud.com))(connect_data=(service_name=xxxxx_high.adb.oraclecloud.com))(security=(ssl_server_dn_match=yes)))
```

#### Oracle on Remote Server:
```
ORACLE_DB_CONNECTION_STRING=192.168.1.100:1521/PRODDB
```

### 3. For Oracle Cloud Autonomous Database

If using Oracle Autonomous Database, you need to:

1. Download your wallet from OCI Console:
   - Go to your Autonomous Database
   - Click "Database Connection"
   - Download Client Credentials (Wallet)

2. Extract the wallet to: `C:\Users\micha\oracle\wallet`

3. Add to `.env.local`:
   ```env
   TNS_ADMIN=C:\Users\micha\oracle\wallet
   ```

### 4. Test Your Connection

1. Restart the development server:
   ```bash
   cd crowe-logic-platform
   npm run dev
   ```

2. Open the IDE: http://localhost:3000/ide

3. Look for the Oracle panel in your IDE

4. Click "Test Connection" to verify

## 🔧 Troubleshooting

### Common Issues:

1. **"ORA-12154: TNS:could not resolve the connect identifier"**
   - Check your connection string format
   - For cloud databases, ensure wallet is extracted

2. **"ORA-01017: invalid username/password"**
   - Verify credentials in `.env.local`
   - Check if password contains special characters (may need escaping)

3. **"Cannot find module 'oracledb'"**
   - Run: `npm install oracledb`

4. **Visual C++ Redistributable Error**
   - Download and install: [Microsoft Visual C++ Redistributable](https://aka.ms/vs/17/release/vc_redist.x64.exe)

## 📊 Available Features

Once connected, you can:

- ✅ Browse database schemas and tables
- ✅ Execute SQL queries
- ✅ View table structures and data
- ✅ Manage Oracle Cloud resources (if OCI is configured)
- ✅ Export query results
- ✅ View execution plans
- ✅ Monitor database performance

## 🔗 Useful Links

- [Oracle Instant Client Downloads](https://www.oracle.com/database/technologies/instant-client.html)
- [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/)
- [Node-oracledb Documentation](https://oracle.github.io/node-oracledb/)
- [Oracle Database Documentation](https://docs.oracle.com/en/database/)

## 💡 Tips

1. **Performance**: The thick mode (with Instant Client) is faster than thin mode
2. **Security**: Never commit `.env.local` to git
3. **Connection Pooling**: Adjust pool settings based on your workload
4. **Wallet Security**: Keep your wallet files secure and never share them

## 📞 Support

For Oracle-specific issues:
- [Oracle Support](https://support.oracle.com/)
- [Oracle Community](https://community.oracle.com/)

For platform issues:
- Create an issue in your repository
- Check the logs in the terminal