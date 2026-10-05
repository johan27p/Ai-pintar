import { ProjectPreset } from '../types';

export const PROJECT_PRESETS: ProjectPreset[] = [
  {
    id: 'shop-cart-checkout',
    name: 'ecommerce-cart-service',
    description: 'React + TypeScript storefront shopping cart and tax computation service.',
    framework: 'React / TypeScript / Vite',
    issueTitle: 'SWE-1428: Fix double-discount on promo codes and incorrect sales tax baseline',
    issueDescription: 'When applying promo code "SPRING25" alongside free shipping over $50, the 25% discount is calculated against shipping costs and deducted twice. Additionally, state sales tax (8.25%) is computed before discount instead of after final discounted subtotal, causing customer billing disputes.',
    benchmarkScore: 'SWE-Bench Verified #1428',
    expectedFixSummary: 'Fixed cartCalculator.ts to compute discount only against items subtotal once, ensure taxable baseline is post-discount, and pass all unit tests in tests/cart.test.ts.',
    testCommand: 'npm test',
    files: {
      'src/utils/cartCalculator.ts': `export interface CartItem {
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
 * Calculates cart totals, discounts, shipping, and tax.
 * BUG: Contains double discount calculation and wrong tax baseline!
 */
export function calculateCartTotal(
  items: CartItem[],
  coupon: Coupon | null
): CartCalculationResult {
  const rawSubtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // BUG #1: Tax computed on rawSubtotal before discount is applied!
  const taxAmount = Number((rawSubtotal * TAX_RATE).toFixed(2));

  // Determine shipping
  const shippingFee = rawSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING;

  // Calculate discount
  let discountAmount = 0;
  if (coupon && (!coupon.minSubtotal || rawSubtotal >= coupon.minSubtotal)) {
    // BUG #2: Discount erroneously applied to rawSubtotal + shipping!
    discountAmount = (rawSubtotal + shippingFee) * (coupon.discountPercentage / 100);
  }

  // BUG #3: Discount deducted twice from final total!
  const discountedSubtotal = Math.max(0, rawSubtotal - discountAmount);
  const grandTotal = Number(
    (discountedSubtotal - discountAmount + shippingFee + taxAmount).toFixed(2)
  );

  return {
    rawSubtotal: Number(rawSubtotal.toFixed(2)),
    discountAmount: Number(discountAmount.toFixed(2)),
    discountedSubtotal: Number(discountedSubtotal.toFixed(2)),
    shippingFee: Number(shippingFee.toFixed(2)),
    taxAmount,
    grandTotal: Math.max(0, grandTotal),
  };
}
`,
      'tests/cart.test.ts': `import { calculateCartTotal, CartItem, Coupon } from '../src/utils/cartCalculator';

describe('Shopping Cart Financial Calculations', () => {
  const mockItems: CartItem[] = [
    { id: '1', name: 'Ergonomic Mechanical Keyboard', price: 80.0, quantity: 1, category: 'Electronics' },
    { id: '2', name: 'Desk Cable Organizers (Pack of 3)', price: 10.0, quantity: 2, category: 'Accessories' },
  ]; // rawSubtotal = 100.00

  test('calculates correct raw subtotal and qualifies for free shipping over $50', () => {
    const result = calculateCartTotal(mockItems, null);
    expect(result.rawSubtotal).toBe(100.0);
    expect(result.shippingFee).toBe(0.0);
  });

  test('applies 25% promo discount accurately to items subtotal only', () => {
    const coupon: Coupon = { code: 'SPRING25', discountPercentage: 25 };
    const result = calculateCartTotal(mockItems, coupon);

    // 25% of 100 is 25.00
    expect(result.discountAmount).toBe(25.0);
    expect(result.discountedSubtotal).toBe(75.0);
  });

  test('computes state sales tax (8.25%) AFTER promotional discount is deducted', () => {
    const coupon: Coupon = { code: 'SPRING25', discountPercentage: 25 };
    const result = calculateCartTotal(mockItems, coupon);

    // Taxable base is discountedSubtotal ($75.00) * 0.0825 = $6.19
    // Previously was computing 100 * 0.0825 = $8.25 (FAIL)
    expect(result.taxAmount).toBe(6.19);
  });

  test('calculates exact grand total without duplicate discount deductions', () => {
    const coupon: Coupon = { code: 'SPRING25', discountPercentage: 25 };
    const result = calculateCartTotal(mockItems, coupon);

    // Grand total: $75.00 (discounted) + $0.00 (shipping) + $6.19 (tax) = $81.19
    // Previously was deducting discount twice (FAIL)
    expect(result.grandTotal).toBe(81.19);
  });
});
`,
      'src/components/CheckoutApp.tsx': `import React, { useState } from 'react';
import { calculateCartTotal, CartItem, Coupon } from '../utils/cartCalculator';

export default function CheckoutApp() {
  const [items, setItems] = useState<CartItem[]>([
    { id: '1', name: 'Ergonomic Mechanical Keyboard', price: 80.0, quantity: 1, category: 'Hardware' },
    { id: '2', name: 'Desk Cable Organizers', price: 10.0, quantity: 2, category: 'Accessories' },
  ]);
  const [couponCode, setCouponCode] = useState('SPRING25');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>({
    code: 'SPRING25',
    discountPercentage: 25,
  });

  const totals = calculateCartTotal(items, appliedCoupon);

  return (
    <div className="p-6 max-w-xl mx-auto bg-slate-900 text-slate-100 rounded-xl border border-slate-800">
      <h2 className="text-lg font-semibold mb-4 text-white">Order Summary & Checkout</h2>
      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm py-2 border-b border-slate-800">
            <div>
              <p className="font-medium text-slate-200">{item.name}</p>
              <p className="text-xs text-slate-400">Qty: {item.quantity} × \${item.price.toFixed(2)}</p>
            </div>
            <span className="font-mono tabular-nums text-slate-200">\${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-6">
        <input 
          value={couponCode} 
          onChange={(e) => setCouponCode(e.target.value)}
          placeholder="Promo code"
          className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-sm text-white"
        />
        <button 
          onClick={() => {
            if (couponCode.toUpperCase() === 'SPRING25') {
              setAppliedCoupon({ code: 'SPRING25', discountPercentage: 25 });
            } else {
              setAppliedCoupon(null);
            }
          }}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded"
        >
          Apply
        </button>
      </div>

      <div className="space-y-2 text-sm pt-4 border-t border-slate-800">
        <div className="flex justify-between text-slate-400">
          <span>Subtotal</span>
          <span className="font-mono tabular-nums">\${totals.rawSubtotal.toFixed(2)}</span>
        </div>
        {totals.discountAmount > 0 && (
          <div className="flex justify-between text-emerald-400">
            <span>Discount ({appliedCoupon?.code})</span>
            <span className="font-mono tabular-nums">-\${totals.discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-slate-400">
          <span>Shipping</span>
          <span className="font-mono tabular-nums">{totals.shippingFee === 0 ? 'FREE' : \`\$\${totals.shippingFee.toFixed(2)}\`}</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Sales Tax (8.25%)</span>
          <span className="font-mono tabular-nums">\${totals.taxAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-base font-semibold text-white pt-2 border-t border-slate-800">
          <span>Grand Total</span>
          <span className="font-mono tabular-nums text-blue-400">\${totals.grandTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
`,
      'package.json': `{
  "name": "ecommerce-cart-service",
  "version": "1.4.0",
  "scripts": {
    "test": "jest tests/cart.test.ts",
    "dev": "vite"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.0.0"
  }
}
`,
      'README.md': `# E-Commerce Cart Service

High-volume shopping cart pricing engine with dynamic promotional coupon evaluation.

## Current Bug Reports
- Customer checkout bills show discrepancy when combining promotional coupons with free shipping.
- Sales tax calculation must strictly use post-discount taxable subtotal.
- Run \`npm test\` to inspect test failures.
`
    }
  },
  {
    id: 'auth-session-service',
    name: 'auth-session-manager',
    description: 'Node.js / TypeScript authentication microservice with refresh token rotation.',
    framework: 'Node.js / Express / TypeScript',
    issueTitle: 'SWE-892: Concurrency race condition on JWT token refresh invalidating sessions',
    issueDescription: 'When multiple parallel fetch requests encounter a 401 and attempt token refresh simultaneously, duplicate token generation invalidates the family rotation tree and forces premature user logout.',
    benchmarkScore: 'SWE-Bench Lite #892',
    expectedFixSummary: 'Implemented atomic token refresh mutex lock in src/auth.ts to serialize token exchange requests.',
    testCommand: 'npm test',
    files: {
      'src/auth.ts': `interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export class SessionManager {
  private activeTokens = new Map<string, string>(); // refreshToken -> userId
  private isRefreshing = false;

  async issueTokens(userId: string): Promise<TokenPair> {
    const accessToken = \`at_\${userId}_\${Date.now()}\`;
    const refreshToken = \`rt_\${userId}_\${Date.now()}\`;
    this.activeTokens.set(refreshToken, userId);
    return {
      accessToken,
      refreshToken,
      expiresAt: Date.now() + 900000, // 15 mins
    };
  }

  // BUG: Race condition allows multiple concurrent refreshes to invalidate each other!
  async refreshSession(oldRefreshToken: string): Promise<TokenPair> {
    const userId = this.activeTokens.get(oldRefreshToken);
    if (!userId) {
      throw new Error('Invalid or expired refresh token');
    }

    // Invalidate old token immediately without mutex
    this.activeTokens.delete(oldRefreshToken);
    
    // Simulate slight asynchronous database latency
    await new Promise((resolve) => setTimeout(resolve, 30));

    return this.issueTokens(userId);
  }
}
`,
      'tests/auth.test.ts': `import { SessionManager } from '../src/auth';

describe('SessionManager Concurrent Token Refresh', () => {
  test('handles simultaneous token refresh requests without session eviction', async () => {
    const manager = new SessionManager();
    const initial = await manager.issueTokens('user_9421');

    // Simulate 3 simultaneous requests triggering refresh at the exact same millisecond
    const results = await Promise.allSettled([
      manager.refreshSession(initial.refreshToken),
      manager.refreshSession(initial.refreshToken),
      manager.refreshSession(initial.refreshToken),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    expect(fulfilled.length).toBeGreaterThanOrEqual(1);
  });
});
`,
      'package.json': `{
  "name": "auth-session-manager",
  "version": "2.1.0",
  "scripts": {
    "test": "jest tests/auth.test.ts"
  }
}
`
    }
  },
  {
    id: 'rate-limiter-worker',
    name: 'rate-limiter-queue',
    description: 'Sliding window rate limiter algorithm with burst protection.',
    framework: 'TypeScript / Node.js',
    issueTitle: 'SWE-2104: Sliding window counter leaking quota across minute boundaries',
    issueDescription: 'Window calculation truncates timestamp into discrete minute buckets instead of floating sliding window, permitting 2x traffic bursts across the boundary.',
    benchmarkScore: 'SWE-Bench Full #2104',
    expectedFixSummary: 'Refactored src/limiter.ts to compute weighted previous window ratio + current window counter.',
    testCommand: 'npm test',
    files: {
      'src/limiter.ts': `export class SlidingWindowLimiter {
  private requests = new Map<string, number[]>();
  private limit: number;
  private windowMs: number;

  constructor(limit = 100, windowMs = 60000) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  isAllowed(clientId: string, now = Date.now()): boolean {
    const timestamps = this.requests.get(clientId) || [];
    // Filter out expired timestamps
    const valid = timestamps.filter((t) => now - t < this.windowMs);
    
    if (valid.length < this.limit) {
      valid.push(now);
      this.requests.set(clientId, valid);
      return true;
    }
    return false;
  }
}
`,
      'tests/limiter.test.ts': `import { SlidingWindowLimiter } from '../src/limiter';

describe('Sliding Window Rate Limiter', () => {
  test('rejects requests exceeding rate limit threshold', () => {
    const limiter = new SlidingWindowLimiter(3, 1000);
    const now = Date.now();
    expect(limiter.isAllowed('ip-1', now)).toBe(true);
    expect(limiter.isAllowed('ip-1', now + 100)).toBe(true);
    expect(limiter.isAllowed('ip-1', now + 200)).toBe(true);
    expect(limiter.isAllowed('ip-1', now + 300)).toBe(false); // Exceeded 3 requests
  });
});
`
    }
  }
];
