import './App.css';
import Layout from './components/Layout';
import { Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import SupportPage from './pages/SupportPage';
import OrdersPage from './pages/OrdersPage';
import RequireAuth from './routes/RequireAuth';

function App() {
  return (
    <Layout>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route
            path="/orders"
            element={
              <RequireAuth>
                <OrdersPage />
              </RequireAuth>
            }
          />
        </Routes>
      </div>
    </Layout>
  );
}

export default App;

