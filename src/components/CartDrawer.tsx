import { useEffect, useRef } from "react";
import {
  X, ShoppingCart, Trash2, Plus, Minus, Package,
  ArrowRight, Tag, Layers, ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Cart, Product } from "@/types";

export interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: Cart;
  products: Product[];
  cartTotal: number;
  cartCount: number;
  isSubmitting: boolean;
  onPlaceOrder: () => void;
  onRemoveVariant: (productId: string, variantId: number) => void;
  onUpdateVariantQty: (productId: string, variantId: number, qty: number) => void;
  onRemoveProduct: (productId: string) => void;
  getImageUrl: (image: string | null | undefined) => string | null;
}

// ─── Attribute label helpers ──────────────────────────────────────────────────
function formatLabel(key: string): string {
  const map: Record<string, string> = {
    color: "Color",
    brand: "Brand",
    model: "Model",
    size: "Size",
    ram: "RAM",
    storage: "Storage",
    mrp: "MRP",
    fabric_type: "Fabric",
    category: "Category",
    master_category: "Category",
    design: "Design",
  };
  return map[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  products,
  cartTotal,
  cartCount,
  isSubmitting,
  onPlaceOrder,
  onRemoveVariant,
  onUpdateVariantQty,
  onRemoveProduct,
  getImageUrl,
}: CartDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const totalPcs = cart.items.reduce(
    (s, i) => s + i.variants.reduce((ss, v) => ss + v.quantity, 0),
    0,
  );

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className={`fixed inset-0 z-40 transition-all duration-300 ${
          isOpen
            ? "bg-black/40 backdrop-blur-[3px] pointer-events-auto"
            : "bg-transparent pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Drawer ── */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full z-50 flex flex-col bg-white shadow-2xl
          transition-transform duration-300 ease-in-out w-[380px] max-w-[95vw]
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <ShoppingBag size={15} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-sm text-gray-900 leading-none">My Cart</p>
              {cartCount > 0 && (
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {cart.items.length} product{cart.items.length !== 1 ? "s" : ""} · {totalPcs} pcs
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cartCount > 0 && (
              <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">
                {cartCount} item{cartCount !== 1 ? "s" : ""}
              </span>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Close cart"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Cart items ── */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6 py-20">
              <div className="w-20 h-20 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                <ShoppingCart size={32} className="text-gray-300" strokeWidth={1.2} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500">Your cart is empty</p>
                <p className="text-xs text-gray-400 mt-1">Add products to get started</p>
              </div>
            </div>
          ) : (
            cart.items.map((item) => {
              const product = products.find((p) => p.id === item.productId);
              const imageUrl = getImageUrl(product?.image ?? null);
              const productColor =
                (product as any)?.color ||
                product?.attributes?.color ||
                (item as any).attributes?.color ||
                "";
              const totalAmt = item.variants.reduce(
                (s, v) => s + v.price * v.quantity,
                0,
              );
              const totalQty = item.variants.reduce((s, v) => s + v.quantity, 0);

              // Build attribute pills (brand, color — top-level)
              const topAttrs: { label: string; value: string; key: string }[] = [];
              const itemBrand = (item as any).brand || item.attributes?.brand || "";
              if (itemBrand) {
                topAttrs.push({ key: "brand", label: "Brand", value: itemBrand });
              }
              if (productColor) {
                topAttrs.push({ key: "color", label: "Color", value: productColor });
              }

              return (
                <div
                  key={item.productId}
                  className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 bg-white"
                >
                  {/* ── Product row ── */}
                  <div className="flex items-start gap-3 p-3">
                    {/* Thumbnail */}
                    <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={(item as any).name ?? "Product"}
                          className="w-full h-full object-contain p-1"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <Package size={20} className="text-gray-300" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate leading-snug">
                        {(item as any).name ?? item.productId}
                      </p>

                      {/* Attribute labels */}
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {topAttrs.map((attr) => (
                          <span
                            key={attr.key}
                            className="inline-flex items-center gap-1 text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                          >
                            <Tag size={8} className="text-gray-400" />
                            <span className="text-gray-400">{attr.label}:</span>
                            {attr.key === "color" ? (
                              <span className="flex items-center gap-1">
                                <span
                                  className="w-2 h-2 rounded-full border border-gray-300 flex-shrink-0"
                                  style={{ backgroundColor: attr.value.toLowerCase() }}
                                />
                                {attr.value}
                              </span>
                            ) : (
                              attr.value
                            )}
                          </span>
                        ))}
                      </div>

                      {/* Summary + price */}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[11px] text-gray-400">
                          {item.variants.length} size{item.variants.length !== 1 ? "s" : ""} · {totalQty} pcs
                        </span>
                        <span className="text-sm font-bold text-blue-600">
                          ₹{totalAmt.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    {/* Remove all */}
                    <button
                      onClick={() => onRemoveProduct(item.productId)}
                      className="w-7 h-7 flex-shrink-0 rounded-lg flex items-center justify-center text-red-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Remove product"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  {/* ── Variant breakdown ── */}
                  <div className="border-t border-gray-100 bg-gray-50/60 px-3 py-2 space-y-1.5">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Layers size={9} className="text-gray-400" />
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                        Size Breakdown
                      </p>
                    </div>

                    {item.variants.map((v) => {
                      const vColor = v.color || productColor;
                      return (
                        <div
                          key={v.variantId}
                          className="flex items-center gap-2 bg-white rounded-xl px-2.5 py-2 border border-gray-100 hover:border-blue-100 transition-colors group"
                        >
                          {/* Size badge */}
                          <div className="flex-shrink-0 flex flex-col items-center gap-0.5">
                            <span className="text-[9px] text-gray-400 leading-none">SIZE</span>
                            <span className="text-xs font-extrabold bg-blue-600 text-white px-1.5 py-0.5 rounded-md min-w-[28px] text-center">
                              {v.size || "—"}
                            </span>
                          </div>

                          {/* Color */}
                          {vColor && (
                            <div className="flex-shrink-0 flex flex-col items-center gap-0.5">
                              <span className="text-[9px] text-gray-400 leading-none">COLOR</span>
                              <span className="flex items-center gap-1 text-[10px] text-gray-600 font-medium">
                                <span
                                  className="w-2.5 h-2.5 rounded-full border border-gray-200 flex-shrink-0"
                                  style={{ backgroundColor: vColor.toLowerCase() }}
                                />
                                <span className="max-w-[44px] truncate">{vColor}</span>
                              </span>
                            </div>
                          )}

                          {/* Price */}
                          <div className="flex-shrink-0 flex flex-col items-center gap-0.5">
                            <span className="text-[9px] text-gray-400 leading-none">PRICE</span>
                            <span className="text-[11px] font-bold text-gray-800">
                              ₹{v.price.toLocaleString("en-IN")}
                            </span>
                          </div>

                          {/* Stepper */}
                          <div className="ml-auto flex items-center border border-blue-200 rounded-lg overflow-hidden bg-white shadow-sm">
                            <button
                              onClick={() => onUpdateVariantQty(item.productId, v.variantId, v.quantity - 1)}
                              className="px-2 py-1.5 text-blue-500 hover:bg-blue-50 active:bg-blue-100 transition-colors"
                            >
                              <Minus size={9} />
                            </button>
                            <span className="text-xs font-extrabold text-blue-700 min-w-[24px] text-center">
                              {v.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateVariantQty(item.productId, v.variantId, v.quantity + 1)}
                              className="px-2 py-1.5 text-blue-500 hover:bg-blue-50 active:bg-blue-100 transition-colors"
                            >
                              <Plus size={9} />
                            </button>
                          </div>

                          {/* Subtotal */}
                          <span className="text-[11px] font-bold text-blue-600 flex-shrink-0 min-w-[52px] text-right">
                            ₹{(v.price * v.quantity).toLocaleString("en-IN")}
                          </span>

                          {/* Remove variant */}
                          <button
                            onClick={() => onRemoveVariant(item.productId, v.variantId)}
                            className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-red-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      );
                    })}

                    {/* Variant subtotal */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-dashed border-gray-200">
                      <span className="text-[10px] text-gray-400">
                        {totalQty} pcs · {item.variants.length} size{item.variants.length !== 1 ? "s" : ""}
                      </span>
                      <span className="text-xs font-extrabold text-blue-600">
                        ₹{totalAmt.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Footer ── */}
        {cart.items.length > 0 && (
          <div className="border-t border-gray-100 flex-shrink-0 bg-white">
            {/* Order summary */}
            <div className="px-5 py-3 bg-blue-50/60 border-b border-blue-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">
                  {cart.items.length} product{cart.items.length !== 1 ? "s" : ""} · {totalPcs} pcs
                </span>
                <span className="text-xs text-gray-500">Subtotal</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-base font-extrabold text-gray-900">Total</span>
                <span className="text-xl font-extrabold text-blue-600">
                  ₹{cartTotal.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* CTA */}
            <div className="px-4 py-4">
              <Button
                onClick={onPlaceOrder}
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white h-12 text-sm font-bold rounded-2xl gap-2 shadow-lg shadow-blue-100 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Placing Order…
                  </>
                ) : (
                  <>
                    <ShoppingCart size={16} />
                    Place Order
                    <ArrowRight size={14} />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
