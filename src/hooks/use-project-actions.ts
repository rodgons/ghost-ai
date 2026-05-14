import { type SyntheticEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type DialogType = "create" | "rename" | "delete" | null;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function useProjectActions() {
  const router = useRouter();
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const slugPreview = useMemo(() => slugify(projectName), [projectName]);
  const isSlugValid = useMemo(() => slugPreview.length >= 3, [slugPreview]);

  const openCreateDialog = () => {
    setDialogType("create");
    setSelectedProjectId(null);
    setProjectName("");
  };

  const openRenameDialog = (projectId: string, currentName: string) => {
    setDialogType("rename");
    setSelectedProjectId(projectId);
    setProjectName(currentName);
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
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName }),
      });

      if (!response.ok) throw new Error("Failed to create project");

      const project = await response.json();
      router.push(`/editor/${project.id}`);
    } catch (error) {
      console.error("Create project error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renameProject = async () => {
    if (!selectedProjectId || !isSlugValid) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/projects/${selectedProjectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName }),
      });

      if (!response.ok) throw new Error("Failed to rename project");

      router.refresh();
      closeDialog();
    } catch (error) {
      console.error("Rename project error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteProject = async () => {
    if (!selectedProjectId) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/projects/${selectedProjectId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete project");

      router.push("/editor");
      router.refresh();
      closeDialog();
    } catch (error) {
      console.error("Delete project error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (dialogType === "create") return createProject();
    if (dialogType === "rename") return renameProject();
    if (dialogType === "delete") return deleteProject();
  };

  return {
    dialogType,
    selectedProjectId,
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
