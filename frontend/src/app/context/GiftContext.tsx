import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AuthRole, DeliveryRoutePoint, DeliveryRouteStop } from "@/lib/api";
import {
  AUTH_EVENT,
  getNumericUserIdFromAuthUser,
  getRoleFromUser,
  getUserDisplayName,
  readStoredAuthState,
  signInWithPassword as authSignInWithPassword,
  signOut as authSignOut,
  signUpWithPassword as authSignUpWithPassword,
  type AppRole,
  type StoredAuthState,
  verifyStoredSession,
} from "@/lib/auth";

export interface GiftParams {
  occasion: string;
  recipient: string;
  budget: number;
  timeSlot: "morning" | "afternoon" | "evening";
}

export interface Product {
  id: number | string;
  name: string;
  store: string;
  location: string;
  price: number;
  match: number;
  badge?: string;
  image: string;
  tags: string[];
  category?: string;
  stock?: number;
  explanation?: string;
}

export interface OrderDetails {
  riderName: string;
  riderId: string;
  riderArea: string;
  riderDistance: string;
  address: string;
  orderId: string;
  orderDate: string;
  estimatedTime: string;
  etaMinutes: string;
  assignmentReason: string;
  routePath: DeliveryRoutePoint[];
  routeStops: DeliveryRouteStop[];
}

export interface OrderHistoryItem {
  id: string;
  gift: string;
  store: string;
  date: string;
  total: number;
  status: "active" | "delivered" | "pending";
  rider: string;
  occasion: string;
  rating: number | null;
}

interface GiftContextType {
  giftParams: GiftParams;
  setGiftParams: (params: GiftParams) => void;
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;
  recommendations: Product[];
  setRecommendations: (products: Product[]) => void;
  orderDetails: OrderDetails;
  setOrderDetails: (details: OrderDetails) => void;
  orderHistory: OrderHistoryItem[];
  addOrderHistoryItem: (item: OrderHistoryItem) => void;
  authLoading: boolean;
  isAuthenticated: boolean;
  authRole: AppRole;
  numericUserId: number;
  signIn: (email: string, password: string) => Promise<AppRole>;
  signUp: (email: string, password: string, role: AuthRole) => Promise<{ emailConfirmationRequired: boolean; role: AppRole }>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  userName: string;
  setUserName: (name: string) => void;
}

const ORDERS_STORAGE_KEY = "zippo.order.history";

const defaultGiftParams: GiftParams = {
  occasion: "Birthday",
  recipient: "Parent",
  budget: 500,
  timeSlot: "morning",
};

const defaultOrderDetails: OrderDetails = {
  riderName: "Carlos Reyes",
  riderId: "#04",
  riderArea: "East Bajac-Bajac",
  riderDistance: "1.2 km away",
  address: "123 Rizal St, Barangay 5, Olongapo",
  orderId: "ZIP-2026-0041",
  orderDate: "May 6, 9:45 AM",
  estimatedTime: "8:00 AM - 12:00 PM",
  etaMinutes: "25 min",
  assignmentReason: "Closest available rider for your selected time slot.",
  routePath: [],
  routeStops: [],
};

function readStoredOrders(): OrderHistoryItem[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(ORDERS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OrderHistoryItem[]) : [];
  } catch {
    return [];
  }
}

function writeStoredOrders(items: OrderHistoryItem[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(items));
}

const GiftContext = createContext<GiftContextType>({
  giftParams: defaultGiftParams,
  setGiftParams: () => {},
  selectedProduct: null,
  setSelectedProduct: () => {},
  recommendations: [],
  setRecommendations: () => {},
  orderDetails: defaultOrderDetails,
  setOrderDetails: () => {},
  orderHistory: [],
  addOrderHistoryItem: () => {},
  authLoading: true,
  isAuthenticated: false,
  authRole: "guest",
  numericUserId: 0,
  signIn: async () => "guest",
  signUp: async () => ({ emailConfirmationRequired: false, role: "guest" }),
  signOut: async () => {},
  refreshAuth: async () => {},
  userName: "Juan Santos",
  setUserName: () => {},
});

export const GiftProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [giftParams, setGiftParams] = useState<GiftParams>(defaultGiftParams);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [orderDetails, setOrderDetails] = useState<OrderDetails>(defaultOrderDetails);
  const [userName, setUserName] = useState("Juan Santos");
  const [authState, setAuthState] = useState<StoredAuthState | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>(() => readStoredOrders());

  const refreshAuth = useCallback(async () => {
    setAuthLoading(true);
    const verified = await verifyStoredSession();
    setAuthState(verified);
    if (verified?.user) {
      setUserName(getUserDisplayName(verified.user));
    }
    setAuthLoading(false);
  }, []);

  useEffect(() => {
    void refreshAuth();

    const syncFromStorage = () => {
      const stored = readStoredAuthState();
      setAuthState(stored);
      if (stored?.user) {
        setUserName(getUserDisplayName(stored.user));
      }
      setAuthLoading(false);
    };

    if (typeof window !== "undefined") {
      window.addEventListener(AUTH_EVENT, syncFromStorage);
      window.addEventListener("storage", syncFromStorage);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(AUTH_EVENT, syncFromStorage);
        window.removeEventListener("storage", syncFromStorage);
      }
    };
  }, [refreshAuth]);

  useEffect(() => {
    writeStoredOrders(orderHistory);
  }, [orderHistory]);

  const signIn = useCallback(async (email: string, password: string) => {
    const user = await authSignInWithPassword({ email, password });
    const role = getRoleFromUser(user);
    setAuthState(readStoredAuthState());
    setUserName(getUserDisplayName(user));
    return role;
  }, []);

  const signUp = useCallback(async (email: string, password: string, role: AuthRole) => {
    const result = await authSignUpWithPassword({ email, password, role });
    setAuthState(readStoredAuthState());
    const nextRole = getRoleFromUser(result.user);
    if (result.user) {
      setUserName(getUserDisplayName(result.user));
    }
    return { emailConfirmationRequired: result.emailConfirmationRequired, role: nextRole };
  }, []);

  const signOut = useCallback(async () => {
    await authSignOut();
    setAuthState(null);
    setRecommendations([]);
    setSelectedProduct(null);
  }, []);

  const addOrderHistoryItem = useCallback((item: OrderHistoryItem) => {
    setOrderHistory((prev) => [item, ...prev]);
  }, []);

  const authRole = useMemo(() => getRoleFromUser(authState?.user ?? null), [authState?.user]);
  const numericUserId = useMemo(() => getNumericUserIdFromAuthUser(authState?.user ?? null), [authState?.user]);
  const isAuthenticated = Boolean(authState?.session?.access_token);

  return (
    <GiftContext.Provider
      value={{
        giftParams,
        setGiftParams,
        selectedProduct,
        setSelectedProduct,
        recommendations,
        setRecommendations,
        orderDetails,
        setOrderDetails,
        orderHistory,
        addOrderHistoryItem,
        authLoading,
        isAuthenticated,
        authRole,
        numericUserId,
        signIn,
        signUp,
        signOut,
        refreshAuth,
        userName,
        setUserName,
      }}
    >
      {children}
    </GiftContext.Provider>
  );
};

export const useGift = () => useContext(GiftContext);
