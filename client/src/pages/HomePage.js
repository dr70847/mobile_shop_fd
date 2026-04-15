import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Products from "../components/products";
import { clearFilters } from "../store/catalogSlice";

export default function HomePage() {
  const location = useLocation();
  const dispatch = useDispatch();
  const { category, searchTerm } = useSelector((state) => state.catalog);

  useEffect(() => {
    if (location.hash === "#catalog") {
      const el = document.getElementById("catalog");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  }, [location.hash]);

  useEffect(() => {
    if (location.pathname === "/") {
      dispatch(clearFilters());
    }
  }, [dispatch, location.pathname]);

  return (
    <>
      <div style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}>
        Active filters: category={category}, search={searchTerm || "none"}
      </div>
      <Products />
    </>
  );
}

