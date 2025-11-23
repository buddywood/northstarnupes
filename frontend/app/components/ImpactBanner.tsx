"use client";

import { useEffect, useState } from "react";
import { fetchTotalDonations } from "@/lib/api";
import Skeleton from "./Skeleton";

export default function ImpactBanner() {
  const [totalDonations, setTotalDonations] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayedAmount, setDisplayedAmount] = useState(0);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    fetchTotalDonations()
      .then((cents) => {
        setTotalDonations(cents);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching donations:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (loading) {
      setDisplayedAmount(0);
      return;
    }

    const target = totalDonations ?? 0;
    const duration = 800;
    const start = 0;
    const startTime = performance.now();

    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const value = Math.round(start + (target - start) * progress);
      setDisplayedAmount(value);
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }, [loading, totalDonations]);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  // Get current quarter
  const getCurrentQuarter = () => {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3) + 1;
    const year = now.getFullYear();
    return `Q${quarter} ${year}`;
  };

  // Always show the banner, even if loading or no data

  return (
    <section
      className="max-w-7xl mx-auto px-4 py-8"
      aria-labelledby="impact-heading"
      role="status"
    >
      <div className="bg-aurora-gold/20 rounded-2xl border border-crimson/20 p-6 md:p-8 shadow-sm">
        <div
          className={`transform transition-all duration-500 ease-out ${
            hasMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-crimson/20 flex items-center justify-center flex-shrink-0 animate-pulse">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-crimson"
                >
                  <path
                    d="M12 2 L15 9 L22 10 L16 15 L18 22 L12 18 L6 22 L8 15 L2 10 L9 9 Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <div>
                <h3
                  id="impact-heading"
                  className="text-xl md:text-2xl font-display font-bold text-midnight-navy"
                >
                  Our Impact
                </h3>
                <div className="mt-1 h-1 w-10 rounded-full bg-aurora-gold/70" />
                <p className="text-sm text-midnight-navy/70">
                  Supporting chapters through every purchase
                </p>
                <a
                  href="/impact"
                  className="text-sm font-semibold text-crimson hover:text-crimson/80 transition-colors mt-1 inline-block"
                >
                  Learn how funds are distributed →
                </a>
              </div>
            </div>
            {loading ? (
              <Skeleton variant="text" className="w-32 h-6" />
            ) : (
              <div
                className="inline-block text-center md:text-right"
                aria-live="polite"
                aria-atomic="true"
              >
                <div className="text-3xl md:text-4xl font-display font-bold text-crimson mb-1">
                  {formatCurrency(displayedAmount)}
                </div>
                <p className="text-sm text-midnight-navy/70">
                  given back to chapters this {getCurrentQuarter()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
