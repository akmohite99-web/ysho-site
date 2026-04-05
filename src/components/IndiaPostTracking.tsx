import { useEffect, useState } from "react";
import { Truck, Copy, ExternalLink, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { orderApi } from "@/lib/api";

interface Props {
  orderId: string;
}

const INDIA_POST_TRACKING_URL = "https://www.indiapost.gov.in/";

const IndiaPostTracking = ({ orderId }: Props) => {
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null);
  const [loading, setLoading]               = useState(true);
  const [copied, setCopied]                 = useState(false);

  useEffect(() => {
    orderApi.getTracking(orderId)
      .then((res) => { if (res.success && res.available) setTrackingNumber(res.trackingNumber); })
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
        <div className="w-4 h-4 border-2 border-golden border-t-transparent rounded-full animate-spin" />
        Loading tracking info…
      </div>
    );
  }

  if (!trackingNumber) return null;

  const copyNumber = () => {
    navigator.clipboard.writeText(trackingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Truck className="w-4 h-4 text-golden" />
        India Post Tracking
      </div>

      {/* Consignment number card */}
      <div className="bg-muted/40 border border-border/50 rounded-lg px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Consignment Number</p>
          <p className="font-mono font-semibold tracking-wider text-sm">{trackingNumber}</p>
        </div>
        <button
          onClick={copyNumber}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
          title="Copy tracking number"
        >
          {copied
            ? <CheckCircle2 className="w-4 h-4 text-green-500" />
            : <Copy className="w-4 h-4" />
          }
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        Copy the consignment number above, then click "Track on India Post" to check live status.
      </p>

      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2"
        onClick={() => window.open(INDIA_POST_TRACKING_URL, "_blank", "noopener")}
      >
        <ExternalLink className="w-4 h-4" />
        Track on India Post Website
      </Button>
    </div>
  );
};

export default IndiaPostTracking;
