export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface EmailSendResult {
  id?: string;
}

/** Pluggable email provider (PRD §6.1 provider layer). */
export interface EmailProvider {
  readonly name: string;
  send(params: SendEmailParams): Promise<EmailSendResult>;
}
