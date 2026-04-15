import React from "react";
import { Link, useParams } from "react-router-dom";

export default function ProductDetailsPage() {
  const { id } = useParams();

  return (
    <section style={{ padding: "1rem" }}>
      <h2>Product Details</h2>
      <p>Dynamic route loaded for product id: {id}</p>
      <Link to="/#catalog">Back to catalog</Link>
    </section>
  );
}
