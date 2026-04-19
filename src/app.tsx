import React from 'react'
import { UserProvider } from './context/UserContext'
import { CartProvider } from './context/CartContext'

function App(props) {
  const { children } = props
  return (
    <UserProvider>
      <CartProvider>
        {children}
      </CartProvider>
    </UserProvider>
  )
}

export default App
