'use client';

export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  public readonly context: SecurityRuleContext;
  private readonly rawMessage: string = 'FirestoreError: Missing or insufficient permissions';

  constructor(context: SecurityRuleContext) {
    super();
    this.context = context;
    this.name = 'FirestorePermissionError';
    this.message = `${this.rawMessage}: The following request was denied by Firestore Security Rules:\n${this.getFormattedContext()}`;
    Object.setPrototypeOf(this, FirestorePermissionError.prototype);
  }

  private getFormattedContext(): string {
    return JSON.stringify(this.context, null, 2);
  }
}
