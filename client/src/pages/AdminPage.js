import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "../components/products.css";
import "./admin.css";
import { useNotification } from "../ui/NotificationContext";
import ConfirmActionDialog from "../ui/components/ConfirmActionDialog";

const emptyForm = { name: "", description: "", price: "", stock: "0" };

export default function AdminPage() {
  const { showToast } = useNotification();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addForm, setAddForm] = useState(() => ({ ...emptyForm }));
  const [addBusy, setAddBusy] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(() => ({ ...emptyForm }));
  const [editBusy, setEditBusy] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const loadProducts = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const res = await axios.get("/products");
      const payload = res?.data;
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.items)
          ? payload.items
          : [];
      setProducts(list);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  async function onAddSubmit(e) {
    e.preventDefault();
    setAddBusy(true);
    setError("");
    try {
      await axios.post("/products", {
        name: addForm.name.trim(),
        description: addForm.description.trim(),
        price: Number(addForm.price),
        stock: addForm.stock,
      });
      setAddForm({ ...emptyForm });
      await loadProducts();
      showToast("Product added.", "success");
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Could not add product.");
    } finally {
      setAddBusy(false);
    }
  }

  function startEdit(p) {
    setEditId(p.id);
    setEditForm({
      name: String(p.name ?? p.NAME ?? ""),
      description: String(p.description ?? ""),
      price: String(p.price ?? ""),
      stock: String(p.stock ?? "0"),
    });
  }

  function cancelEdit() {
    setEditId(null);
    setEditForm({ ...emptyForm });
  }

  async function saveEdit(e) {
    e.preventDefault();
    if (!editId) return;
    setEditBusy(true);
    setError("");
    try {
      await axios.put(`/products/${editId}`, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        price: Number(editForm.price),
        stock: editForm.stock,
      });
      cancelEdit();
      await loadProducts();
      showToast("Product updated.", "success");
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Could not update product.");
    } finally {
      setEditBusy(false);
    }
  }

  async function removeProduct(id) {
    setDeleteId(id);
    setError("");
    try {
      await axios.delete(`/products/${id}`);
      if (editId === id) cancelEdit();
      await loadProducts();
      showToast("Product removed.", "success");
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Could not delete product.");
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div className="ms-adminPage">
      <div className="ms-authHeader">
        <h1 className="ms-authTitle">Admin</h1>
        <p className="ms-authSubtitle">Add, edit, or remove products. Changes appear on the home catalog.</p>
      </div>

      <div className="ms-panel" style={{ marginBottom: 14 }}>
        <div className="ms-panel__header">
          <div className="ms-panel__title">Add product</div>
          <div className="ms-panel__subtle">Name and price are required</div>
        </div>
        <div className="ms-panel__body">
          <form className="ms-form ms-adminForm" onSubmit={onAddSubmit}>
            <div className="ms-formRow">
              <div className="ms-formLabel">Name</div>
              <input
                className="ms-input"
                value={addForm.name}
                onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. iPhone 16"
                required
              />
            </div>
            <div className="ms-formRow">
              <div className="ms-formLabel">Description</div>
              <input
                className="ms-input"
                value={addForm.description}
                onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Short summary"
              />
            </div>
            <div className="ms-adminForm__row2">
              <div className="ms-formRow">
                <div className="ms-formLabel">Price (USD)</div>
                <input
                  className="ms-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={addForm.price}
                  onChange={(e) => setAddForm((f) => ({ ...f, price: e.target.value }))}
                  required
                />
              </div>
              <div className="ms-formRow">
                <div className="ms-formLabel">Stock</div>
                <input
                  className="ms-input"
                  type="number"
                  min="0"
                  step="1"
                  value={addForm.stock}
                  onChange={(e) => setAddForm((f) => ({ ...f, stock: e.target.value }))}
                />
              </div>
            </div>
            <button className="ms-btn ms-btn--primary" type="submit" disabled={addBusy}>
              {addBusy ? "Adding…" : "Add product"}
            </button>
          </form>
        </div>
      </div>

      <div className="ms-panel">
        <div className="ms-panel__header">
          <div className="ms-panel__title">Catalog</div>
          <div className="ms-panel__subtle">
            <Link to="/" className="ms-adminBack">
              ← Back to shop
            </Link>
          </div>
        </div>
        <div className="ms-panel__body ms-adminTableWrap">
          {error ? <div className="ms-formError" style={{ marginBottom: 12 }}>{error}</div> : null}
          {loading ? (
            <div className="ms-state">Loading…</div>
          ) : products.length === 0 ? (
            <div className="ms-state">No products yet. Add one above.</div>
          ) : (
            <table className="ms-adminTable">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const name = p.name ?? p.NAME ?? "";
                  const isEditing = editId === p.id;
                  return (
                    <tr key={p.id}>
                      <td>
                        {isEditing ? (
                          <input
                            className="ms-input ms-input--table"
                            value={editForm.name}
                            onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                          />
                        ) : (
                          name
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            className="ms-input ms-input--table"
                            value={editForm.description}
                            onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                          />
                        ) : (
                          (p.description || "—")
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            className="ms-input ms-input--table"
                            type="number"
                            min="0"
                            step="0.01"
                            value={editForm.price}
                            onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                          />
                        ) : (
                          `$${Number(p.price || 0).toFixed(2)}`
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            className="ms-input ms-input--table"
                            type="number"
                            min="0"
                            step="1"
                            value={editForm.stock}
                            onChange={(e) => setEditForm((f) => ({ ...f, stock: e.target.value }))}
                          />
                        ) : (
                          p.stock ?? "0"
                        )}
                      </td>
                      <td className="ms-adminTable__actions">
                        {isEditing ? (
                          <>
                            <button
                              className="ms-btn ms-btn--mini ms-btn--primary"
                              type="button"
                              disabled={editBusy}
                              onClick={saveEdit}
                            >
                              {editBusy ? "Saving…" : "Save"}
                            </button>
                            <button className="ms-btn ms-btn--mini" type="button" onClick={cancelEdit} disabled={editBusy}>
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button className="ms-btn ms-btn--mini" type="button" onClick={() => startEdit(p)}>
                              Edit
                            </button>
                            <button className="ms-btn ms-btn--mini" type="button" onClick={() => setPendingDeleteId(p.id)} disabled={deleteId === p.id}>
                              {deleteId === p.id ? "…" : "Remove"}
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <ConfirmActionDialog
        open={Boolean(pendingDeleteId)}
        title="Delete product"
        description="This action will permanently remove this product from the catalog."
        confirmLabel="Delete"
        confirmColor="error"
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          const id = pendingDeleteId;
          setPendingDeleteId(null);
          if (id) removeProduct(id);
        }}
      />
    </div>
  );
}
