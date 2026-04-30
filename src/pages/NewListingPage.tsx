import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { api, Category } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Icon from "@/components/ui/icon"
import { toast } from "sonner"

export default function NewListingPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    city: "",
    category_id: 0,
  })
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [imageInput, setImageInput] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.getCategories().then((cats) => {
      setCategories(cats)
      if (cats.length > 0) setForm((p) => ({ ...p, category_id: cats[0].id }))
    })
  }, [])

  useEffect(() => {
    if (!authLoading && !user) navigate("/login")
  }, [authLoading, user, navigate])

  function addImage() {
    const url = imageInput.trim()
    if (!url) return
    setImageUrls((p) => [...p, url])
    setImageInput("")
  }

  function removeImage(i: number) {
    setImageUrls((p) => p.filter((_, idx) => idx !== i))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.description.trim() || !form.category_id) {
      toast.error("Заполните название, описание и категорию")
      return
    }
    setLoading(true)
    try {
      const id = await api.createListing({
        title: form.title.trim(),
        description: form.description.trim(),
        price: form.price ? Number(form.price) : null,
        city: form.city.trim(),
        category_id: form.category_id,
        images: imageUrls,
      })
      toast.success("Объявление создано")
      navigate(`/listing/${id}`)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-3 py-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Новое объявление</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Категория *</Label>
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: Number(e.target.value) })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Название *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Что продаёте?"
                maxLength={200}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Описание *</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Расскажите о товаре или услуге"
                rows={6}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="price">Цена (₽)</Label>
                <Input
                  id="price"
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0"
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Город</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Москва"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Фото (ссылки на изображения)</Label>
              <div className="flex gap-2">
                <Input
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  placeholder="https://..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addImage()
                    }
                  }}
                />
                <Button type="button" onClick={addImage} variant="outline">
                  <Icon name="Plus" size={16} />
                </Button>
              </div>
              {imageUrls.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                  {imageUrls.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-md overflow-hidden border">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"
                      >
                        <Icon name="X" size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Публикация..." : "Опубликовать"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
