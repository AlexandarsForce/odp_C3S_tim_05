import { IAuditService } from "../../Domain/services/audit/IAuditService";

/**
 * Cross-cutting audit concern.
 * Holds optional IAuditService reference and exposes a safe log() wrapper.
 */
export class DbAuditIntegration {
  private auditService: IAuditService | null = null;

  public setAuditService(service: IAuditService): void {
    this.auditService = service;
  }

  public async log(entry: { action: string; details: string }): Promise<void> {
    await this.auditService?.log(entry);
  }
}
