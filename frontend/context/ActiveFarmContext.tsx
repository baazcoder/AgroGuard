"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  ActiveFarmContextData,
  FarmData,
  fetchActiveFarmContext,
  setActiveFarm as apiSetActiveFarm,
  fetchAllFarms,
  saveFarmBoundary,
  deleteFarm as apiDeleteFarm
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface ActiveFarmContextType {
  activeFarm: ActiveFarmContextData | null;
  farmsList: FarmData[];
  loading: boolean;
  error: string | null;
  selectActiveFarm: (farm_id: number) => Promise<void>;
  refreshActiveFarm: () => Promise<void>;
  createNewFarm: (data: {
    name: string;
    boundary_coordinates?: number[][];
    center_lat?: number;
    center_lon?: number;
    location_name?: string;
    village_locality?: string;
    district?: string;
    state?: string;
    country?: string;
    area_unit?: string;
  }) => Promise<ActiveFarmContextData>;
  deleteFarmById: (farm_id: number) => Promise<void>;
}

const ActiveFarmContext = createContext<ActiveFarmContextType | undefined>(undefined);

export function ActiveFarmProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [activeFarm, setActiveFarmState] = useState<ActiveFarmContextData | null>(null);
  const [farmsList, setFarmsList] = useState<FarmData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const prevUserId = React.useRef<number | undefined>(user?.id);

  // Load Active Farm Context & Farms List whenever user account changes
  useEffect(() => {
    if (prevUserId.current !== user?.id) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("agroguard_active_farm_id");
      }
      prevUserId.current = user?.id;
    }
    initActiveFarm();
  }, [user?.id]);

  const initActiveFarm = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check stored farm_id preference in localStorage
      let savedFarmId: number | undefined = undefined;
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("agroguard_active_farm_id");
        if (stored && !isNaN(Number(stored))) {
          savedFarmId = Number(stored);
        }
      }

      // Fetch active farm context from backend
      const ctxData = await fetchActiveFarmContext(savedFarmId);
      setActiveFarmState(ctxData);

      if (typeof window !== "undefined" && ctxData.farm_id) {
        localStorage.setItem("agroguard_active_farm_id", ctxData.farm_id.toString());
      }

      // Fetch all farms for switcher list
      const allFarms = await fetchAllFarms();
      setFarmsList(allFarms);
    } catch (err: any) {
      console.error("Failed to initialize active farm context:", err);
      setError(err.message || "Failed to load active farm context.");
    } finally {
      setLoading(false);
    }
  };

  const refreshActiveFarm = async () => {
    try {
      const currentId = activeFarm?.farm_id;
      const ctxData = await fetchActiveFarmContext(currentId);
      setActiveFarmState(ctxData);

      const allFarms = await fetchAllFarms();
      setFarmsList(allFarms);
    } catch (err: any) {
      console.error("Error refreshing active farm:", err);
    }
  };

  const selectActiveFarm = async (farm_id: number) => {
    try {
      setLoading(true);
      setError(null);
      const updatedCtx = await apiSetActiveFarm(farm_id);
      setActiveFarmState(updatedCtx);

      if (typeof window !== "undefined") {
        localStorage.setItem("agroguard_active_farm_id", farm_id.toString());
      }

      const allFarms = await fetchAllFarms();
      setFarmsList(allFarms);
    } catch (err: any) {
      console.error(`Failed to switch active farm to ID ${farm_id}:`, err);
      setError(err.message || "Failed to switch active farm.");
    } finally {
      setLoading(false);
    }
  };

  const createNewFarm = async (data: {
    name: string;
    boundary_coordinates?: number[][];
    center_lat?: number;
    center_lon?: number;
    location_name?: string;
    village_locality?: string;
    district?: string;
    state?: string;
    country?: string;
    area_unit?: string;
  }): Promise<ActiveFarmContextData> => {
    try {
      setLoading(true);
      setError(null);

      // Save boundary / new farm
      const newFarmObj = await saveFarmBoundary(data);

      // Set newly created farm as active
      const updatedCtx = await apiSetActiveFarm(newFarmObj.id);
      setActiveFarmState(updatedCtx);

      if (typeof window !== "undefined") {
        localStorage.setItem("agroguard_active_farm_id", newFarmObj.id.toString());
      }

      const allFarms = await fetchAllFarms();
      setFarmsList(allFarms);

      return updatedCtx;
    } catch (err: any) {
      console.error("Failed to create new farm:", err);
      setError(err.message || "Failed to create farm.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteFarmById = async (farm_id: number) => {
    try {
      setLoading(true);
      await apiDeleteFarm(farm_id);

      // Re-initialize active farm after deletion
      await initActiveFarm();
    } catch (err: any) {
      console.error(`Failed to delete farm ${farm_id}:`, err);
      setError(err.message || "Failed to delete farm.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ActiveFarmContext.Provider
      value={{
        activeFarm,
        farmsList,
        loading,
        error,
        selectActiveFarm,
        refreshActiveFarm,
        createNewFarm,
        deleteFarmById
      }}
    >
      {children}
    </ActiveFarmContext.Provider>
  );
}

export function useActiveFarm() {
  const context = useContext(ActiveFarmContext);
  if (!context) {
    throw new Error("useActiveFarm must be used within an ActiveFarmProvider");
  }
  return context;
}
