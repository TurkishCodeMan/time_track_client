import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface InventoryItem {
  id: number
  name: string
  description: string
  quantity: number
  unit: string
  image: string | null
  image_url: string | null
  min_quantity: number
  created_at: string
  updated_at: string
}

interface InventoryTransaction {
  id: number
  item: number
  item_name: string
  quantity: number
  transaction_type: 'IN' | 'OUT'
  transaction_type_display: string
  notes: string
  created_at: string
}

const getFullImageUrl = (url: string | null) => {
  if (!url) return null
  if (url.startsWith('http')) return url
  return `https://wersiyon44.pythonanywhere.com${url}`
}

export const useInventory = () => {
  const queryClient = useQueryClient()

  const { data: items = [], isLoading } = useQuery<InventoryItem[]>({
    queryKey: ['inventory'],
    queryFn: async () => {
      const response = await api.get('/inventory/items/')
      return response.data.map((item: InventoryItem) => ({
        ...item,
        image_url: getFullImageUrl(item.image_url)
      }))
    },
  })

  const addItem = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await api.post('/inventory/items/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })

  const updateItem = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FormData }) => {
      const response = await api.patch(`/inventory/items/${id}/`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })

  const deleteItem = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/inventory/items/${id}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })

  const addStock = useMutation({
    mutationFn: async ({ id, quantity, notes }: { id: number; quantity: number; notes?: string }) => {
      const response = await api.post(`/inventory/items/${id}/add_stock/`, { quantity, notes })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })

  const removeStock = useMutation({
    mutationFn: async ({ id, quantity, notes }: { id: number; quantity: number; notes?: string }) => {
      const response = await api.post(`/inventory/items/${id}/remove_stock/`, { quantity, notes })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })

  return {
    items,
    isLoading,
    addItem,
    updateItem,
    deleteItem,
    addStock,
    removeStock,
  }
}

export const useInventoryTransactions = (itemId?: number) => {
  const { data: transactions = [], isLoading } = useQuery<InventoryTransaction[]>({
    queryKey: ['inventory-transactions', itemId],
    queryFn: async () => {
      const response = await api.get('/inventory/transactions/', {
        params: itemId ? { item: itemId } : undefined,
      })
      return response.data
    },
  })

  return {
    transactions,
    isLoading,
  }
} 