import { create } from 'zustand';

interface MediaState {
  cameraEnabled: boolean;
  micEnabled: boolean;
  screenSharing: boolean;
  setCameraEnabled: (enabled: boolean) => void;
  setMicEnabled: (enabled: boolean) => void;
  setScreenSharing: (sharing: boolean) => void;
}

export const useMediaStore = create<MediaState>((set) => ({
  cameraEnabled: true,
  micEnabled: true,
  screenSharing: false,
  setCameraEnabled: (enabled) => set({ cameraEnabled: enabled }),
  setMicEnabled: (enabled) => set({ micEnabled: enabled }),
  setScreenSharing: (sharing) => set({ screenSharing: sharing }),
}));
