import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { api, ListingShort } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Icon from "@/components/ui/icon"
import ListingCard from "@/components/ListingCard"

export default function CabinetPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading, logout } = useAuth()
  const [listings, setListings] = useState<ListingShort[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login")
      return
    }
    if (user) {
      api.getListings({ my: "1", limit: "60" }).then((data) => {
        setListings(data)
        setLoading(false)
      })
    }
  }, [user, authLoading, navigate])

  if (!user) return null

  return (
    <div className="container mx-auto px-3 py-4 max-w-5xl">
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Личный кабинет</CardTitle>
            <Button variant="outline" size="sm" onClick={() => { logout(); navigate("/") }}>
              <Icon name="LogOut" size={16} />
              Выход
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <div><span className="text-muted-foreground">Имя:</span> {user.name}</div>
          <div><span className="text-muted-foreground">Email:</span> {user.email}</div>
          {user.phone && <div><span className="text-muted-foreground">Телефон:</span> {user.phone}</div>}
          {user.city && <div><span className="text-muted-foreground">Город:</span> {user.city}</div>}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">Мои объявления</h2>
        <Button onClick={() => navigate("/new")} size="sm">
          <Icon name="Plus" size={16} />
          Новое
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <Icon name="PackageOpen" size={48} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">У вас пока нет объявлений</p>
          <Button onClick={() => navigate("/new")}>Разместить первое</Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  )
}
