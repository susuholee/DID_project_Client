import { create } from "zustand";


export const useWebSocket = create((set, get) => ({
    socket : null,
    setSocket: (data) =>
      set({
        socket : data
      }),
  }))