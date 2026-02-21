import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Edit3,
  RefreshCw,
  Search,
  ShoppingCart,
} from "lucide-react";
import { Product, VoiceParsedItem, VoiceParseResult, VoiceUnmatchedSegment } from "@/types";

type FallbackLevel = "review" | "edit" | "guided";

interface VoiceFallbackModalProps {
  open: boolean;
  onClose: () => void;
  parseResult: VoiceParseResult | null;
  rawTranscript: string;
  products: Product[];
  onReprocess: (editedTranscript: string) => void;
  onConfirmItems: (items: { productId: string; quantity: number }[]) => void;
  errorMessage?: string;
}

const VoiceFallbackModal = ({
  open,
  onClose,
  parseResult,
  rawTranscript,
  products,
  onReprocess,
  onConfirmItems,
  errorMessage,
}: VoiceFallbackModalProps) => {
  const [fallbackLevel, setFallbackLevel] = useState<FallbackLevel>("review");
  const [editedTranscript, setEditedTranscript] = useState(rawTranscript);
  const [selectedItems, setSelectedItems] = useState<Map<string, number>>(new Map());
  const [searchQuery, setSearchQuery] = useState("");

  // Initialize selected items from parse result
  const highConfidenceItems = useMemo(
    () => parseResult?.parsed.filter((p) => p.confidence >= 0.7) || [],
    [parseResult]
  );

  const lowConfidenceItems = useMemo(
    () => parseResult?.parsed.filter((p) => p.confidence < 0.7) || [],
    [parseResult]
  );

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      // Show suggested products from unmatched segments
      const suggestedIds = new Set<string>();
      parseResult?.unmatchedSegments?.forEach((seg) => {
        seg.suggestedProductIds?.forEach((id) => suggestedIds.add(id));
      });
      if (suggestedIds.size > 0) {
        return products.filter((p) => suggestedIds.has(p.id));
      }
      // If no suggestions, show keyword-matching products
      const keywords = parseResult?.unmatchedSegments?.flatMap((s) => s.detectedKeywords) || [];
      if (keywords.length > 0) {
        return products.filter((p) =>
          keywords.some(
            (kw) =>
              p.name.toLowerCase().includes(kw.toLowerCase()) ||
              p.brand.toLowerCase().includes(kw.toLowerCase()) ||
              p.model.toLowerCase().includes(kw.toLowerCase())
          )
        );
      }
      return products.slice(0, 10);
    }
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.model.toLowerCase().includes(q)
    );
  }, [searchQuery, products, parseResult]);

  const toggleGuidedItem = (productId: string) => {
    setSelectedItems((prev) => {
      const next = new Map(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.set(productId, 1);
      }
      return next;
    });
  };

  const updateGuidedQty = (productId: string, qty: number) => {
    setSelectedItems((prev) => {
      const next = new Map(prev);
      if (qty <= 0) {
        next.delete(productId);
      } else {
        next.set(productId, qty);
      }
      return next;
    });
  };

  const handleConfirmReview = () => {
    const items = highConfidenceItems.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
    }));
    onConfirmItems(items);
    onClose();
  };

  const handleConfirmAll = () => {
    const items = [
      ...highConfidenceItems.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
      ...Array.from(selectedItems.entries()).map(([productId, quantity]) => ({
        productId,
        quantity,
      })),
    ];
    onConfirmItems(items);
    onClose();
  };

  const noResults = !parseResult?.parsed.length && !parseResult?.unmatchedSegments?.length;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {fallbackLevel === "review" && (
              <>
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Review Voice Order
              </>
            )}
            {fallbackLevel === "edit" && (
              <>
                <Edit3 className="h-5 w-5 text-primary" />
                Edit Transcript
              </>
            )}
            {fallbackLevel === "guided" && (
              <>
                <Search className="h-5 w-5 text-primary" />
                Select Products Manually
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {fallbackLevel === "review" &&
              "Some products need confirmation. Review and adjust below."}
            {fallbackLevel === "edit" &&
              "Edit the transcribed text and reprocess."}
            {fallbackLevel === "guided" &&
              "Search and select products manually."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          {/* FALLBACK LEVEL 1: Review parsed items */}
          {fallbackLevel === "review" && (
            <div className="space-y-4">
              {/* Error message */}
              {errorMessage && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-start gap-2">
                  <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  {errorMessage}
                </div>
              )}

              {/* Raw transcript */}
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground mb-1">Heard:</p>
                <p className="text-sm italic">"{rawTranscript}"</p>
              </div>

              {/* High confidence items */}
              {highConfidenceItems.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Matched Products
                  </h4>
                  <div className="space-y-2">
                    {highConfidenceItems.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded border bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
                      >
                        <div>
                          <span className="font-medium text-sm">{item.productName}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({item.matchReason})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Qty: {item.quantity}</Badge>
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                            {Math.round(item.confidence * 100)}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Low confidence items */}
              {lowConfidenceItems.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Needs Confirmation
                  </h4>
                  <div className="space-y-2">
                    {lowConfidenceItems.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded border bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
                      >
                        <div>
                          <span className="font-medium text-sm">{item.productName}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({item.matchReason})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Qty: {item.quantity}</Badge>
                          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                            {Math.round(item.confidence * 100)}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Unmatched segments */}
              {parseResult?.unmatchedSegments && parseResult.unmatchedSegments.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                    <XCircle className="h-4 w-4 text-destructive" />
                    Could Not Match
                  </h4>
                  <div className="space-y-2">
                    {parseResult.unmatchedSegments.map((seg, i) => (
                      <div
                        key={i}
                        className="p-2 rounded border bg-destructive/5 border-destructive/20"
                      >
                        <p className="text-sm">"{seg.text}"</p>
                        {seg.detectedKeywords.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {seg.detectedKeywords.map((kw, j) => (
                              <Badge key={j} variant="outline" className="text-xs">
                                {kw}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No results */}
              {noResults && (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No products detected from the voice input.</p>
                  <p className="text-sm mt-1">Try editing the transcript or selecting products manually.</p>
                </div>
              )}
            </div>
          )}

          {/* FALLBACK LEVEL 2: Edit transcript */}
          {fallbackLevel === "edit" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Edit the transcribed text:
                </label>
                <Textarea
                  value={editedTranscript}
                  onChange={(e) => setEditedTranscript(e.target.value)}
                  className="min-h-[100px]"
                  placeholder="e.g., Samsung Galaxy A15 6GB 128GB 4 pieces, Redmi Note 13 8GB 128GB 6 pieces"
                />
              </div>
              <Button
                onClick={() => onReprocess(editedTranscript)}
                className="w-full"
                disabled={!editedTranscript.trim()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Process Again
              </Button>
            </div>
          )}

          {/* FALLBACK LEVEL 3: Guided selection */}
          {fallbackLevel === "guided" && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border rounded-md text-sm bg-background"
                />
              </div>

              <div className="space-y-2">
                {filteredProducts.map((product) => {
                  const isSelected = selectedItems.has(product.id);
                  const qty = selectedItems.get(product.id) || 1;
                  return (
                    <div
                      key={product.id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-primary/5 border-primary"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => toggleGuidedItem(product.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox checked={isSelected} />
                        <div>
                          <p className="text-sm font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.brand} • {product.model} • ₹{product.price}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => updateGuidedQty(product.id, qty - 1)}
                          >
                            -
                          </Button>
                          <span className="text-sm w-6 text-center">{qty}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => updateGuidedQty(product.id, qty + 1)}
                          >
                            +
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <p className="text-center py-4 text-muted-foreground text-sm">
                    No products found. Try a different search.
                  </p>
                )}
              </div>
            </div>
          )}
        </ScrollArea>

        <Separator />

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {/* Navigation between fallback levels */}
          <div className="flex gap-2 flex-1">
            {fallbackLevel !== "review" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFallbackLevel("review")}
              >
                ← Review
              </Button>
            )}
            {fallbackLevel === "review" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditedTranscript(rawTranscript);
                    setFallbackLevel("edit");
                  }}
                >
                  <Edit3 className="h-3 w-3 mr-1" />
                  Edit Text
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFallbackLevel("guided")}
                >
                  <Search className="h-3 w-3 mr-1" />
                  Manual Select
                </Button>
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            {fallbackLevel === "review" && highConfidenceItems.length > 0 && (
              <Button onClick={handleConfirmReview}>
                <ShoppingCart className="h-4 w-4 mr-1" />
                Add {highConfidenceItems.length} Items
              </Button>
            )}
            {fallbackLevel === "guided" && selectedItems.size > 0 && (
              <Button onClick={handleConfirmAll}>
                <ShoppingCart className="h-4 w-4 mr-1" />
                Add {highConfidenceItems.length + selectedItems.size} Items
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceFallbackModal;
