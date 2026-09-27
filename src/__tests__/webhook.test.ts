import { POST } from '../app/api/webhooks/mayar/route';
import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// Mock Firebase Admin
jest.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    collection: jest.fn(),
    runTransaction: jest.fn(),
  }
}));

describe('Mayar Webhook Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles PAYMENT_SUCCESS event', async () => {
    const payload = {
      event: 'PAYMENT_SUCCESS',
      data: {
        id: 'trx_123',
        amount: 1100000,
        status: 'PAID',
        payment_channel: 'BCA Virtual Account',
        invoice_id: 'inv_abc',
        payment_method: 'VA'
      }
    };

    const request = new NextRequest('http://localhost:3000/api/webhooks/mayar', {
      method: 'POST',
      headers: {
        'x-mayar-signature': 'mock_signature'
      },
      body: JSON.stringify(payload)
    });

    // Mock query billing where mayarInvoiceId == 'inv_abc'
    const mockBillingDoc = {
      id: 'billing_123',
      data: () => ({ status: 'issued' }),
      ref: { update: jest.fn() }
    };

    (adminDb.collection as jest.Mock).mockReturnValue({
      where: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({
        empty: false,
        docs: [mockBillingDoc]
      }),
      doc: jest.fn().mockReturnValue({
        set: jest.fn()
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
  });
});
