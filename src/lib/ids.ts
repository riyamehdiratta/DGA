let counter = 0;

export function generateId(prefix: string): string {
  counter += 1;
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 7);
  return `${prefix}-${time}-${rand}-${counter}`;
}

export function generateAnalysisId(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 9000 + 1000);
  return `AN-${year}-${seq}`;
}

export function generateReportId(analysisId: string): string {
  return analysisId.replace('AN-', 'RPT-');
}
