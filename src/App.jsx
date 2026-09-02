// src/App.jsx
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext'; // ✅ Import ToastProvider

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider> {/* ✅ Wrap with ToastProvider */}
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;