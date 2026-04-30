import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Toaster } from "sonner"
import AuthProvider from "@/lib/auth-context"
import Header from "@/components/Header"
import HomePage from "@/pages/HomePage"
import LoginPage from "@/pages/LoginPage"
import RegisterPage from "@/pages/RegisterPage"
import CatalogPage from "@/pages/CatalogPage"
import ListingPage from "@/pages/ListingPage"
import NewListingPage from "@/pages/NewListingPage"
import CabinetPage from "@/pages/CabinetPage"

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-background flex flex-col">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/catalog" element={<CatalogPage />} />
              <Route path="/listing/:id" element={<ListingPage />} />
              <Route path="/new" element={<NewListingPage />} />
              <Route path="/cabinet" element={<CabinetPage />} />
            </Routes>
          </main>
        </div>
        <Toaster position="top-center" richColors />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
