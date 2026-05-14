import { EditorHomeClient } from "@/components/editor/editor-home-client";
import { getProjects } from "@/lib/projects";

/**
 * Render the editor home populated with the current user's owned and shared projects.
 *
 * @returns A React element that renders `EditorHomeClient` with `ownedProjects` and `sharedProjects` props
 */
export default async function EditorPage() {
  const { ownedProjects, sharedProjects } = await getProjects();

  return (
    <EditorHomeClient
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
    />
  );
}
