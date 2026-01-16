import * as fs from 'fs';
import * as path from 'path';

/**
 * Report Generator for Sanctuary Tests
 * Generates a comprehensive markdown report of test results
 */

export interface TestResult {
  suite: string;
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  screenshots: string[];
  notes?: string[];
}

export interface IndexedDBInspection {
  timestamp: number;
  databaseExists: boolean;
  tables: string[];
  sanctuaryRecord: {
    exists: boolean;
    blobLength?: number;
    blobFormat?: string;
    updatedAt?: number;
  };
  encryptionAnalysis?: {
    formatValid: boolean;
    ivBytes?: number;
    authTagBytes?: number;
    dataBytes?: number;
    containsPlaintext: boolean;
    errors: string[];
  };
}

export interface NetworkAnalysis {
  totalRequests: number;
  sanctuaryApiCalls: number;
  piiInUrls: boolean;
  sensitiveDataExposed: string[];
}

export interface ReportData {
  generatedAt: Date;
  environment: string;
  testResults: TestResult[];
  indexedDBInspections: IndexedDBInspection[];
  networkAnalysis?: NetworkAnalysis;
  screenshots: { path: string; description: string }[];
  errors: { test: string; error: string; suggestion?: string }[];
}

class SanctuaryReportGenerator {
  private data: ReportData;

  constructor(environment: string = 'http://localhost:3002') {
    this.data = {
      generatedAt: new Date(),
      environment,
      testResults: [],
      indexedDBInspections: [],
      screenshots: [],
      errors: []
    };
  }

  addTestResult(result: TestResult): void {
    this.data.testResults.push(result);
    if (result.status === 'failed' && result.error) {
      this.data.errors.push({
        test: `${result.suite} > ${result.name}`,
        error: result.error
      });
    }
  }

  addIndexedDBInspection(inspection: IndexedDBInspection): void {
    this.data.indexedDBInspections.push(inspection);
  }

  addNetworkAnalysis(analysis: NetworkAnalysis): void {
    this.data.networkAnalysis = analysis;
  }

  addScreenshot(screenshotPath: string, description: string): void {
    this.data.screenshots.push({ path: screenshotPath, description });
  }

  addError(test: string, error: string, suggestion?: string): void {
    this.data.errors.push({ test, error, suggestion });
  }

  private getSummary(): { passed: number; failed: number; skipped: number; total: number } {
    const passed = this.data.testResults.filter(r => r.status === 'passed').length;
    const failed = this.data.testResults.filter(r => r.status === 'failed').length;
    const skipped = this.data.testResults.filter(r => r.status === 'skipped').length;
    return { passed, failed, skipped, total: this.data.testResults.length };
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  generateMarkdown(): string {
    const summary = this.getSummary();
    const lines: string[] = [];

    // Header
    lines.push('# Kingdom Mind Sanctuary Test Report');
    lines.push('');
    lines.push(`**Generated:** ${this.data.generatedAt.toISOString()}`);
    lines.push(`**Environment:** ${this.data.environment}`);
    lines.push('');

    // Summary Table
    lines.push('## Summary');
    lines.push('');
    lines.push('| Status | Count |');
    lines.push('|--------|-------|');
    lines.push(`| Passed | ${summary.passed} |`);
    lines.push(`| Failed | ${summary.failed} |`);
    lines.push(`| Skipped | ${summary.skipped} |`);
    lines.push(`| **Total** | **${summary.total}** |`);
    lines.push('');

    // Overall Status
    if (summary.failed === 0) {
      lines.push('### Overall Status: PASSED');
    } else {
      lines.push('### Overall Status: FAILED');
    }
    lines.push('');

    // Test Results by Suite
    lines.push('## Test Results');
    lines.push('');

    const suites = [...new Set(this.data.testResults.map(r => r.suite))];
    for (const suite of suites) {
      lines.push(`### ${suite}`);
      lines.push('');

      const suiteResults = this.data.testResults.filter(r => r.suite === suite);
      for (const result of suiteResults) {
        const statusIcon = result.status === 'passed' ? '[PASS]' :
                          result.status === 'failed' ? '[FAIL]' : '[SKIP]';
        const statusColor = result.status === 'passed' ? '' :
                           result.status === 'failed' ? ' **FAILED**' : '';

        lines.push(`- ${statusIcon} ${result.name} (${this.formatDuration(result.duration)})${statusColor}`);

        if (result.error) {
          lines.push(`  - Error: \`${result.error}\``);
        }

        if (result.screenshots.length > 0) {
          for (const screenshot of result.screenshots) {
            const relativePath = screenshot.replace(/^e2e\//, './');
            lines.push(`  - Screenshot: [View](${relativePath})`);
          }
        }

        if (result.notes && result.notes.length > 0) {
          for (const note of result.notes) {
            lines.push(`  - Note: ${note}`);
          }
        }
      }
      lines.push('');
    }

    // IndexedDB Inspection
    if (this.data.indexedDBInspections.length > 0) {
      lines.push('## IndexedDB Inspection');
      lines.push('');

      for (let i = 0; i < this.data.indexedDBInspections.length; i++) {
        const inspection = this.data.indexedDBInspections[i];
        lines.push(`### Inspection #${i + 1}`);
        lines.push(`**Timestamp:** ${new Date(inspection.timestamp).toISOString()}`);
        lines.push('');

        lines.push('#### Database Status');
        lines.push(`- Database Exists: ${inspection.databaseExists ? 'YES' : 'NO'}`);
        lines.push(`- Tables: ${inspection.tables.join(', ') || 'None'}`);
        lines.push('');

        lines.push('#### Sanctuary Table');
        lines.push('| Field | Value |');
        lines.push('|-------|-------|');
        lines.push(`| Record Exists | ${inspection.sanctuaryRecord.exists ? 'YES' : 'NO'} |`);
        if (inspection.sanctuaryRecord.exists) {
          lines.push(`| Blob Length | ${inspection.sanctuaryRecord.blobLength} chars |`);
          lines.push(`| Blob Format | ${inspection.sanctuaryRecord.blobFormat || 'N/A'} |`);
          lines.push(`| Updated At | ${inspection.sanctuaryRecord.updatedAt ? new Date(inspection.sanctuaryRecord.updatedAt).toISOString() : 'N/A'} |`);
        }
        lines.push('');

        if (inspection.encryptionAnalysis) {
          lines.push('#### Encryption Analysis');
          lines.push('| Check | Result |');
          lines.push('|-------|--------|');
          lines.push(`| Format Valid | ${inspection.encryptionAnalysis.formatValid ? 'YES' : 'NO'} |`);
          lines.push(`| IV Size | ${inspection.encryptionAnalysis.ivBytes} bytes |`);
          lines.push(`| Auth Tag Size | ${inspection.encryptionAnalysis.authTagBytes} bytes |`);
          lines.push(`| Data Size | ${inspection.encryptionAnalysis.dataBytes} bytes |`);
          lines.push(`| Contains Plaintext | ${inspection.encryptionAnalysis.containsPlaintext ? 'YES (BAD!)' : 'NO (GOOD)'} |`);

          if (inspection.encryptionAnalysis.errors.length > 0) {
            lines.push('');
            lines.push('**Errors:**');
            for (const error of inspection.encryptionAnalysis.errors) {
              lines.push(`- ${error}`);
            }
          }
          lines.push('');
        }
      }
    }

    // Network Analysis
    if (this.data.networkAnalysis) {
      lines.push('## Network Analysis');
      lines.push('');
      lines.push('| Metric | Value |');
      lines.push('|--------|-------|');
      lines.push(`| Total Requests | ${this.data.networkAnalysis.totalRequests} |`);
      lines.push(`| Sanctuary API Calls | ${this.data.networkAnalysis.sanctuaryApiCalls} |`);
      lines.push(`| PII in URLs | ${this.data.networkAnalysis.piiInUrls ? 'YES (BAD!)' : 'NO (GOOD)'} |`);

      if (this.data.networkAnalysis.sensitiveDataExposed.length > 0) {
        lines.push('');
        lines.push('**Sensitive Data Exposed:**');
        for (const data of this.data.networkAnalysis.sensitiveDataExposed) {
          lines.push(`- ${data}`);
        }
      }
      lines.push('');
    }

    // Screenshots Gallery
    if (this.data.screenshots.length > 0) {
      lines.push('## Screenshots Gallery');
      lines.push('');

      for (const screenshot of this.data.screenshots) {
        const relativePath = screenshot.path.replace(/^e2e\//, './');
        lines.push(`### ${screenshot.description}`);
        lines.push(`![${screenshot.description}](${relativePath})`);
        lines.push('');
      }
    }

    // Errors Section
    if (this.data.errors.length > 0) {
      lines.push('## Errors Encountered');
      lines.push('');

      for (const error of this.data.errors) {
        lines.push(`### ${error.test}`);
        lines.push('```');
        lines.push(error.error);
        lines.push('```');
        if (error.suggestion) {
          lines.push(`**Suggested Fix:** ${error.suggestion}`);
        }
        lines.push('');
      }
    }

    // Footer
    lines.push('---');
    lines.push('');
    lines.push('*Report generated by Kingdom Mind Sanctuary Test Suite*');
    lines.push('');

    return lines.join('\n');
  }

  async saveReport(outputPath: string = 'e2e/reports/sanctuary-report.md'): Promise<void> {
    const markdown = this.generateMarkdown();
    const dir = path.dirname(outputPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, markdown, 'utf-8');
    console.log(`Report saved to: ${outputPath}`);
  }

  getData(): ReportData {
    return this.data;
  }
}

// File-based storage for collecting results across test processes
const RESULTS_FILE = 'e2e/reports/.test-results.json';

function loadResultsFromFile(): ReportData | null {
  try {
    if (fs.existsSync(RESULTS_FILE)) {
      const content = fs.readFileSync(RESULTS_FILE, 'utf-8');
      const data = JSON.parse(content);
      data.generatedAt = new Date(data.generatedAt);
      return data;
    }
  } catch (error) {
    console.error('Failed to load results file:', error);
  }
  return null;
}

function saveResultsToFile(data: ReportData): void {
  try {
    const dir = path.dirname(RESULTS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save results file:', error);
  }
}

// Factory function that loads existing data or creates new
export function getReportGenerator(environment?: string): SanctuaryReportGenerator {
  const existingData = loadResultsFromFile();
  const generator = new SanctuaryReportGenerator(environment);

  if (existingData) {
    // Merge existing data
    generator['data'].testResults = existingData.testResults;
    generator['data'].indexedDBInspections = existingData.indexedDBInspections;
    generator['data'].screenshots = existingData.screenshots;
    generator['data'].errors = existingData.errors;
    generator['data'].networkAnalysis = existingData.networkAnalysis;
  }

  // Override addTestResult to also save to file
  const originalAddResult = generator.addTestResult.bind(generator);
  generator.addTestResult = function(result: TestResult) {
    originalAddResult(result);
    saveResultsToFile(generator.getData());
  };

  const originalAddInspection = generator.addIndexedDBInspection.bind(generator);
  generator.addIndexedDBInspection = function(inspection: IndexedDBInspection) {
    originalAddInspection(inspection);
    saveResultsToFile(generator.getData());
  };

  const originalAddScreenshot = generator.addScreenshot.bind(generator);
  generator.addScreenshot = function(screenshotPath: string, description: string) {
    originalAddScreenshot(screenshotPath, description);
    saveResultsToFile(generator.getData());
  };

  return generator;
}

export function resetReportGenerator(): void {
  // Clear the results file
  try {
    if (fs.existsSync(RESULTS_FILE)) {
      fs.unlinkSync(RESULTS_FILE);
    }
  } catch (error) {
    console.error('Failed to clear results file:', error);
  }
}

export { SanctuaryReportGenerator };
