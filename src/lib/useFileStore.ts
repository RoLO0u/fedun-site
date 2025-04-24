import { create } from 'zustand'

interface FileState {
  file: File | null
  setFile: (file: File) => void
  clearFile: () => void
}

const useFileStore = create<FileState>((set) => ({
  file: null,
  setFile: (file) => set({ file }),
  clearFile: () => set({ file: null }),
}))

export default useFileStore