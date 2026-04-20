export const InquiryStatus = {
  PENDING: 'pending',
  ANSWERED: 'answered',
} as const;

export type InquiryStatus = (typeof InquiryStatus)[keyof typeof InquiryStatus];
