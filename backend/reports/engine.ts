// ── Export & Reporting Engine ───────────────────────────────────────────────────
// PDF, CSV, XLSX, automated weekly risk reports, recovery summaries

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'device_report' | 'risk_report' | 'recovery_report' | 'analytics_report' | 'custom';
  format: 'pdf' | 'csv' | 'xlsx';
  template: string; // Template content or reference
  parameters: ReportParameter[];
  schedule?: ReportSchedule;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportParameter {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'select';
  required: boolean;
  defaultValue?: any;
  options?: string[];
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dayOfWeek?: number; // 0-6
  dayOfMonth?: number; // 1-31
  time: string; // HH:MM
  timezone: string;
}

export interface GeneratedReport {
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

export interface WeeklyRiskReport {
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

export interface RecoverySummary {
  id: string;
  deviceId: string;
  deviceName: string;
  imei: string;
  reportedAt: Date;
  recoveredAt?: Date;
  recoveryTime?: number; // in hours
  recoveryMethod?: 'app' | 'police' | 'telecom' | 'community' | 'ai';
  location?: { lat: number; lng: number; address?: string };
  evidenceCount: number;
  notes?: string;
}

class ExportReportingEngine {
  private templates: Map<string, ReportTemplate> = new Map();
  private reports: Map<string, GeneratedReport> = new Map();
  private weeklyRiskReports: Map<string, WeeklyRiskReport> = new Map();
  private recoverySummaries: Map<string, RecoverySummary> = new Map();

  // Create report template
  createReportTemplate(template: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>): ReportTemplate {
    const reportTemplate: ReportTemplate = {
      ...template,
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.templates.set(reportTemplate.id, reportTemplate);
    return reportTemplate;
  }

  // Update report template
  updateReportTemplate(templateId: string, updates: Partial<Omit<ReportTemplate, 'id' | 'createdAt'>>): ReportTemplate | null {
    const template = this.templates.get(templateId);
    if (!template) return null;

    Object.assign(template, updates);
    template.updatedAt = new Date();
    return template;
  }

  // Get report template
  getReportTemplate(templateId: string): ReportTemplate | undefined {
    return this.templates.get(templateId);
  }

  // Get all report templates
  getAllReportTemplates(): ReportTemplate[] {
    return Array.from(this.templates.values());
  }

  // Get scheduled templates
  getScheduledTemplates(): ReportTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.schedule && t.enabled);
  }

  // Generate report
  async generateReport(templateId: string, parameters: Record<string, any>, generatedBy?: string): Promise<GeneratedReport> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const report: GeneratedReport = {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      templateId,
      name: template.name,
      format: template.format,
      status: 'generating',
      parameters,
      generatedBy,
      createdAt: new Date(),
    };

    this.reports.set(report.id, report);

    try {
      // Generate report based on format
      let fileUrl: string;
      let fileSize: number;

      switch (template.format) {
        case 'pdf':
          const pdfResult = await this.generatePDF(template, parameters);
          fileUrl = pdfResult.url;
          fileSize = pdfResult.size;
          break;
        case 'csv':
          const csvResult = await this.generateCSV(template, parameters);
          fileUrl = csvResult.url;
          fileSize = csvResult.size;
          break;
        case 'xlsx':
          const xlsxResult = await this.generateXLSX(template, parameters);
          fileUrl = xlsxResult.url;
          fileSize = xlsxResult.size;
          break;
        default:
          throw new Error('Unsupported format');
      }

      report.status = 'completed';
      report.generatedAt = new Date();
      report.fileUrl = fileUrl;
      report.fileSize = fileSize;
    } catch (error) {
      report.status = 'failed';
      report.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return report;
  }

  // Generate PDF
  private async generatePDF(template: ReportTemplate, parameters: Record<string, any>): Promise<{ url: string; size: number }> {
    // In production, use PDF generation library (e.g., pdfkit, puppeteer)
    // Simulated implementation
    const content = this.renderTemplate(template, parameters);
    const url = `https://storage.example.com/reports/${Date.now()}.pdf`;
    const size = content.length;

    return { url, size };
  }

  // Generate CSV
  private async generateCSV(template: ReportTemplate, parameters: Record<string, any>): Promise<{ url: string; size: number }> {
    // In production, use CSV generation library
    // Simulated implementation
    const data = this.getReportData(template, parameters);
    const csv = this.convertToCSV(data);
    const url = `https://storage.example.com/reports/${Date.now()}.csv`;
    const size = csv.length;

    return { url, size };
  }

  // Generate XLSX
  private async generateXLSX(_template: ReportTemplate, _parameters: Record<string, any>): Promise<{ url: string; size: number }> {
    // In production, use XLSX generation library (e.g., exceljs)
    // Simulated implementation
    const url = `https://storage.example.com/reports/${Date.now()}.xlsx`;
    const size = 1024;

    return { url, size };
  }

  // Render template
  private renderTemplate(template: ReportTemplate, parameters: Record<string, any>): string {
    // In production, use template engine (e.g., handlebars, ejs)
    let content = template.template;

    for (const [key, value] of Object.entries(parameters)) {
      content = content.replace(`{{${key}}}`, String(value));
    }

    return content;
  }

  // Get report data
  private getReportData(_template: ReportTemplate, _parameters: Record<string, any>): any[] {
    // In production, query database based on template type and parameters
    return [
      { id: 1, name: 'Device 1', risk: 'high' },
      { id: 2, name: 'Device 2', risk: 'medium' },
    ];
  }

  // Convert to CSV
  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(header => row[header]).join(','));
    return [headers.join(','), ...rows].join('\n');
  }

  // Get generated report
  getGeneratedReport(reportId: string): GeneratedReport | undefined {
    return this.reports.get(reportId);
  }

  // Get reports by template
  getReportsByTemplate(templateId: string): GeneratedReport[] {
    return Array.from(this.reports.values()).filter(r => r.templateId === templateId);
  }

  // Get reports by status
  getReportsByStatus(status: GeneratedReport['status']): GeneratedReport[] {
    return Array.from(this.reports.values()).filter(r => r.status === status);
  }

  // Get all generated reports
  getAllGeneratedReports(): GeneratedReport[] {
    return Array.from(this.reports.values());
  }

  // Generate weekly risk report
  generateWeeklyRiskReport(weekStart: Date, organizationId?: string): WeeklyRiskReport {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const report: WeeklyRiskReport = {
      id: `risk_report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      weekStart,
      weekEnd,
      organizationId,
      totalDevices: 100,
      highRiskDevices: 15,
      mediumRiskDevices: 30,
      lowRiskDevices: 55,
      riskTrends: [
        { date: weekStart, highRisk: 12, mediumRisk: 28, lowRisk: 60 },
        { date: new Date(weekStart.getTime() + 86400000), highRisk: 13, mediumRisk: 29, lowRisk: 58 },
        { date: new Date(weekStart.getTime() + 172800000), highRisk: 14, mediumRisk: 30, lowRisk: 56 },
        { date: new Date(weekStart.getTime() + 259200000), highRisk: 15, mediumRisk: 30, lowRisk: 55 },
      ],
      topRiskFactors: [
        { factor: 'SIM swap', count: 8 },
        { factor: 'Rooted device', count: 5 },
        { factor: 'Impossible travel', count: 3 },
      ],
      recoveredDevices: 12,
      activeCases: 23,
      generatedAt: new Date(),
    };

    this.weeklyRiskReports.set(report.id, report);
    return report;
  }

  // Get weekly risk report
  getWeeklyRiskReport(reportId: string): WeeklyRiskReport | undefined {
    return this.weeklyRiskReports.get(reportId);
  }

  // Get weekly risk reports by organization
  getWeeklyRiskReportsByOrganization(organizationId: string): WeeklyRiskReport[] {
    return Array.from(this.weeklyRiskReports.values()).filter(r => r.organizationId === organizationId);
  }

  // Create recovery summary
  createRecoverySummary(summary: Omit<RecoverySummary, 'id'>): RecoverySummary {
    const recoverySummary: RecoverySummary = {
      ...summary,
      id: `recovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    this.recoverySummaries.set(recoverySummary.id, recoverySummary);
    return recoverySummary;
  }

  // Update recovery summary
  updateRecoverySummary(summaryId: string, updates: Partial<Omit<RecoverySummary, 'id'>>): RecoverySummary | null {
    const summary = this.recoverySummaries.get(summaryId);
    if (!summary) return null;

    Object.assign(summary, updates);
    return summary;
  }

  // Get recovery summary
  getRecoverySummary(summaryId: string): RecoverySummary | undefined {
    return this.recoverySummaries.get(summaryId);
  }

  // Get recovery summaries by device
  getRecoverySummariesByDevice(deviceId: string): RecoverySummary[] {
    return Array.from(this.recoverySummaries.values()).filter(r => r.deviceId === deviceId);
  }

  // Get all recovery summaries
  getAllRecoverySummaries(): RecoverySummary[] {
    return Array.from(this.recoverySummaries.values());
  }

  // Get recovery statistics
  getRecoveryStatistics(): {
    totalSummaries: number;
    recovered: number;
    pending: number;
    avgRecoveryTime: number;
    byMethod: Record<string, number>;
  } {
    const summaries = Array.from(this.recoverySummaries.values());
    const recovered = summaries.filter(s => s.recoveredAt).length;
    const pending = summaries.filter(s => !s.recoveredAt).length;
    const recoveredWithTime = summaries.filter(s => s.recoveryTime);
    const avgRecoveryTime = recoveredWithTime.length > 0
      ? recoveredWithTime.reduce((sum, s) => sum + (s.recoveryTime || 0), 0) / recoveredWithTime.length
      : 0;

    const byMethod: Record<string, number> = {};
    for (const summary of summaries) {
      if (summary.recoveryMethod) {
        byMethod[summary.recoveryMethod] = (byMethod[summary.recoveryMethod] || 0) + 1;
      }
    }

    return {
      totalSummaries: this.recoverySummaries.size,
      recovered,
      pending,
      avgRecoveryTime,
      byMethod,
    };
  }

  // Get statistics
  getStatistics(): {
    totalTemplates: number;
    enabledTemplates: number;
    scheduledTemplates: number;
    totalReports: number;
    completedReports: number;
    failedReports: number;
    totalWeeklyRiskReports: number;
    totalRecoverySummaries: number;
  } {
    return {
      totalTemplates: this.templates.size,
      enabledTemplates: Array.from(this.templates.values()).filter(t => t.enabled).length,
      scheduledTemplates: this.getScheduledTemplates().length,
      totalReports: this.reports.size,
      completedReports: Array.from(this.reports.values()).filter(r => r.status === 'completed').length,
      failedReports: Array.from(this.reports.values()).filter(r => r.status === 'failed').length,
      totalWeeklyRiskReports: this.weeklyRiskReports.size,
      totalRecoverySummaries: this.recoverySummaries.size,
    };
  }

  // Initialize default templates
  initializeDefaultTemplates(): void {
    // Device report template
    this.createReportTemplate({
      name: 'Device Report',
      description: 'Comprehensive device report',
      type: 'device_report',
      format: 'pdf',
      template: '# Device Report\n\nGenerated on: {{date}}\n\nTotal Devices: {{totalDevices}}',
      parameters: [
        { name: 'date', type: 'date', required: true, defaultValue: new Date() },
        { name: 'totalDevices', type: 'number', required: true },
      ],
      enabled: true,
    });

    // Risk report template
    this.createReportTemplate({
      name: 'Risk Report',
      description: 'Risk analysis report',
      type: 'risk_report',
      format: 'xlsx',
      template: 'Risk Report',
      parameters: [
        { name: 'startDate', type: 'date', required: true },
        { name: 'endDate', type: 'date', required: true },
      ],
      schedule: {
        frequency: 'weekly',
        dayOfWeek: 1, // Monday
        time: '09:00',
        timezone: 'Africa/Nairobi',
      },
      enabled: true,
    });

    // Recovery summary template
    this.createReportTemplate({
      name: 'Recovery Summary',
      description: 'Device recovery summary',
      type: 'recovery_report',
      format: 'csv',
      template: 'Recovery Summary',
      parameters: [
        { name: 'deviceId', type: 'string', required: true },
      ],
      enabled: true,
    });
  }
}

// Singleton instance
export const exportReportingEngine = new ExportReportingEngine();

// Initialize default templates
exportReportingEngine.initializeDefaultTemplates();

// ── Convenience Functions ───────────────────────────────────────────────────────
export function createReportTemplate(template: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>): ReportTemplate {
  return exportReportingEngine.createReportTemplate(template);
}

export async function generateReport(templateId: string, parameters: Record<string, any>, generatedBy?: string): Promise<GeneratedReport> {
  return exportReportingEngine.generateReport(templateId, parameters, generatedBy);
}

export function generateWeeklyRiskReport(weekStart: Date, organizationId?: string): WeeklyRiskReport {
  return exportReportingEngine.generateWeeklyRiskReport(weekStart, organizationId);
}

export function createRecoverySummary(summary: Omit<RecoverySummary, 'id'>): RecoverySummary {
  return exportReportingEngine.createRecoverySummary(summary);
}

export function updateRecoverySummary(summaryId: string, updates: Partial<Omit<RecoverySummary, 'id'>>): RecoverySummary | null {
  return exportReportingEngine.updateRecoverySummary(summaryId, updates);
}

export function getRecoveryStatistics() {
  return exportReportingEngine.getRecoveryStatistics();
}

export function getExportReportingStatistics() {
  return exportReportingEngine.getStatistics();
}
