"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: unknown;
  }
}

export function fbq(...args: unknown[]) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq(...args);
  }
}

export function trackPurchase(orderNumber: string, value: number, currency = "TND") {
  fbq("track", "Purchase", {
    value,
    currency,
    content_type: "product",
    order_id: orderNumber,
  });
}

export function trackInitiateCheckout(value: number, numItems: number, currency = "TND") {
  fbq("track", "InitiateCheckout", {
    value,
    currency,
    num_items: numItems,
    content_type: "product",
  });
}

export function trackAddToCart(productName: string, value: number, currency = "TND") {
  fbq("track", "AddToCart", {
    content_name: productName,
    value,
    currency,
    content_type: "product",
  });
}

function MetaPixelPageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    fbq("track", "PageView");
  }, [pathname]);

  return null;
}

export function MetaPixel() {
  if (!PIXEL_ID) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">{`
        !function(f,b,e,v,n,t,s){
          if(f.fbq)return;
          n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];
          t=b.createElement(e);t.async=!0;t.src=v;
          s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)
        }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
        fbq('init','${PIXEL_ID}');
        fbq('track','PageView');
      `}</Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1" width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
      <MetaPixelPageTracker />
    </>
  );
}
