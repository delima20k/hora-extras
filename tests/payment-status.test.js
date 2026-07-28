import { describe, expect, it } from 'vitest';
import { OvertimeEntry } from '../src/models/OvertimeEntry.js';

describe('Payment status', () => {
  it('starts pending and can be marked as received', () => {
    const entry = new OvertimeEntry({ employeeId: 'employee-1', date: '2026-07-15', startTime: '14:20', endTime: '15:20' });
    expect(entry.paymentStatus).toBe('pending');
    expect(entry.update({ paymentStatus: 'received' }).paymentStatus).toBe('received');
  });
});
