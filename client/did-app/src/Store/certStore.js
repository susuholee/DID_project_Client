import { create } from "zustand";

export const useCertInfoStore = create((set, get) => ({
  certInfo: {
    vc: {
      credentialSubject: {}
    }
  },
  
  setCertInfo: (info) => set({ certInfo: info }),
  
  clearCertInfo: () => set({
    certInfo: {
      vc: {
        credentialSubject: {}
      }
    }
  }),


  hasCertInfo: () => {
    const { certInfo } = get();
    return Object.keys(certInfo.vc.credentialSubject).length > 0;
  }
}));