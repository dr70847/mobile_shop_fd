import React from "react";
import "../components/products.css";

export default function SupportPage() {
  return (
    <div className="ms-panel">
      <div className="ms-panel__header">
        <div className="ms-panel__title">Support</div>
        <div className="ms-panel__subtle">We’re here to help</div>
      </div>

      <div className="ms-panel__body">
        <div className="ms-supportGrid">
          <div className="ms-supportItem">
            <div className="ms-supportItem__title">Delivery</div>
            <div className="ms-supportItem__text">Shipping in 24–48h in most areas.</div>
          </div>
          <div className="ms-supportItem">
            <div className="ms-supportItem__title">Returns</div>
            <div className="ms-supportItem__text">Easy returns within 7 days if unused.</div>
          </div>
          <div className="ms-supportItem">
            <div className="ms-supportItem__title">Warranty</div>
            <div className="ms-supportItem__text">Standard warranty included on all devices.</div>
          </div>
          <div className="ms-supportItem">
            <div className="ms-supportItem__title">Contact</div>
            <div className="ms-supportItem__text">
              Email: support@mobileshop.local • Phone: +1 (000) 000-0000
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

