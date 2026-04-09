import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { AuthContext } from "../auth/AuthContext";
import "../components/products.css";

export default function OrdersPage() {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get("/orders/my");
        if (!cancelled) setOrders(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message || "Failed to load orders.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="ms-panel">
      <div className="ms-panel__header">
        <div className="ms-panel__title">Orders</div>
        <div className="ms-panel__subtle">{user ? `Signed in as ${user.email}` : ""}</div>
      </div>

      {loading ? (
        <div className="ms-state">Loading orders…</div>
      ) : error ? (
        <div className="ms-state">{error}</div>
      ) : orders.length === 0 ? (
        <div className="ms-state">No orders yet.</div>
      ) : (
        <div className="ms-panel__body">
          <div style={{ display: "grid", gap: 10 }}>
            {orders.map((o) => (
              <div className="ms-supportItem" key={o.id}>
                <div className="ms-supportItem__title">Order #{o.id}</div>
                <div className="ms-supportItem__text">
                  Product ID: {o.product_id} • Qty: {o.quantity} • Date:{" "}
                  {o.created_at ? new Date(o.created_at).toLocaleString() : "-"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

