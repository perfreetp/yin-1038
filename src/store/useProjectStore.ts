import { create } from 'zustand';
import type { Project, ProjectMaterial } from '../types';

interface ProjectState {
  projects: Project[];
  projectMaterials: ProjectMaterial[];
  currentProject: Project | null;
  loading: boolean;
  setProjects: (projects: Project[]) => void;
  setProjectMaterials: (materials: ProjectMaterial[]) => void;
  setCurrentProject: (project: Project | null) => void;
  setLoading: (loading: boolean) => void;
  addProject: (project: Project) => void;
  updateProject: (project: Project) => void;
  deleteProject: (id: string) => void;
  addProjectMaterial: (pm: ProjectMaterial) => void;
  updateProjectMaterial: (pm: ProjectMaterial) => void;
  removeProjectMaterial: (id: string) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  projectMaterials: [],
  currentProject: null,
  loading: false,
  setProjects: (projects) => set({ projects }),
  setProjectMaterials: (projectMaterials) => set({ projectMaterials }),
  setCurrentProject: (project) => set({ currentProject: project }),
  setLoading: (loading) => set({ loading }),
  addProject: (project) =>
    set((state) => ({ projects: [...state.projects, project] })),
  updateProject: (project) =>
    set((state) => ({
      projects: state.projects.map((p) => (p.id === project.id ? project : p)),
    })),
  deleteProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
    })),
  addProjectMaterial: (pm) =>
    set((state) => ({ projectMaterials: [...state.projectMaterials, pm] })),
  updateProjectMaterial: (pm) =>
    set((state) => ({
      projectMaterials: state.projectMaterials.map((x) => (x.id === pm.id ? pm : x)),
    })),
  removeProjectMaterial: (id) =>
    set((state) => ({
      projectMaterials: state.projectMaterials.filter((x) => x.id !== id),
    })),
}));
