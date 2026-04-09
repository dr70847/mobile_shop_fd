import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./products.css";
import { AuthContext } from "../auth/AuthContext";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cart, setCart] = useState([]);
  const [checkoutState, setCheckoutState] = useState({ loading: false, error: "", success: "" });
  const { user } = React.useContext(AuthContext);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    axios
      .get("/products")
      .then((res) => {
        if (cancelled) return;
        setProducts(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || "Failed to load products.");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const visible = products.filter((p) => {
    const name = String(p.name ?? p.NAME ?? "").toLowerCase();
    return normalizedQuery ? name.includes(normalizedQuery) : true;
  });

  const total = products.length;
  const avgPrice =
    total === 0
      ? 0
      : products.reduce((sum, p) => sum + Number(p.price || 0), 0) / total;

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((x) => x.product.id === product.id);
      if (existing) {
        return prev.map((x) =>
          x.product.id === product.id ? { ...x, quantity: x.quantity + 1 } : x
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function setQty(productId, quantity) {
    setCart((prev) =>
      prev
        .map((x) => (x.product.id === productId ? { ...x, quantity } : x))
        .filter((x) => x.quantity > 0)
    );
  }

  const cartTotal = cart.reduce((sum, x) => sum + Number(x.product.price || 0) * x.quantity, 0);

  async function checkout() {
    setCheckoutState({ loading: true, error: "", success: "" });
    try {
      const payload = {
        items: cart.map((x) => ({ product_id: x.product.id, quantity: x.quantity })),
      };
      const res = await axios.post("/orders/checkout", payload);
      setCart([]);
      setCheckoutState({ loading: false, error: "", success: `Order #${res.data?.orderId} created!` });
    } catch (err) {
      setCheckoutState({
        loading: false,
        error: err?.response?.data?.message || err?.message || "Checkout failed.",
        success: "",
      });
    }
  }

  return (
    <section id="home">
      <div className="ms-hero">
        <div className="ms-hero__card">
          <div className="ms-hero__content">
            <h1 className="ms-hero__title">Find your next phone.</h1>
            <p className="ms-hero__subtitle">
              Browse curated devices and pricing. Fast API, clean UI, and a smooth
              shopping feel.
            </p>

            <div className="ms-hero__actions">
              <button
                className="ms-btn ms-btn--primary"
                onClick={() => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" })}
              >
                Explore catalog
              </button>
              <button className="ms-btn" onClick={() => setQuery("")}>
                Clear search
              </button>
            </div>
          </div>
        </div>

        <div className="ms-hero__card">
          <div className="ms-kpis">
            <div className="ms-kpi">
              <div className="ms-kpi__label">Products</div>
              <div className="ms-kpi__value">{total}</div>
            </div>
            <div className="ms-kpi">
              <div className="ms-kpi__label">Average price</div>
              <div className="ms-kpi__value">${avgPrice.toFixed(2)}</div>
            </div>
            <div className="ms-kpi">
              <div className="ms-kpi__label">Delivery</div>
              <div className="ms-kpi__value">24–48h</div>
            </div>
            <div className="ms-kpi">
              <div className="ms-kpi__label">Support</div>
              <div className="ms-kpi__value">7 days</div>
            </div>
          </div>
        </div>
      </div>

      <div className="ms-panel" id="products">
        <div className="ms-panel__header">
          <div className="ms-panel__title">Featured</div>
          <div className="ms-panel__subtle">
            Secure checkout • Fast delivery • Easy returns
          </div>
        </div>
        <div className="ms-panel__body">
          <div className="ms-featureRow">
            <div className="ms-feature">
              <div className="ms-feature__title">Best prices</div>
              <div className="ms-feature__text">
                Transparent pricing and offers you can trust.
              </div>
            </div>
            <div className="ms-feature">
              <div className="ms-feature__title">Warranty included</div>
              <div className="ms-feature__text">
                All devices include standard warranty coverage.
              </div>
            </div>
            <div className="ms-feature">
              <div className="ms-feature__title">Quick support</div>
              <div className="ms-feature__text">
                Friendly help for orders, returns, and setup.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="ms-panel" id="catalog" style={{ marginTop: 14 }}>
        <div className="ms-panel__header">
          <div className="ms-panel__title">Products</div>

          <div className="ms-search">
            <input
              className="ms-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search phones…"
              aria-label="Search products"
            />
          </div>
        </div>

        {loading ? (
          <div className="ms-state">Loading products…</div>
        ) : error ? (
          <div className="ms-state">
            Couldn’t load products. Make sure the backend is running and MySQL is
            connected.
            <div style={{ marginTop: 8, color: "rgba(255,255,255,0.55)" }}>
              {error}
            </div>
          </div>
        ) : visible.length === 0 ? (
          <div className="ms-state">No products match your search.</div>
        ) : (
          <div className="ms-grid">
            {visible.map((p) => {
              const name = p.name ?? p.NAME ?? "Unnamed";
              const price = Number(p.price || 0).toFixed(2);
              return (
                <article className="ms-card" key={p.id}>
                  <div className="ms-card__media" aria-hidden="true" />
                  <div className="ms-card__body">
                    <h3 className="ms-card__name">{name}</h3>
                    <div className="ms-card__meta">
                      <div className="ms-price">${price}</div>
                      <button className="ms-btn ms-btn--mini" type="button" onClick={() => addToCart(p)}>
                        Add to cart
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <div className="ms-split" style={{ marginTop: 14 }}>
        <div className="ms-panel">
          <div className="ms-panel__header">
            <div className="ms-panel__title">Cart</div>
            <div className="ms-panel__subtle">{cart.length ? `${cart.length} item(s)` : "Empty"}</div>
          </div>
          {cart.length === 0 ? (
            <div className="ms-state">Add products to your cart to checkout.</div>
          ) : (
            <div className="ms-panel__body">
              <div style={{ display: "grid", gap: 10 }}>
                {cart.map((x) => (
                  <div className="ms-cartRow" key={x.product.id}>
                    <div>
                      <div className="ms-cartRow__title">{x.product.name ?? x.product.NAME}</div>
                      <div className="ms-cartRow__muted">${Number(x.product.price || 0).toFixed(2)} each</div>
                    </div>
                    <div className="ms-cartRow__right">
                      <button className="ms-btn ms-btn--mini" type="button" onClick={() => setQty(x.product.id, x.quantity - 1)}>
                        -
                      </button>
                      <div className="ms-cartRow__qty">{x.quantity}</div>
                      <button className="ms-btn ms-btn--mini" type="button" onClick={() => setQty(x.product.id, x.quantity + 1)}>
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="ms-cartTotal">
                <div>Total</div>
                <div className="ms-price">${cartTotal.toFixed(2)}</div>
              </div>

              {!user ? (
                <div className="ms-note" style={{ marginTop: 10 }}>
                  Please <Link to="/login">login</Link> to checkout.
                </div>
              ) : null}

              <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  className="ms-btn ms-btn--primary"
                  type="button"
                  onClick={checkout}
                  disabled={!user || checkoutState.loading}
                >
                  {checkoutState.loading ? "Creating order…" : "Checkout"}
                </button>
                <button className="ms-btn" type="button" onClick={() => setCart([])} disabled={checkoutState.loading}>
                  Clear cart
                </button>
              </div>

              {checkoutState.error ? <div className="ms-formError">{checkoutState.error}</div> : null}
              {checkoutState.success ? (
                <div className="ms-success" style={{ marginTop: 10 }}>
                  {checkoutState.success}{" "}
                  <Link to="/orders" style={{ textDecoration: "underline" }}>
                    View orders
                  </Link>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {!user ? (
          <div className="ms-panel">
            <div className="ms-panel__header">
              <div className="ms-panel__title">Create an account</div>
              <div className="ms-panel__subtle">Orders, profile, checkout</div>
            </div>
            <div className="ms-panel__body">
              <div className="ms-feature__text">
                Sign up to view your orders and manage your profile.
              </div>
              <div className="ms-btnRow" style={{ marginTop: 12 }}>
                <Link className="ms-btn ms-btn--primary" to="/signup">
                  Sign up
                </Link>
                <Link className="ms-btn" to="/login">
                  Login
                </Link>
              </div>
              <div className="ms-btnRow" style={{ marginTop: 12 }}>
                <Link className="ms-btn" to="/support">
                  Support
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="ms-panel">
            <div className="ms-panel__header">
              <div className="ms-panel__title">Account</div>
              <div className="ms-panel__subtle">You’re logged in</div>
            </div>
            <div className="ms-panel__body">
              <div className="ms-feature__text">
                Checkout is enabled. You can view your order history anytime.
              </div>
              <div className="ms-btnRow" style={{ marginTop: 12 }}>
                <Link className="ms-btn" to="/orders">
                  View my orders
                </Link>
                <Link className="ms-btn" to="/support">
                  Support
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Products;