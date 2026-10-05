import React, { useState } from 'react';
import { 
  Globe, 
  RotateCw, 
  ArrowLeft, 
  ArrowRight, 
  Smartphone, 
  Tablet, 
  Monitor, 
  Terminal,
  ShoppingBag,
  CheckCircle2,
  Tag,
  AlertTriangle
} from 'lucide-react';
import { CartItem, Coupon } from '../types';

interface BrowserPreviewProps {
  cartCalculatorCode: string;
}

export const BrowserPreview: React.FC<BrowserPreviewProps> = ({ cartCalculatorCode }) => {
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [url, setUrl] = useState('http://localhost:3000/checkout');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showConsole, setShowConsole] = useState(false);

  // Cart state
  const [items, setItems] = useState<CartItem[]>([
    { id: '1', name: 'Ergonomic Mechanical Keyboard', price: 80.0, quantity: 1, category: 'Hardware' },
    { id: '2', name: 'Desk Cable Organizers (Pack of 3)', price: 10.0, quantity: 2, category: 'Accessories' },
  ]);
  const [couponCode, setCouponCode] = useState('SPRING25');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>({
    code: 'SPRING25',
    discountPercentage: 25,
  });
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Dynamically calculate based on current code state
  // Check if bug is present in cartCalculatorCode
  const hasDoubleDeduction = cartCalculatorCode.includes('discountedSubtotal - discountAmount');
  const hasTaxBeforeDiscount = cartCalculatorCode.includes('rawSubtotal * TAX_RATE');
  const hasDiscountOnShipping = cartCalculatorCode.includes('(rawSubtotal + shippingFee)');

  const rawSubtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shippingFee = rawSubtotal >= 50 ? 0 : 9.99;
  
  let discountAmount = 0;
  if (appliedCoupon) {
    if (hasDiscountOnShipping) {
      discountAmount = (rawSubtotal + shippingFee) * (appliedCoupon.discountPercentage / 100);
    } else {
      discountAmount = rawSubtotal * (appliedCoupon.discountPercentage / 100);
    }
  }

  const discountedSubtotal = Math.max(0, rawSubtotal - discountAmount);
  
  let taxAmount = 0;
  if (hasTaxBeforeDiscount) {
    taxAmount = Number((rawSubtotal * 0.0825).toFixed(2));
  } else {
    taxAmount = Number((discountedSubtotal * 0.0825).toFixed(2));
  }

  let grandTotal = 0;
  if (hasDoubleDeduction) {
    grandTotal = Number((discountedSubtotal - discountAmount + shippingFee + taxAmount).toFixed(2));
  } else {
    grandTotal = Number((discountedSubtotal + shippingFee + taxAmount).toFixed(2));
  }

  const isBugPresent = hasDoubleDeduction || hasTaxBeforeDiscount || hasDiscountOnShipping;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 300);
  };

  const viewportWidths = {
    desktop: 'w-full',
    tablet: 'max-w-[768px]',
    mobile: 'max-w-[390px]',
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Browser Bar */}
      <div className="px-3 py-1.5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between select-none">
        <div className="flex items-center gap-2 flex-1 max-w-xl">
          <div className="flex items-center gap-1 text-slate-500">
            <button className="p-1 hover:text-slate-300 rounded cursor-pointer">
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button className="p-1 hover:text-slate-300 rounded cursor-pointer">
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={handleRefresh} 
              className={`p-1 hover:text-slate-300 rounded cursor-pointer ${isRefreshing ? 'animate-spin' : ''}`}
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 flex items-center gap-2 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-300 font-mono">
            <Globe className="w-3 h-3 text-slate-500" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none w-full"
            />
          </div>
        </div>

        {/* Viewport switchers & devtools */}
        <div className="flex items-center gap-1 text-slate-400">
          <button
            onClick={() => setViewport('desktop')}
            title="Desktop view"
            className={`p-1.5 rounded cursor-pointer ${viewport === 'desktop' ? 'bg-slate-800 text-white' : 'hover:text-slate-200'}`}
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewport('tablet')}
            title="Tablet view"
            className={`p-1.5 rounded cursor-pointer ${viewport === 'tablet' ? 'bg-slate-800 text-white' : 'hover:text-slate-200'}`}
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewport('mobile')}
            title="Mobile view"
            className={`p-1.5 rounded cursor-pointer ${viewport === 'mobile' ? 'bg-slate-800 text-white' : 'hover:text-slate-200'}`}
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
          <div className="h-4 w-px bg-slate-800 mx-1" />
          <button
            onClick={() => setShowConsole(!showConsole)}
            title="Toggle Console Logs"
            className={`p-1.5 rounded cursor-pointer ${showConsole ? 'bg-blue-600/30 text-blue-400' : 'hover:text-slate-200'}`}
          >
            <Terminal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Rendered Live App Container */}
      <div className="flex-1 bg-slate-950/60 overflow-y-auto p-6 flex flex-col items-center">
        <div className={`${viewportWidths[viewport]} transition-all duration-200`}>
          {/* Bug Status Warning Banner inside Preview */}
          {isBugPresent ? (
            <div className="mb-4 p-3 bg-rose-950/50 border border-rose-900/60 rounded-lg text-xs flex items-center justify-between text-rose-300">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  <strong>Calculation Bug Active:</strong> Sales tax or discount logic in <code className="font-mono text-rose-200">cartCalculator.ts</code> is erroneous.
                </span>
              </div>
              <span className="text-[11px] font-mono text-rose-400">Tests Failing</span>
            </div>
          ) : (
            <div className="mb-4 p-3 bg-emerald-950/50 border border-emerald-900/60 rounded-lg text-xs flex items-center justify-between text-emerald-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Fix Verified:</strong> Financial calculations accurately evaluated. All tests passing!
                </span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400">100% Pass</span>
            </div>
          )}

          {/* Interactive Web Storefront */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
            {/* Storefront Navigation */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center gap-2 font-semibold text-sm text-white">
                <ShoppingBag className="w-4 h-4 text-blue-500" />
                <span>ModernTech Store</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Secure Checkout</span>
              </div>
            </div>

            {/* Cart Items */}
            <div className="p-6">
              <h2 className="text-base font-semibold text-white mb-4">Review Your Items</h2>
              <div className="divide-y divide-slate-800">
                {items.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-slate-200">{item.name}</p>
                      <p className="text-xs text-slate-500">
                        Qty: {item.quantity} × ${item.price.toFixed(2)} · {item.category}
                      </p>
                    </div>
                    <span className="font-mono tabular-nums font-semibold text-white">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Promo Code Input */}
              <div className="mt-6 pt-4 border-t border-slate-800">
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Promotional Voucher or Coupon
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="e.g. SPRING25"
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-white uppercase focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (couponCode.toUpperCase() === 'SPRING25') {
                        setAppliedCoupon({ code: 'SPRING25', discountPercentage: 25 });
                      } else {
                        setAppliedCoupon(null);
                      }
                    }}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition-colors cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Order Calculations Breakdown */}
              <div className="mt-6 p-4 bg-slate-950 rounded-lg border border-slate-850 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Items Subtotal</span>
                  <span className="font-mono tabular-nums text-slate-200">${rawSubtotal.toFixed(2)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-medium">
                    <span>Discount ({appliedCoupon?.code} - {appliedCoupon?.discountPercentage}%)</span>
                    <span className="font-mono tabular-nums">-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-400">
                  <span>Shipping & Handling</span>
                  <span className="font-mono tabular-nums text-slate-200">
                    {shippingFee === 0 ? 'FREE' : `$${shippingFee.toFixed(2)}`}
                  </span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>Sales Tax (8.25%)</span>
                  <span className="font-mono tabular-nums text-slate-200">${taxAmount.toFixed(2)}</span>
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-semibold text-white">
                  <span>Order Total</span>
                  <span className="font-mono tabular-nums text-base text-blue-400">
                    ${grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => setOrderPlaced(true)}
                disabled={orderPlaced}
                className="w-full mt-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {orderPlaced ? '✓ Order Confirmed' : `Pay $${grandTotal.toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DevTools Console Drawer */}
      {showConsole && (
        <div className="h-32 border-t border-slate-800 bg-black font-mono text-[11px] p-2.5 text-slate-400 overflow-y-auto select-text">
          <div className="text-slate-500 mb-1 font-bold">Console Output:</div>
          <div className="text-slate-400">[info] Mount CheckoutApp component</div>
          <div className="text-slate-400">[info] Items loaded: {items.length}</div>
          {isBugPresent ? (
            <div className="text-rose-400">
              [warn] Financial discrepancy detected: Grand total ${grandTotal.toFixed(2)} does not match audit invariant ($81.19 expected for coupon SPRING25)
            </div>
          ) : (
            <div className="text-emerald-400">
              [info] Audit invariant verified: Grand total ${grandTotal.toFixed(2)} matches expected post-discount schema.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
