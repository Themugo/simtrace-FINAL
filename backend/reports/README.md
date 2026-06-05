# Export & Reporting Engine

Export and reporting engine for PDF, CSV, XLSX formats, automated weekly risk reports, and recovery summaries.

## Features

- **Report Templates**: Create and manage report templates with parameters
- **Report Generation**: Generate reports in PDF, CSV, XLSX formats
- **Scheduled Reports**: Schedule reports to run automatically
- **Weekly Risk Reports**: Automated weekly risk analysis reports
- **Recovery Summaries**: Track device recovery summaries
- **Template Parameters**: Define parameters for dynamic report generation
- **Statistics**: Track report generation and recovery statistics

## Usage

### Create Report Template

```typescript
import { createReportTemplate } from './reports/index.js';

const template = createReportTemplate({
  name: 'Device Report',
  description: 'Comprehensive device report',
  type: 'device_report',
  format: 'pdf',
  template: '# Device Report\n\nGenerated on: {{date}}',
  parameters: [
    { name: 'date', type: 'date', required: true, defaultValue: new Date() },
    { name: 'totalDevices', type: 'number', required: true },
  ],
  schedule: {
    frequency: 'weekly',
    dayOfWeek: 1,
    time: '09:00',
    timezone: 'Africa/Nairobi',
  },
  enabled: true,
});
```

### Generate Report

```typescript
import { generateReport } from './reports/index.js';

const report = await generateReport('template_id', {
  date: new Date(),
  totalDevices: 100,
}, 'admin_456');

console.log('Report status:', report.status);
console.log('File URL:', report.fileUrl);
```

### Generate Weekly Risk Report

```typescript
import { generateWeeklyRiskReport } from './reports/index.js';

const weekStart = new Date('2024-01-01');
const report = generateWeeklyRiskReport(weekStart, 'org_123');

console.log('Total devices:', report.totalDevices);
console.log('High risk devices:', report.highRiskDevices);
console.log('Risk trends:', report.riskTrends);
```

### Create Recovery Summary

```typescript
import { createRecoverySummary } from './reports/index.js';

const summary = createRecoverySummary({
  deviceId: 'device_123',
  deviceName: 'Samsung Galaxy S21',
  imei: '123456789012345',
  reportedAt: new Date(),
  recoveryMethod: 'app',
  location: { lat: -1.2921, lng: 36.8219, address: 'Nairobi, Kenya' },
  evidenceCount: 5,
});
```

### Update Recovery Summary

```typescript
import { updateRecoverySummary } from './reports/index.js';

const updated = updateRecoverySummary('recovery_id', {
  recoveredAt: new Date(),
  recoveryTime: 48, // hours
  notes: 'Recovered via app tracking',
});
```

### Get Recovery Statistics

```typescript
import { getRecoveryStatistics } from './reports/index.js';

const stats = getRecoveryStatistics();
console.log('Total summaries:', stats.totalSummaries);
console.log('Recovered:', stats.recovered);
console.log('Pending:', stats.pending);
console.log('Avg recovery time:', stats.avgRecoveryTime);
console.log('By method:', stats.byMethod);
```

### Get Statistics

```typescript
import { getExportReportingStatistics } from './reports/index.js';

const stats = getExportReportingStatistics();
console.log('Total templates:', stats.totalTemplates);
console.log('Enabled templates:', stats.enabledTemplates);
console.log('Scheduled templates:', stats.scheduledTemplates);
console.log('Total reports:', stats.totalReports);
console.log('Completed reports:', stats.completedReports);
```

## Data Structures

### ReportTemplate

```typescript
interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'device_report' | 'risk_report' | 'recovery_report' | 'analytics_report' | 'custom';
  format: 'pdf' | 'csv' | 'xlsx';
  template: string;
  parameters: ReportParameter[];
  schedule?: ReportSchedule;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### ReportParameter

```typescript
interface ReportParameter {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'select';
  required: boolean;
  defaultValue?: any;
  options?: string[];
}
```

### ReportSchedule

```typescript
interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  timezone: string;
}
```

### GeneratedReport

```typescript
interface GeneratedReport {
  id: string;
  templateId: string;
  name: string;
  format: 'pdf' | 'csv' | 'xlsx';
  status: 'pending' | 'generating' | 'completed' | 'failed';
  parameters: Record<string, any>;
  generatedBy?: string;
  generatedAt?: Date;
  fileUrl?: string;
  fileSize?: number;
  error?: string;
  createdAt: Date;
}
```

### WeeklyRiskReport

```typescript
interface WeeklyRiskReport {
  id: string;
  weekStart: Date;
  weekEnd: Date;
  organizationId?: string;
  totalDevices: number;
  highRiskDevices: number;
  mediumRiskDevices: number;
  lowRiskDevices: number;
  riskTrends: {
    date: Date;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
  }[];
  topRiskFactors: {
    factor: string;
    count: number;
  }[];
  recoveredDevices: number;
  activeCases: number;
  generatedAt: Date;
}
```

### RecoverySummary

```typescript
interface RecoverySummary {
  id: string;
  deviceId: string;
  deviceName: string;
  imei: string;
  reportedAt: Date;
  recoveredAt?: Date;
  recoveryTime?: number;
  recoveryMethod?: 'app' | 'police' | 'telecom' | 'community' | 'ai';
  location?: { lat: number; lng: number; address?: string };
  evidenceCount: number;
  notes?: string;
}
```

## Report Formats

### PDF
- Professional document format
- Suitable for printing and sharing
- Supports rich formatting

### CSV
- Simple text format
- Compatible with spreadsheet applications
- Suitable for large datasets

### XLSX
- Excel spreadsheet format
- Supports multiple sheets
- Supports formulas and formatting

## Report Types

### Device Report
- Comprehensive device information
- Device status and activity
- Risk scores and alerts

### Risk Report
- Risk analysis and trends
- Top risk factors
- Risk distribution

### Recovery Report
- Recovery summaries
- Recovery statistics
- Recovery methods

### Analytics Report
- Usage analytics
- Performance metrics
- Trends and insights

## Report Scheduling

### Daily
- Runs every day at specified time

### Weekly
- Runs on specified day of week at specified time

### Monthly
- Runs on specified day of month at specified time

### Quarterly
- Runs every 3 months at specified time

## Production Integration

### PDF Generation with Puppeteer

```typescript
import puppeteer from 'puppeteer';

async function generatePDF(template: ReportTemplate, parameters: Record<string, any>): Promise<{ url: string; size: number }> {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const content = renderTemplate(template, parameters);
  await page.setContent(content);

  const pdf = await page.pdf({ format: 'A4' });
  await browser.close();

  const url = await uploadToStorage('report.pdf', pdf);
  return { url, size: pdf.length };
}
```

### CSV Generation

```typescript
import { Parser } from 'json2csv';

async function generateCSV(template: ReportTemplate, parameters: Record<string, any>): Promise<{ url: string; size: number }> {
  const data = getReportData(template, parameters);
  const parser = new Parser();
  const csv = parser.parse(data);

  const url = await uploadToStorage('report.csv', csv);
  return { url, size: csv.length };
}
```

### XLSX Generation with ExcelJS

```typescript
import ExcelJS from 'exceljs';

async function generateXLSX(template: ReportTemplate, parameters: Record<string, any>): Promise<{ url: string; size: number }> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Report');

  const data = getReportData(template, parameters);
  worksheet.columns = Object.keys(data[0]).map(key => ({ header: key, key }));
  worksheet.addRows(data);

  const buffer = await workbook.xlsx.writeBuffer();
  const url = await uploadToStorage('report.xlsx', buffer);

  return { url, size: buffer.length };
}
```

### Scheduled Report Generation

```typescript
import cron from 'node-cron';
import { exportReportingEngine } from './reports/index.js';

// Check for scheduled reports every minute
cron.schedule('* * * * *', async () => {
  const scheduledTemplates = exportReportingEngine.getScheduledTemplates();

  for (const template of scheduledTemplates) {
    if (shouldRunNow(template.schedule!)) {
      await exportReportingEngine.generateReport(template.id, {}, 'system');
    }
  }
});

function shouldRunNow(schedule: ReportSchedule): boolean {
  const now = new Date();
  // Check if current time matches schedule
  return true;
}
```

## Best Practices

1. **Templates**: Use clear, descriptive template names
2. **Parameters**: Define required parameters with defaults
3. **Scheduling**: Use appropriate timezones for scheduled reports
4. **Error Handling**: Handle report generation failures gracefully
5. **Storage**: Use secure, accessible storage for report files
6. **Cleanup**: Archive or delete old reports periodically
7. **Performance**: Use streaming for large report exports

## Performance Considerations

1. **Large Reports**: Use streaming for large datasets
2. **Concurrency**: Limit concurrent report generation
3. **Caching**: Cache report data when possible
4. **Storage**: Use CDN for report file distribution
5. **Queue**: Use job queue for scheduled reports

## Future Enhancements

- Add real-time report generation status
- Implement report sharing and collaboration
- Add custom report builder UI
- Implement report versioning
- Add report templates marketplace
- Implement real-time dashboard widgets
