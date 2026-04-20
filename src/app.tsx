import React from 'react'
import { UserProvider } from './context/UserContext'
import { CartProvider } from './context/CartContext'
import 'taro-icons/scss/MaterialCommunityIcons.scss'
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
