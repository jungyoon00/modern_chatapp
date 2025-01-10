import { create } from 'zustand';

const useGlobalState = create((set) => ({
    activate: false,
    globalID: "",
    setActivate: (activate) => set(() => ({ activate })),
    setGlobalID: (globalID) => set(() => ({ globalID })),
}));

export default useGlobalState;