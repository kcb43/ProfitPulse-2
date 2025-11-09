import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogOverlay,
} from "@/components/ui/dialog";
import { Globe } from "lucide-react";

function buildQuery(name = "") {
  return name
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 7)
    .join(" ");
}

export default function SoldLookupDialog({ open, onOpenChange, itemName }) {
  const q = buildQuery(itemName);

  const ebaySoldUrl = q
    ? `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(q)}&LH_Sold=1&LH_Complete=1`
    : "https://www.ebay.com";

  const mercariSoldGoogle = q
    ? `https://www.google.com/search?q=${encodeURIComponent(q + " site:mercari.com")}`
    : "https://www.google.com";

  const fbMarketplaceGoogle = q
    ? `https://www.google.com/search?q=${encodeURIComponent(q + " site:facebook.com/marketplace")}`
    : "https://www.google.com";

  const etsySoldGoogle = q
    ? `https://www.google.com/search?q=${encodeURIComponent(q + " site:etsy.com sold")}`
    : "https://www.google.com";

  const googleAllMarketsUrl = q
    ? `https://www.google.com/search?q=${encodeURIComponent(q)}`
    : "https://www.google.com";

  const [activeMarket, setActiveMarket] = React.useState("ebay_sold");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="
        bg-black/60 backdrop-blur-sm
        data-[state=open]:animate-in data-[state=open]:fade-in-0
        data-[state=closed]:animate-out data-[state=closed]:fade-out-0
      " />
      <DialogContent className="
        w-[92vw] sm:w-[90vw]
        max-w-lg sm:max-w-xl md:max-w-2xl
        mx-auto
        max-h-[90vh] overflow-y-auto overflow-x-hidden
        rounded-lg sm:rounded-xl shadow-2xl
        p-4 sm:p-6
        duration-200
        data-[state=open]:animate-in
        data-[state=open]:fade-in-0
        data-[state=open]:slide-in-from-bottom-4 sm:data-[state=open]:zoom-in-95
        data-[state=closed]:animate-out
        data-[state=closed]:fade-out-0
        data-[state=closed]:slide-out-to-bottom-4 sm:data-[state=closed]:zoom-out-95
      ">
        <div className="space-y-4 overflow-x-hidden break-words whitespace-normal hyphens-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-semibold leading-snug text-balance">
              Sold Listings Lookup
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base leading-relaxed break-words">
              Quick search links based on "{q || "your item name"}".
            </DialogDescription>
          </DialogHeader>

          <div className="text-sm text-muted-foreground break-words">
            💡 Tip: <br className="block sm:hidden" />
            Keep names tight (brand + model + size). You can refine once the page opens.
          </div>

          {/* Market chips */}
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Marketplaces
            </p>

            {/* Row 1 */}
            <div className="grid grid-cols-3 gap-2 min-w-0">
              {[
                { key: "ebay_sold", label: "eBay" },
                { key: "mercari", label: "Mercari" },
                { key: "facebook", label: "Facebook" },
              ].map(btn => (
                <button
                  key={btn.key}
                  type="button"
                  onClick={() => setActiveMarket(btn.key)}
                  className={`
                    inline-flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium
                    border border-border transition
                    bg-muted/70 hover:bg-muted
                    dark:bg-muted/40 dark:hover:bg-muted/60
                    text-foreground whitespace-nowrap min-w-0
                    ${activeMarket === btn.key ? '!bg-foreground !text-background dark:!bg-foreground dark:!text-background' : ''}
                  `}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-2 gap-2 min-w-0">
              {[
                { key: "etsy", label: "Etsy" },
                { key: "all", label: "All markets", icon: <Globe className="w-5 h-5" /> },
              ].map(btn => (
                <button
                  key={btn.key}
                  type="button"
                  onClick={() => setActiveMarket(btn.key)}
                  className={`
                    inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium
                    border border-border transition
                    bg-muted/70 hover:bg-muted
                    dark:bg-muted/40 dark:hover:bg-muted/60
                    text-foreground whitespace-nowrap min-w-0
                    ${activeMarket === btn.key ? '!bg-foreground !text-background dark:!bg-foreground dark:!text-background' : ''}
                  `}
                >
                  {btn.icon}{btn.label}
                </button>
              ))}
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed break-words">
              Completed + Sold filter applied where supported.
            </p>
          </div>

          {/* Actions for selected market */}
          <div className="space-y-3 min-w-0 pt-2">
            {activeMarket === "ebay_sold" && (
              <>
                <p className="text-sm break-words">eBay completed + sold.</p>
                <div className="flex flex-col sm:flex-row gap-2 min-w-0">
                  <Button asChild className="bg-blue-600 hover:bg-blue-700 max-w-full truncate">
                    <a href={ebaySoldUrl} target="_blank" rel="noreferrer">Open eBay Sold</a>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(q || "")}
                    className="max-w-full truncate"
                  >
                    Copy Query
                  </Button>
                </div>
              </>
            )}

            {activeMarket === "mercari" && (
              <>
                <p className="text-sm break-words">Search via Google.</p>
                <Button asChild variant="outline" className="max-w-full truncate">
                  <a href={mercariSoldGoogle} target="_blank" rel="noreferrer">Search Mercari (Google)</a>
                </Button>
              </>
            )}

            {activeMarket === "facebook" && (
              <>
                <p className="text-sm break-words">Search via Google.</p>
                <Button asChild variant="outline" className="max-w-full truncate">
                  <a href={fbMarketplaceGoogle} target="_blank" rel="noreferrer">Search Facebook (Google)</a>
                </Button>
              </>
            )}

            {activeMarket === "etsy" && (
              <>
                <p className="text-sm break-words">Etsy sold examples (Google).</p>
                <Button asChild variant="outline" className="max-w-full truncate">
                  <a href={etsySoldGoogle} target="_blank" rel="noreferrer">Search Etsy (Google)</a>
                </Button>
              </>
            )}

            {activeMarket === "all" && (
              <>
                <p className="text-sm break-words">Broad search across markets.</p>
                <Button asChild variant="outline" className="max-w-full truncate">
                  <a href={googleAllMarketsUrl} target="_blank" rel="noreferrer">Search All Markets (Google)</a>
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}