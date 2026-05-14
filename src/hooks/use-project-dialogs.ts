import { type SyntheticEvent, useMemo, useState } from "react";

type DialogType = "create" | "rename" | "delete" | null;

type Project = {
  id: string;
  name: string;
  slug: string;
  isOwned: boolean;
  subtitle: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const initialOwnedProjects: Project[] = [
  {
    id: "project-1",
    name: "Platform redesign",
    slug: "platform-redesign",
    isOwned: true,
    subtitle: "Owned project",
  },
  {
    id: "project-2",
    name: "Core architecture",
    slug: "core-architecture",
    isOwned: true,
    subtitle: "Owned project",
  },
];

const initialSharedProjects: Project[] = [
  {
    id: "project-3",
    name: "Shared team backlog",
    slug: "shared-team-backlog",
    isOwned: false,
    subtitle: "Shared workspace",
  },
];

export function useProjectDialogs() {
  const [ownedProjects, setOwnedProjects] =
    useState<Project[]>(initialOwnedProjects);
  const [sharedProjects] = useState<Project[]>(initialSharedProjects);
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [projectName, setProjectName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const slugPreview = useMemo(() => slugify(projectName), [projectName]);
  const isSlugValid = useMemo(() => slugPreview.length >= 3, [slugPreview]);

  const selectedProject = useMemo(() => {
    return (
      ownedProjects
        .concat(sharedProjects)
        .find((project) => project.id === selectedProjectId) ?? null
    );
  }, [ownedProjects, sharedProjects, selectedProjectId]);

  const openCreateDialog = () => {
    setDialogType("create");
    setSelectedProjectId(null);
    setProjectName("");
  };

  const openRenameDialog = (projectId: string) => {
    const project = ownedProjects.find((item) => item.id === projectId);
    if (!project) return;

    setDialogType("rename");
    setSelectedProjectId(projectId);
    setProjectName(project.name);
  };

  const openDeleteDialog = (projectId: string) => {
    setDialogType("delete");
    setSelectedProjectId(projectId);
    setProjectName("");
  };

  const closeDialog = () => {
    setDialogType(null);
    setSelectedProjectId(null);
    setProjectName("");
    setIsSubmitting(false);
  };

  const createProject = async () => {
    if (!isSlugValid) return;
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 200));
    setOwnedProjects((projects) => [
      ...projects,
      {
        id: `project-${Date.now()}`,
        name: projectName,
        slug: slugPreview,
        isOwned: true,
        subtitle: "Owned project",
      },
    ]);
    closeDialog();
  };

  const renameProject = async () => {
    if (!selectedProjectId || !isSlugValid) return;
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 200));
    setOwnedProjects((projects) =>
      projects.map((project) =>
        project.id === selectedProjectId
          ? { ...project, name: projectName, slug: slugPreview }
          : project,
      ),
    );
    closeDialog();
  };

  const deleteProject = async () => {
    if (!selectedProjectId) return;
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 200));
    setOwnedProjects((projects) =>
      projects.filter((project) => project.id !== selectedProjectId),
    );
    closeDialog();
  };

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (dialogType === "create") return createProject();
    if (dialogType === "rename") return renameProject();
    if (dialogType === "delete") return deleteProject();
  };

  return {
    ownedProjects,
    sharedProjects,
    dialogType,
    selectedProject,
    projectName,
    setProjectName,
    slugPreview,
    isSlugValid,
    isSubmitting,
    openCreateDialog,
    openRenameDialog,
    openDeleteDialog,
    closeDialog,
    handleSubmit,
  };
}
