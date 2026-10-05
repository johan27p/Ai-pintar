import { AgentStep, AgentAction, AgentObservation, ProjectPreset } from '../types';

export interface CommandExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export function executeVirtualCommand(
  command: string,
  files: Record<string, string>,
  currentProject: ProjectPreset
): CommandExecutionResult {
  const trimmed = command.trim();

  // npm test or jest
  if (trimmed === 'npm test' || trimmed.startsWith('npm test') || trimmed.startsWith('jest')) {
    if (currentProject.id === 'shop-cart-checkout') {
      const cartCalc = files['src/utils/cartCalculator.ts'] || '';
      
      // Check if bugs are resolved
      const hasDoubleDeduction = cartCalc.includes('discountedSubtotal - discountAmount');
      const hasTaxBeforeDiscount = cartCalc.includes('rawSubtotal * TAX_RATE');
      const hasDiscountOnShipping = cartCalc.includes('(rawSubtotal + shippingFee)');

      if (hasDoubleDeduction || hasTaxBeforeDiscount || hasDiscountOnShipping) {
        return {
          exitCode: 1,
          stderr: `FAIL tests/cart.test.ts
  Shopping Cart Financial Calculations
    ✓ calculates correct raw subtotal and qualifies for free shipping over $50 (3 ms)
    ${hasDiscountOnShipping ? '✕ applies 25% promo discount accurately to items subtotal only (4 ms)' : '✓ applies 25% promo discount accurately to items subtotal only (3 ms)'}
    ${hasTaxBeforeDiscount ? '✕ computes state sales tax (8.25%) AFTER promotional discount is deducted (6 ms)' : '✓ computes state sales tax (8.25%) AFTER promotional discount is deducted (4 ms)'}
    ${hasDoubleDeduction ? '✕ calculates exact grand total without duplicate discount deductions (5 ms)' : '✓ calculates exact grand total without duplicate discount deductions (3 ms)'}

  ● Shopping Cart Financial Calculations › computes state sales tax (8.25%) AFTER promotional discount is deducted

    expect(received).toBe(expected) // Object.is equality

    Expected: 6.19
    Received: 8.25

      24 |     // Taxable base is discountedSubtotal ($75.00) * 0.0825 = $6.19
      25 |     // Previously was computing 100 * 0.0825 = $8.25 (FAIL)
    > 26 |     expect(result.taxAmount).toBe(6.19);
         |                              ^

  ● Shopping Cart Financial Calculations › calculates exact grand total without duplicate discount deductions

    expect(received).toBe(expected)

    Expected: 81.19
    Received: 56.19

      33 |     // Grand total: $75.00 (discounted) + $0.00 (shipping) + $6.19 (tax) = $81.19
    > 34 |     expect(result.grandTotal).toBe(81.19);
         |                               ^

Test Suites: 1 failed, 1 total
Tests:       2 failed, 2 passed, 4 total
Snapshots:   0 total
Time:        1.428 s
Ran all test suites matching /tests\\/cart.test.ts/i.`,
          stdout: '',
        };
      } else {
        return {
          exitCode: 0,
          stdout: `PASS tests/cart.test.ts
  Shopping Cart Financial Calculations
    ✓ calculates correct raw subtotal and qualifies for free shipping over $50 (2 ms)
    ✓ applies 25% promo discount accurately to items subtotal only (2 ms)
    ✓ computes state sales tax (8.25%) AFTER promotional discount is deducted (3 ms)
    ✓ calculates exact grand total without duplicate discount deductions (2 ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Snapshots:   0 total
Time:        1.112 s
Ran all test suites matching /tests\\/cart.test.ts/i.
✨ All unit test assertions verified successfully!`,
          stderr: '',
        };
      }
    }

    if (currentProject.id === 'auth-session-service') {
      const authCode = files['src/auth.ts'] || '';
      const hasMutex = authCode.includes('mutex') || authCode.includes('refreshPromise') || authCode.includes('isRefreshing');
      if (!hasMutex) {
        return {
          exitCode: 1,
          stderr: `FAIL tests/auth.test.ts
  ● SessionManager Concurrent Token Refresh › handles simultaneous token refresh requests without session eviction
    Expected: >= 1 fulfilled
    Received: 0 (Session destroyed by race condition)
Test Suites: 1 failed, 1 total`,
          stdout: '',
        };
      }
      return {
        exitCode: 0,
        stdout: `PASS tests/auth.test.ts
  SessionManager Concurrent Token Refresh
    ✓ handles simultaneous token refresh requests without session eviction (48 ms)
Test Suites: 1 passed, 1 total`,
        stderr: '',
      };
    }

    return {
      exitCode: 0,
      stdout: `PASS tests/limiter.test.ts
  ✓ rejects requests exceeding rate limit threshold (8 ms)
Test Suites: 1 passed, 1 total`,
      stderr: '',
    };
  }

  // git status
  if (trimmed === 'git status') {
    const originalFiles = currentProject.files;
    const modified: string[] = [];
    const untracked: string[] = [];

    Object.keys(files).forEach((path) => {
      if (!originalFiles[path]) {
        untracked.push(path);
      } else if (originalFiles[path] !== files[path]) {
        modified.push(path);
      }
    });

    let output = `On branch main\nYour branch is up to date with 'origin/main'.\n\n`;
    if (modified.length > 0) {
      output += `Changes not staged for commit:\n  (use "git add <file>..." to update what will be committed)\n`;
      modified.forEach((f) => {
        output += `\tmodified:   ${f}\n`;
      });
      output += '\n';
    }
    if (untracked.length > 0) {
      output += `Untracked files:\n  (use "git add <file>..." to include in what will be committed)\n`;
      untracked.forEach((f) => {
        output += `\t${f}\n`;
      });
      output += '\n';
    }
    if (modified.length === 0 && untracked.length === 0) {
      output += 'nothing to commit, working tree clean\n';
    }
    return { exitCode: 0, stdout: output, stderr: '' };
  }

  // git diff
  if (trimmed === 'git diff' || trimmed.startsWith('git diff')) {
    const originalFiles = currentProject.files;
    let diffOutput = '';

    Object.keys(files).forEach((path) => {
      if (originalFiles[path] && originalFiles[path] !== files[path]) {
        diffOutput += `diff --git a/${path} b/${path}\n--- a/${path}\n+++ b/${path}\n@@ -1,15 +1,15 @@\n`;
        const oldLines = originalFiles[path].split('\n');
        const newLines = files[path].split('\n');
        newLines.forEach((line, idx) => {
          if (oldLines[idx] !== line) {
            if (oldLines[idx]) diffOutput += `-${oldLines[idx]}\n`;
            diffOutput += `+${line}\n`;
          }
        });
      }
    });

    return {
      exitCode: 0,
      stdout: diffOutput || '(no working tree changes)',
      stderr: '',
    };
  }

  // ls or ls -la
  if (trimmed === 'ls' || trimmed === 'ls -la' || trimmed === 'ls -l') {
    const paths = Object.keys(files).sort();
    return {
      exitCode: 0,
      stdout: `total ${paths.length}\ndrwxr-xr-x  8 openhands openhands  4096 Oct 05 12:00 .\n` +
        paths.map((p) => `-rw-r--r--  1 openhands openhands  ${files[p].length} Oct 05 12:00 ${p}`).join('\n'),
      stderr: '',
    };
  }

  // cat <file>
  if (trimmed.startsWith('cat ')) {
    const target = trimmed.replace('cat ', '').trim();
    if (files[target] !== undefined) {
      return { exitCode: 0, stdout: files[target], stderr: '' };
    }
    return { exitCode: 1, stdout: '', stderr: `cat: ${target}: No such file or directory` };
  }

  // pwd
  if (trimmed === 'pwd') {
    return { exitCode: 0, stdout: `/workspace/${currentProject.name}`, stderr: '' };
  }

  // clear
  if (trimmed === 'clear') {
    return { exitCode: 0, stdout: '', stderr: '' };
  }

  // node -v / npm -v
  if (trimmed === 'node -v' || trimmed === 'node --version') {
    return { exitCode: 0, stdout: 'v22.14.0', stderr: '' };
  }
  if (trimmed === 'npm -v' || trimmed === 'npm --version') {
    return { exitCode: 0, stdout: '10.9.0', stderr: '' };
  }

  // echo
  if (trimmed.startsWith('echo ')) {
    return { exitCode: 0, stdout: trimmed.slice(5), stderr: '' };
  }

  // default fallback
  return {
    exitCode: 0,
    stdout: `[bash] executed: ${trimmed}\n(process finished with exit code 0)`,
    stderr: '',
  };
}

export const FIXED_CART_CODE = `export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

export interface Coupon {
  code: string;
  discountPercentage: number;
  minSubtotal?: number;
}

export interface CartCalculationResult {
  rawSubtotal: number;
  discountAmount: number;
  discountedSubtotal: number;
  shippingFee: number;
  taxAmount: number;
  grandTotal: number;
}

const TAX_RATE = 0.0825; // 8.25% state sales tax
const FREE_SHIPPING_THRESHOLD = 50.0;
const STANDARD_SHIPPING = 9.99;

/**
 * Calculates cart totals, discounts, shipping, and tax accurately.
 * FIXED: Clean single-pass discount, post-discount sales tax base.
 */
export function calculateCartTotal(
  items: CartItem[],
  coupon: Coupon | null
): CartCalculationResult {
  const rawSubtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Calculate promotional discount strictly on items subtotal
  let discountAmount = 0;
  if (coupon && (!coupon.minSubtotal || rawSubtotal >= coupon.minSubtotal)) {
    discountAmount = rawSubtotal * (coupon.discountPercentage / 100);
  }

  // Compute taxable base AFTER promotional discount
  const discountedSubtotal = Math.max(0, rawSubtotal - discountAmount);
  
  // Free shipping threshold evaluated against post-discount or pre-discount subtotal (pre-discount per policy)
  const shippingFee = rawSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING;

  // Sales tax computed strictly on discounted subtotal
  const taxAmount = Number((discountedSubtotal * TAX_RATE).toFixed(2));

  // Grand total combines discounted subtotal, shipping, and sales tax once
  const grandTotal = Number((discountedSubtotal + shippingFee + taxAmount).toFixed(2));

  return {
    rawSubtotal: Number(rawSubtotal.toFixed(2)),
    discountAmount: Number(discountAmount.toFixed(2)),
    discountedSubtotal: Number(discountedSubtotal.toFixed(2)),
    shippingFee: Number(shippingFee.toFixed(2)),
    taxAmount,
    grandTotal: Math.max(0, grandTotal),
  };
}
`;
