import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { checkRateLimit } from "./src/lib/utils/rate-limit";
import { generateAccessCode, isValidAccessCodeFormat } from "./src/lib/utils/access-code";
import { calculateTaxes, calculateGrandTotal } from "./src/lib/tax/calculator";
import { TaxAllocationRule } from "./src/types";

async function runTests() {
  console.log("=========================================");
  console.log("🚀 STARTING CORE FUNCTION AUDIT & TESTS");
  console.log("=========================================\n");

  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${testName}`);
      failed++;
    }
  };

  try {
    // 1. Test Access Code Logic
    console.log("--- 1. Access Code Module ---");
    const code = generateAccessCode();
    assert(code.startsWith("PAY-") && code.length === 10, "Generate Access Code format correct");
    assert(isValidAccessCodeFormat(code) === true, "Validator accepts valid generated code");
    assert(isValidAccessCodeFormat("PAY-1234") === false, "Validator rejects short code");
    assert(isValidAccessCodeFormat("ABC-123456") === false, "Validator rejects wrong prefix");
    assert(isValidAccessCodeFormat("PAY-1234567") === false, "Validator rejects wrong length");

    // 2. Test Tax Calculator Logic
    console.log("\n--- 2. Tax Calculator Module ---");
    const mockRules: TaxAllocationRule[] = [
      { taxType: "ppn", name: "PPN 12%", percentage: 12, isInclusive: false, appliesTo: "all", description: "" },
      { taxType: "pph23", name: "PPh 23 (2%)", percentage: -2, isInclusive: false, appliesTo: "all", description: "" }
    ];
    
    // Subtotal 100,000
    const taxDetailsPrivate = calculateTaxes(100000, mockRules, "private");
    assert(taxDetailsPrivate.length === 2, "Private client gets both PPN and PPh23");
    
    const ppnDetail = taxDetailsPrivate.find(t => t.type === "ppn");
    const pph23Detail = taxDetailsPrivate.find(t => t.type === "pph23");
    
    assert(ppnDetail?.amount === 12000, "PPN calculation correct (12% of 100,000)");
    assert(pph23Detail?.amount === -2000, "PPh23 calculation correct (-2% of 100,000)");
    
    const grandTotal = calculateGrandTotal(100000, taxDetailsPrivate);
    // 100,000 + 12,000 - 2,000 = 110,000
    assert(grandTotal === 110000, "Grand total calculation correct");

    // 3. Test Rate Limiter (Firestore Transaction)
    console.log("\n--- 3. Rate Limiting (Firestore) Module ---");
    const mockIp = `test-ip-${Date.now()}`;
    
    // Attempt 1
    let rlRes = await checkRateLimit({ identifier: mockIp, limit: 2, windowMs: 10000 });
    assert(rlRes.success === true, "First request allowed");
    
    // Attempt 2
    rlRes = await checkRateLimit({ identifier: mockIp, limit: 2, windowMs: 10000 });
    assert(rlRes.success === true, "Second request allowed");
    
    // Attempt 3 (Should be blocked)
    rlRes = await checkRateLimit({ identifier: mockIp, limit: 2, windowMs: 10000 });
    assert(rlRes.success === false, "Third request blocked (Rate Limit Exceeded)");
    
  } catch (error) {
    console.error("Test Suite Crashed:", error);
  }

  console.log("\n=========================================");
  console.log(`🏁 TEST RESULTS: ${passed} Passed | ${failed} Failed`);
  console.log("=========================================");
}

runTests();
