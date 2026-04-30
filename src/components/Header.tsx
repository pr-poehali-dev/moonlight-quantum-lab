import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import { useAuth } from "@/lib/auth-context"

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-14 items-center gap-3 px-3">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Icon name="ShoppingBag" size={18} className="text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">Рынок</span>
        </Link>

        <div className="flex-1" />

        <Button
          size="sm"
          onClick={() => navigate(user ? "/new" : "/login")}
          className="hidden sm:inline-flex"
        >
          <Icon name="Plus" size={16} />
          Разместить
        </Button>

        {user ? (
          <>
            <Button variant="ghost" size="icon" onClick={() => navigate("/cabinet")} title="Кабинет">
              <Icon name="User" size={20} />
            </Button>
            <Button variant="ghost" size="icon" onClick={logout} title="Выход" className="hidden sm:inline-flex">
              <Icon name="LogOut" size={20} />
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
              Войти
            </Button>
          </>
        )}

        <Button
          size="icon"
          onClick={() => navigate(user ? "/new" : "/login")}
          className="sm:hidden"
          title="Разместить"
        >
          <Icon name="Plus" size={18} />
        </Button>
      </div>
    </header>
  )
}
