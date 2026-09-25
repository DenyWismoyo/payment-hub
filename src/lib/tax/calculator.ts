import type { TaxDetail, TaxAllocationRule, ClientType } from "@/types";

/**
 * Hitung alokasi pajak berdasarkan rules dan subtotal
 */
export function calculateTaxes(
  subtotal: number,
  rules: TaxAllocationRule[],
  clientType: ClientType
): TaxDetail[] {
  return rules
    .filter(
      (rule) => rule.appliesTo === "all" || rule.appliesTo === clientType
    )
    .map((rule) => {
      let amount: number;

      if (rule.isInclusive) {
        // Pajak sudah termasuk dalam harga — dihitung dari subtotal
        // amount = subtotal * rate / (100 + rate) — untuk PPN inclusive
        amount = Math.round((subtotal * rule.percentage) / (100 + rule.percentage));
      } else {
        // Pajak ditambahkan di atas harga
        amount = Math.round((subtotal * rule.percentage) / 100);
      }

      return {
        type: rule.taxType,
        name: rule.name,
        percentage: rule.percentage,
        amount,
        isInclusive: rule.isInclusive,
      };
    });
}

/**
 * Hitung total tagihan termasuk pajak
 *
 * - Pajak inclusive: tidak menambah total (sudah termasuk)
 * - Pajak exclusive: menambah total
 * - Pajak inclusive yang dipotong (PPh): mengurangi yang dibayar tapi tetap dari subtotal
 */
export function calculateGrandTotal(
  subtotal: number,
  taxDetails: TaxDetail[]
): number {
  let grandTotal = subtotal;

  for (const tax of taxDetails) {
    if (!tax.isInclusive) {
      // Exclusive tax → ditambahkan ke total
      grandTotal += tax.amount;
    }
    // Inclusive tax → tidak mengubah total (sudah termasuk dalam subtotal)
  }

  return grandTotal;
}

/**
 * Hitung total pajak saja
 */
export function calculateTaxTotal(taxDetails: TaxDetail[]): number {
  return taxDetails.reduce((sum, tax) => sum + tax.amount, 0);
}

/**
 * Format ringkasan pajak untuk display
 */
export function formatTaxSummary(taxDetails: TaxDetail[]): string {
  if (taxDetails.length === 0) return "Tanpa pajak";

  return taxDetails
    .map((t) => `${t.name} ${t.percentage}%${t.isInclusive ? " (inklusif)" : ""}`)
    .join(", ");
}
