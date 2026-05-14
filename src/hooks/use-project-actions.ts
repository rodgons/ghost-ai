import { usePathname, useRouter } from "next/navigation";
import { type SyntheticEvent, useMemo, useState } from "react";

type DialogType = "create" | "rename" | "delete" | null;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function generateSuffix() {
  return crypto.randomUUID().slice(0, 4).toLowerCase();
}

export function useProjectActions() {
  const router = useRouter();
  const pathname = usePathname();
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [projectName, setProjectName] = useState("");
  const [roomIdSuffix, setRoomIdSuffix] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const slugPreview = useMemo(() => slugify(projectName), [projectName]);
  const roomIdPreview = useMemo(() => {
    if (!slugPreview) return "";
    return roomIdSuffix ? `${slugPreview}-${roomIdSuffix}` : slugPreview;
  }, [roomIdSuffix, slugPreview]);
  const isSlugValid = useMemo(() => slugPreview.length >= 3, [slugPreview]);

  const openCreateDialog = () => {
    setDialogType("create");
    setSelectedProjectId(null);
    setProjectName("");
    setRoomIdSuffix(generateSuffix());
  };

  const openRenameDialog = (projectId: string, currentName: string) => {
    setDialogType("rename");
    setSelectedProjectId(projectId);
    setProjectName(currentName);
    setRoomIdSuffix("");
  };

  const openDeleteDialog = (projectId: string) => {
    setDialogType("delete");
    setSelectedProjectId(projectId);
    setProjectName("");
    setRoomIdSuffix("");
  };

  const closeDialog = () => {
    setDialogType(null);
    setSelectedProjectId(null);
    setProjectName("");
    setRoomIdSuffix("");
    setIsSubmitting(false);
  };

  const createProject = async () => {
    if (!isSlugValid || !roomIdPreview) return;
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: roomIdPreview,
          name: projectName,
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(
          `Failed to create project: ${response.status} ${message}`,
        );
      }

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
        credentials: "include",
        body: JSON.stringify({ name: projectName }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(
          `Failed to rename project: ${response.status} ${message}`,
        );
      }

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
        credentials: "include",
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(
          `Failed to delete project: ${response.status} ${message}`,
        );
      }

      const currentProjectId = pathname?.split("/")[2] ?? null;
      if (currentProjectId === selectedProjectId) {
        router.push("/editor");
      } else {
        router.refresh();
      }
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
    roomIdPreview,
    isSlugValid,
    isSubmitting,
    openCreateDialog,
    openRenameDialog,
    openDeleteDialog,
    closeDialog,
    handleSubmit,
  };
}
