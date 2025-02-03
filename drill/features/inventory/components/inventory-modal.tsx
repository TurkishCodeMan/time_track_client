import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useInventory } from "../hooks/useInventory"

interface InventoryModalProps {
  isOpen: boolean
  onClose: () => void
  editItem?: {
    id: number
    name: string
    description: string
    min_quantity: number
    unit: string
  }
}

export function InventoryModal({ isOpen, onClose, editItem }: InventoryModalProps) {
  const { toast } = useToast()
  const { addItem, updateItem } = useInventory()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: editItem?.name || "",
    description: editItem?.description || "",
    min_quantity: editItem?.min_quantity || 0,
    unit: editItem?.unit || "ADET",
    image: null as File | null,
  })

  useEffect(() => {
    if (editItem) {
      setFormData({
        name: editItem.name,
        description: editItem.description,
        min_quantity: editItem.min_quantity,
        unit: editItem.unit,
        image: null,
      })
    } else {
      setFormData({
        name: "",
        description: "",
        min_quantity: 0,
        unit: "ADET",
        image: null,
      })
    }
  }, [editItem])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const data = new FormData()
      data.append("name", formData.name)
      data.append("description", formData.description)
      data.append("min_quantity", formData.min_quantity.toString())
      data.append("unit", formData.unit)
      if (formData.image) {
        data.append("image", formData.image, formData.image.name)
      }

      if (editItem) {
        await updateItem.mutateAsync({ id: editItem.id, data })
        toast({
          title: "Başarılı",
          description: "Malzeme başarıyla güncellendi",
        })
      } else {
        await addItem.mutateAsync(data)
        toast({
          title: "Başarılı",
          description: "Yeni malzeme başarıyla eklendi",
        })
      }

      onClose()
      setFormData({
        name: "",
        description: "",
        min_quantity: 0,
        unit: "ADET",
        image: null,
      })
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.response?.data?.error || "Bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editItem ? "Malzeme Düzenle" : "Yeni Malzeme Ekle"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Malzeme Adı</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min_quantity">Minimum Miktar</Label>
              <Input
                id="min_quantity"
                type="number"
                min="0"
                value={formData.min_quantity}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, min_quantity: parseInt(e.target.value) || 0 }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Birim</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, unit: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADET">Adet</SelectItem>
                  <SelectItem value="KG">Kilogram</SelectItem>
                  <SelectItem value="LT">Litre</SelectItem>
                  <SelectItem value="MT">Metre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Fotoğraf {editItem && "(Değiştirmek istemiyorsanız boş bırakın)"}</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, image: e.target.files ? e.target.files[0] : null }))
              }
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Kaydediliyor..." : editItem ? "Güncelle" : "Ekle"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 