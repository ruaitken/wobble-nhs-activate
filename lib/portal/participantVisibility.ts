export type ReportingConsent = {
  consented: boolean;
  withdrawn_at: string | null;
} | null;

export function isNamedReportingVisible(consent: ReportingConsent) {
  return Boolean(consent?.consented) && !consent?.withdrawn_at;
}

export function countHiddenParticipants(enrolled: number, shown: number) {
  return Math.max(0, enrolled - shown);
}
