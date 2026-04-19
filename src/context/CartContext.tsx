import React, { createContext, useContext, useState, ReactNode } from 'react'

interface CartItem {
  dish_id: number
  name: string
  price: number
  quantity: number
}

interface ChefProfile {
  id: number
  name: string
  avatar?: string
}

interface CartContextType {
  items: CartItem[]
  totalCount: number
  totalPrice: number
  chefId: number | null
  chefProfile: ChefProfile | null
  addItem: (item: CartItem, chefId: number, profile?: Omit<ChefProfile, 'id'>) => void
  setChefProfile: (chefId: number, profile?: Omit<ChefProfile, 'id'>) => void
  removeItem: (dishId: number) => void
  updateQuantity: (dishId: number, quantity: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([])
  const [chefId, setChefId] = useState<number | null>(null)
  const [chefProfile, setChefProfileState] = useState<ChefProfile | null>(null)

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const setChefProfile = (newChefId: number, profile?: Omit<ChefProfile, 'id'>) => {
    const name = profile?.name?.trim() || `大厨${newChefId}`
    setChefProfileState({
      id: newChefId,
      name,
      avatar: profile?.avatar || ''
    })
  }

  const addItem = (item: CartItem, newChefId: number, profile?: Omit<ChefProfile, 'id'>) => {
    if (chefId !== null && chefId !== newChefId) {
      setItems([item])
      setChefId(newChefId)
      setChefProfile(newChefId, profile)
      return
    }

    setChefId(newChefId)
    if (!chefProfile || chefProfile.id !== newChefId || profile?.name || profile?.avatar) {
      setChefProfile(newChefId, profile ?? { name: chefProfile?.name || `大厨${newChefId}`, avatar: chefProfile?.avatar })
    }
    setItems(prevItems => {
      const existingItem = prevItems.find(i => i.dish_id === item.dish_id)
      if (existingItem) {
        return prevItems.map(i =>
          i.dish_id === item.dish_id
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        )
      }
      return [...prevItems, item]
    })
  }

  const removeItem = (dishId: number) => {
    setItems(prevItems => prevItems.filter(item => item.dish_id !== dishId))
  }

  const updateQuantity = (dishId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(dishId)
      return
    }
    setItems(prevItems =>
      prevItems.map(item =>
        item.dish_id === dishId ? { ...item, quantity } : item
      )
    )
  }

  const clearCart = () => {
    setItems([])
    setChefId(null)
    setChefProfileState(null)
  }

  return (
    <CartContext.Provider
      value={{
        items,
        totalCount,
        totalPrice,
        chefId,
        chefProfile,
        addItem,
        setChefProfile,
        removeItem,
        updateQuantity,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
