# AMS Success Diagnostic - Deployment Guide

## Production Build Created

Your production-ready files are located in the `publish` folder at:
```
c:\_data\repo\ams-success-diagnostic\publish\
```

## Pre-Deployment Checklist

### 1. Update Production Configuration

**CRITICAL:** Before uploading, update your Qualtrics API token in `appsettings.json`:

```json
{
  "Qualtrics": {
    "ApiToken": "YOUR_PRODUCTION_API_TOKEN_HERE",
    "DataCenter": "iad1",
    "SurveyId": "SV_1zyYQ9I5tRHvNNc"
  }
}
```

**Location:** `c:\_data\repo\ams-success-diagnostic\publish\appsettings.json`

### 2. Update Database Connection String (if different in production)

Update the connection string in `appsettings.json` if your production SQL Server is different:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_PROD_SERVER;Database=ams-success;User Id=YOUR_USER;Password=YOUR_PASSWORD;TrustServerCertificate=True;"
  }
}
```

## FTP Deployment Instructions

### Step 1: Verify Server Requirements

Your hosting server MUST have:
- ✅ **.NET 9.0 Runtime** installed (or ASP.NET Core 9.0 Hosting Bundle)
- ✅ **Windows Server** with IIS configured
- ✅ **SQL Server** accessible from the server

### Step 2: Upload Files via FTP

1. **Connect to your FTP server** using your FTP client (FileZilla, WinSCP, etc.)

2. **Upload ALL contents** of the `publish` folder to your web root directory:
   - Typically: `/wwwroot`, `/public_html`, or `/site/wwwroot`
   - Make sure to upload ALL files and folders including:
     - All `.dll` files
     - `web.config`
     - `wwwroot` folder (contains images, CSS, JS)
     - `runtimes` folder
     - All language folders (cs, de, es, fr, etc.)

3. **Set proper permissions** (if required by your host)

### Step 3: Configure IIS (if you have access)

If you have access to IIS Manager:

1. Create or use existing Application Pool:
   - .NET CLR Version: **No Managed Code**
   - Managed Pipeline Mode: **Integrated**

2. Create a new Website or Application:
   - Physical Path: Point to your uploaded files
   - Binding: Configure HTTP/HTTPS as needed

3. Ensure the Application Pool identity has:
   - Read/Write permissions to the application folder
   - Access to SQL Server

### Step 4: Configure web.config (Already Included)

The `web.config` file is automatically generated and should work out of the box. It contains:
- ASP.NET Core Module configuration
- Handler mappings
- Environment variables

**DO NOT MODIFY** unless you have specific hosting requirements.

## Testing Your Deployment

### 1. Test Basic Connectivity
Visit: `https://yourdomain.com/`

You should be redirected to the Index/Home page.

### 2. Test Results Page
Visit: `https://yourdomain.com/Results`

Should display default results (high performance tier).

### 3. Test Calculating Page
Visit: `https://yourdomain.com/Calculating`

Should show animated progress and redirect to Results.

### 4. Test Debug Page (Development Only - Consider Removing for Production)
Visit: `https://yourdomain.com/Debug?response=YOUR_RESPONSE_ID`

Should display Qualtrics API response data.

### 5. Test with Actual Qualtrics Response
Visit: `https://yourdomain.com/Calculating?response=R_XXXXXXXXXXXXX`

Replace with an actual response ID from your Qualtrics survey.

## Post-Deployment Configuration

### Security Recommendations

1. **Remove Debug Page for Production**
   - Delete `Debug.cshtml` and `Debug.cshtml.cs` from the published files
   - Or add authentication/authorization to protect it

2. **Secure appsettings.json**
   - Ensure API tokens are not exposed
   - Consider using environment variables or Azure Key Vault instead

3. **Enable HTTPS**
   - Configure SSL certificate in IIS
   - Redirect all HTTP traffic to HTTPS

4. **Configure CORS** (if needed)
   - Update `Program.cs` to allow specific origins only

### Environment Variables (Alternative to appsettings.json)

For better security, set these as environment variables in IIS:

```
Qualtrics__ApiToken=YOUR_API_TOKEN
Qualtrics__DataCenter=iad1
Qualtrics__SurveyId=SV_1zyYQ9I5tRHvNNc
ConnectionStrings__DefaultConnection=YOUR_CONNECTION_STRING
```

**Note:** Use double underscore `__` to represent nested configuration sections.

## Troubleshooting

### Issue: "HTTP Error 500.0 - ANCM In-Process Handler Load Failure"
**Solution:** Install the ASP.NET Core 9.0 Hosting Bundle on your server
- Download: https://dotnet.microsoft.com/download/dotnet/9.0

### Issue: "Could not load file or assembly"
**Solution:** Ensure ALL files were uploaded, including:
- All `.dll` files
- The `runtimes` folder with all platform-specific dependencies

### Issue: Database Connection Fails
**Solution:**
- Verify SQL Server is accessible from the web server
- Check connection string credentials
- Ensure firewall rules allow connection
- Add `TrustServerCertificate=True` to connection string if using self-signed certificate

### Issue: Images Not Loading
**Solution:**
- Verify `wwwroot` folder was uploaded with all contents
- Check that `wwwroot/img` contains all image files:
  - ams-diagnostic-header.png.png
  - summary.png
  - foundation.png
  - alignment.png
  - adoption.png
  - optimization.png
  - improvement.png
  - actionplan.png

### Issue: "404 Not Found" for Pages
**Solution:**
- Ensure `web.config` is present in the root directory
- Verify URL Rewrite module is installed in IIS
- Check that the ASP.NET Core Module is registered

## Updating the Application

To deploy updates:

1. Stop the application in IIS (if possible) to avoid file locking
2. Run `dotnet publish -c Release -o ../publish` again
3. Upload changed files via FTP
4. Restart the application pool in IIS

## Support

For issues specific to:
- **Qualtrics Integration**: See `QUALTRICS_SETUP.md`
- **Hosting/IIS**: Contact your hosting provider
- **Application Logic**: Review application logs in IIS

## Production Checklist

Before going live:

- [ ] Updated Qualtrics API token in appsettings.json
- [ ] Updated database connection string (if different)
- [ ] Uploaded all files from `publish` folder via FTP
- [ ] Verified .NET 9.0 runtime is installed on server
- [ ] Tested all pages (/, /Results, /Calculating)
- [ ] Tested with actual Qualtrics response ID
- [ ] Enabled HTTPS/SSL
- [ ] Removed or secured Debug page
- [ ] Configured proper error handling
- [ ] Set up application monitoring/logging
- [ ] Backed up the deployment

## Files to Upload

Upload EVERYTHING from the `publish` folder:
```
c:\_data\repo\ams-success-diagnostic\publish\
├── AmsDiagnostic.dll (and all other .dll files)
├── AmsDiagnostic.exe
├── appsettings.json ⚠️ UPDATE THIS FIRST!
├── web.config
├── wwwroot/
│   ├── img/
│   │   ├── All your image files
│   ├── vendor/
│   └── Other static assets
├── runtimes/ (platform-specific binaries)
└── All language folders (cs, de, es, fr, etc.)
```

## Additional Notes

- The application runs on **port 80 (HTTP)** or **443 (HTTPS)** by default
- Log files (if enabled) will be in the application directory or as configured
- Application pool should be set to **"No Managed Code"** for .NET Core/9.0
- Consider setting up **automated backups** of your database and files

---

**Ready to Deploy!** All files are in: `c:\_data\repo\ams-success-diagnostic\publish\`
