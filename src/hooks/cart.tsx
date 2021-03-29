import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const items = await AsyncStorage.getItem('@GoMarketplace:products');

      if (items) {
        setProducts(JSON.parse(items));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const checkProductExists = products.findIndex(item => {
        return item.title === product.title;
      });

      if (checkProductExists === -1) {
        const { id, title, image_url, price } = product;
        const newProduct = {
          id,
          title,
          image_url,
          price,
          quantity: 1,
        };

        setProducts([...products, newProduct]);
      } else {
        const items = products.map(item => {
          if (product.title === item.title) {
            const { id, title, image_url, price, quantity } = item;
            const newProduct = {
              id,
              title,
              image_url,
              price,
              quantity: quantity + 1,
            };

            return newProduct;
          }

          return item;
        });

        setProducts(items);
      }
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const items = products.map(item => {
        if (id === item.id) {
          const { title, image_url, price, quantity } = item;
          const newProducts = {
            id,
            title,
            image_url,
            price,
            quantity: quantity + 1,
          };

          return newProducts;
        }

        return item;
      });

      setProducts(items);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const items = products.map(item => {
        if (id === item.id) {
          const { title, image_url, price, quantity } = item;

          const newProduct = {
            id,
            title,
            image_url,
            price,
            quantity: quantity - 1,
          };

          if (newProduct.quantity > 0) {
            return newProduct;
          }

          return undefined;
        }
        return item;
      });

      const filtered = items.filter(Boolean);

      setProducts(filtered as Product[]);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
