import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext";
import "./layout.css";

function isAdminUser(user) {
  if (!user) return false;
  return user.is_admin === true || user.is_admin === 1;
}

export default function Layout({ children }) {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="ms-shell">
      <header className="ms-topbar">
        <div className="ms-container ms-topbar__inner">
          <div className="ms-brand">
            <div className="ms-brand__mark" aria-hidden="true" />
            <div className="ms-brand__text">
              <div className="ms-brand__name">MobileShop</div>
              <div className="ms-brand__tag">Phones, accessories, and deals</div>
            </div>
          </div>

          <div className="ms-topbar__right">
            <nav className="ms-nav" aria-label="Primary">
              <Link className="ms-nav__link" to="/">
                Home
              </Link>
              <Link className="ms-nav__link" to="/#catalog">
                Products
              </Link>
              <Link className="ms-nav__link" to="/orders">
                My orders
              </Link>
              <Link className="ms-nav__link" to="/support">
                Support
              </Link>
              {isAdminUser(user) ? (
                <Link className="ms-nav__link" to="/admin">
                  Admin
                </Link>
              ) : null}
            </nav>

            <div className="ms-auth" aria-label="Account">
              {user ? (
                <>
                  <div className="ms-auth__user" title={user.email}>
                    {user.name || user.email}
                  </div>
                  <button className="ms-auth__link ms-auth__button" type="button" onClick={logout}>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link className="ms-auth__link" to="/login">
                    Login
                  </Link>
                  <Link className="ms-auth__cta" to="/signup">
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="ms-main">
        <div className="ms-container">{children}</div>
      </main>

      <footer className="ms-footer">
        <div className="ms-container ms-footer__inner">
          <div className="ms-footer__left">© {new Date().getFullYear()} MobileShop</div>
          <div className="ms-footer__right">Built with React + Express</div>
        </div>
      </footer>
    </div>
  );
}

