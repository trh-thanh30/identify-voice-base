import { BaseClientError } from './base';

export class PayloadTooLargeError extends BaseClientError {
  constructor(
    message: string = 'Request body vượt quá giới hạn cho phép',
    code: string = 'PAYLOAD_TOO_LARGE',
    details: Record<string, unknown> = {},
  ) {
    super(message, 413, code, details);
  }
}

export default PayloadTooLargeError;
