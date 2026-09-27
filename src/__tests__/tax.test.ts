import { calculateTax } from '../lib/utils/tax';

describe('Tax Calculator', () => {
  it('calculates PPN 12% correctly without PPh23', () => {
    const result = calculateTax(1000000, {
      ppnRate: 0.12,
      pph23Rate: 0.02,
      isPPNEnabled: true,
      isPPH23Enabled: false
    });
    
    expect(result.subtotal).toBe(1000000);
    expect(result.ppnAmount).toBe(120000);
    expect(result.pph23Amount).toBe(0);
    expect(result.grandTotal).toBe(1120000);
  });

  it('calculates both PPN 12% and PPh23 2%', () => {
    const result = calculateTax(1000000, {
      ppnRate: 0.12,
      pph23Rate: 0.02,
      isPPNEnabled: true,
      isPPH23Enabled: true
    });
    
    expect(result.subtotal).toBe(1000000);
    expect(result.ppnAmount).toBe(120000);
    expect(result.pph23Amount).toBe(20000);
    expect(result.grandTotal).toBe(1100000);
  });

  it('returns exact subtotal if taxes are disabled', () => {
    const result = calculateTax(5000000, {
      ppnRate: 0.12,
      pph23Rate: 0.02,
      isPPNEnabled: false,
      isPPH23Enabled: false
    });
    
    expect(result.grandTotal).toBe(5000000);
    expect(result.ppnAmount).toBe(0);
    expect(result.pph23Amount).toBe(0);
  });
});
