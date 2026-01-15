import { test } from '@playwright/test';
import { getReportGenerator } from './sanctuary/fixtures/report-generator';

test('Generate Sanctuary Test Report', async () => {
  const report = getReportGenerator('http://localhost:3002');

  // Save the report
  await report.saveReport('e2e/reports/sanctuary-report.md');

  console.log('\n========================================');
  console.log('  Sanctuary Test Report Generated!');
  console.log('  Location: e2e/reports/sanctuary-report.md');
  console.log('========================================\n');
});
