import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Box, Card, CardContent, Chip, Grid, Stack, Typography } from "@mui/material";

const LOW_STOCK_THRESHOLD = 5;

function asItems(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

export default function ManagerPage() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadManagerData() {
      setLoading(true);
      setError("");
      try {
        const [productsRes, ordersRes, usersRes] = await Promise.all([
          axios.get("/products"),
          axios.get("/orders"),
          axios.get("/api/v1/users").catch(() => ({ data: [] })),
        ]);
        if (cancelled) return;
        setProducts(asItems(productsRes.data));
        setOrders(asItems(ordersRes.data));
        setUsers(asItems(usersRes.data));
      } catch (err) {
        if (cancelled) return;
        setError(err?.response?.data?.message || err?.message || "Could not load manager metrics.");
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    }
    loadManagerData();
    return () => {
      cancelled = true;
    };
  }, []);

  const kpis = useMemo(() => {
    const totalProducts = products.length;
    const totalUnits = products.reduce((sum, p) => sum + Number(p.stock || 0), 0);
    const lowStockItems = products.filter((p) => Number(p.stock || 0) <= LOW_STOCK_THRESHOLD);
    const inventoryValue = products.reduce(
      (sum, p) => sum + Number(p.price || 0) * Number(p.stock || 0),
      0
    );
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) =>
      ["NEW", "PENDING_PAYMENT"].includes(String(o.STATUS || o.status || "").toUpperCase())
    ).length;
    const activeUsers = users.filter((u) => Boolean(u.is_active)).length;
    return {
      totalProducts,
      totalUnits,
      lowStockCount: lowStockItems.length,
      inventoryValue,
      totalOrders,
      pendingOrders,
      activeUsers,
      lowStockItems,
      topProducts: [...products]
        .sort((a, b) => Number(b.stock || 0) * Number(b.price || 0) - Number(a.stock || 0) * Number(a.price || 0))
        .slice(0, 5),
      recentOrders: [...orders]
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .slice(0, 6),
    };
  }, [orders, products, users]);

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
        Manager Dashboard
      </Typography>
      <Typography variant="body1" sx={{ mb: 3, opacity: 0.8 }}>
        Live commercial view: inventory health, order pressure, and operational actions.
      </Typography>

      {error ? (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          </CardContent>
        </Card>
      ) : null}

      <Grid container spacing={2}>
        {[
          { label: "Catalog products", value: kpis.totalProducts, tone: "success" },
          { label: "Inventory units", value: kpis.totalUnits, tone: "success" },
          { label: "Low stock SKUs", value: kpis.lowStockCount, tone: kpis.lowStockCount > 0 ? "warning" : "success" },
          { label: "Inventory value", value: `$${kpis.inventoryValue.toFixed(2)}`, tone: "info" },
          { label: "Total orders", value: kpis.totalOrders, tone: "info" },
          { label: "Orders pending", value: kpis.pendingOrders, tone: kpis.pendingOrders > 0 ? "warning" : "success" },
          { label: "Active users", value: kpis.activeUsers, tone: "success" },
        ].map((item) => (
          <Grid key={item.label} item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {item.label}
                </Typography>
                <Typography variant="h5" sx={{ mt: 1, fontWeight: 700 }}>
                  {loading ? "..." : item.value}
                </Typography>
                <Chip label="Live" color={item.tone} size="small" sx={{ mt: 2 }} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Low stock action list
              </Typography>
              {kpis.lowStockItems.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  All products are above the low-stock threshold.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {kpis.lowStockItems.map((p) => (
                    <Box key={p.id} sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                      <Typography variant="body2">{p.name || p.NAME}</Typography>
                      <Chip
                        size="small"
                        color={Number(p.stock || 0) === 0 ? "error" : "warning"}
                        label={`Stock: ${Number(p.stock || 0)}`}
                      />
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Highest inventory value
              </Typography>
              <Stack spacing={1}>
                {kpis.topProducts.map((p) => (
                  <Box key={p.id} sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                    <Typography variant="body2">{p.name || p.NAME}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      ${(Number(p.price || 0) * Number(p.stock || 0)).toFixed(2)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Recent orders
              </Typography>
              {kpis.recentOrders.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No orders available yet.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {kpis.recentOrders.map((o) => (
                    <Box key={o.id} sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                      <Typography variant="body2">Order #{o.id}</Typography>
                      <Chip size="small" label={String(o.STATUS || o.status || "NEW")} />
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Quick actions
              </Typography>
              <Stack spacing={1.5}>
                <Typography variant="body2">
                  <Link to="/admin">Open admin catalog controls</Link>
                </Typography>
                <Typography variant="body2">
                  <Link to="/orders">Review order history</Link>
                </Typography>
                <Typography variant="body2">
                  <Link to="/">Check customer storefront</Link>
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
