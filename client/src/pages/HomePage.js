import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Products from "../components/products";

export default function HomePage() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash === "#catalog") {
      const el = document.getElementById("catalog");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  }, [location.hash]);

  return <Products />;
}

