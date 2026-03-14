import { PageTransition } from "@/components/PageTransition";
import { useTaxStore } from "@/hooks/use-tax-store";
import { Link } from "wouter";
import { Download, Share2, Calculator, AlertCircle } from "lucide-react";
import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { TaxDoughnut } from "@/components/TaxDoughnut";

export default function Share() {
  const { result } = useTaxStore();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  if (!result) {
    return (
      <PageTransition className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">No Calculation Found</h2>
        <p className="text-muted-foreground mb-8">You need to calculate your taxes first before creating a share card.</p>
        <Link 
          href="/calculator"
          className="px-6 py-3 rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Calculator className="w-5 h-5" /> Go to Calculator
        </Link>
      </PageTransition>
    );
  }

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0a0a0b',
        scale: 2, // High res
        logging: false,
      });
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'my-tax-receipt.png';
      link.href = url;
      link.click();
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share && cardRef.current) {
      setIsExporting(true);
      try {
        const canvas = await html2canvas(cardRef.current, { backgroundColor: '#0a0a0b', scale: 2 });
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], 'tax-receipt.png', { type: 'image/png' });
            await navigator.share({
              title: 'My Tax Breakdown',
              text: 'Check out exactly where my taxes go this year!',
              files: [file]
            });
          }
        });
      } catch (err) {
        console.error("Share failed", err);
      } finally {
        setIsExporting(false);
      }
    } else {
      alert("Web Share API not supported on this browser. Please use Download instead.");
    }
  };

  // Get top 3 categories
  const topCategories = [...result.breakdown].sort((a, b) => b.percentage - a.percentage).slice(0, 3);

  return (
    <PageTransition className="flex flex-col items-center">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-display font-bold mb-2">Share Your Results</h1>
        <p className="text-muted-foreground">Download or share this summary graphic on social media.</p>
      </div>

      <div className="flex flex-wrap justify-center gap-4 mb-8">
        <button 
          onClick={handleDownload}
          disabled={isExporting}
          className="px-6 py-3 rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          <Download className="w-5 h-5" /> Download Image
        </button>
        {navigator.share && (
          <button 
            onClick={handleShare}
            disabled={isExporting}
            className="px-6 py-3 rounded-xl font-semibold bg-white/5 border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <Share2 className="w-5 h-5" /> Share directly
          </button>
        )}
      </div>

      {/* The Exportable Card */}
      <div 
        ref={cardRef} 
        className="w-full max-w-[400px] bg-[#0a0a0b] text-white rounded-3xl border border-[#27272a] shadow-2xl overflow-hidden p-8"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 0%, #1e293b 0%, #0a0a0b 70%)'
        }}
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#06b6d4]/10 text-[#06b6d4] text-xs font-bold uppercase tracking-wider mb-4 border border-[#06b6d4]/20">
            <Calculator className="w-3 h-3" /> Official Tax Receipt
          </div>
          <p className="text-gray-400 text-sm mb-1">My total estimated tax</p>
          <h2 className="text-5xl font-display font-extrabold text-white">
            ${result.estimatedTax.toLocaleString()}
          </h2>
        </div>

        <div className="w-48 h-48 mx-auto mb-8 relative">
          <TaxDoughnut categories={result.breakdown} hideLegend={true} />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
             <span className="text-xs text-gray-500">Effective Rate</span>
             <span className="text-xl font-bold text-white">{(result.effectiveRate * 100).toFixed(1)}%</span>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-800 pb-2">Top Funding Areas</h4>
          {topCategories.map(cat => (
            <div key={cat.key} className="flex justify-between items-center bg-white/5 rounded-xl p-3 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="font-medium text-sm text-gray-200">{cat.label}</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-white block leading-none">
                  ${cat.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-4 border-t border-gray-800 flex justify-between items-center text-xs text-gray-500 font-medium">
          <span>WhereMyTaxGoes.app</span>
          <span>Build transparently.</span>
        </div>
      </div>
    </PageTransition>
  );
}
