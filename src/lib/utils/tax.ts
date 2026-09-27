export function calculateTax(
  subtotal: number, 
  config: { 
    ppnRate: number; // e.g. 0.12 for 12%
    pph23Rate: number; // e.g. 0.02 for 2%
    isPPNEnabled: boolean;
    isPPH23Enabled: boolean;
  }
) {
  let ppnAmount = 0;
  let pph23Amount = 0;

  if (config.isPPNEnabled) {
    ppnAmount = Math.floor(subtotal * config.ppnRate);
  }

  if (config.isPPH23Enabled) {
    pph23Amount = Math.floor(subtotal * config.pph23Rate);
  }

  // PPN adds to the total, PPh23 is a deduction from what the client pays 
  // (Client withholds PPh23). So GrandTotal = Subtotal + PPN - PPh23
  const grandTotal = subtotal + ppnAmount - pph23Amount;

  return {
    subtotal,
    ppnAmount,
    pph23Amount,
    grandTotal
  };
}
