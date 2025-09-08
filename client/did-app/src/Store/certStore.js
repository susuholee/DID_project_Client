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

  // 현재 선택된 수료증이 있는지 확인
  hasCertInfo: () => {
    const { certInfo } = get();
    return Object.keys(certInfo.vc.credentialSubject).length > 0;
  }
}));