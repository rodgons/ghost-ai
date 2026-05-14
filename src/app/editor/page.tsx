import { EditorHomeClient } from "@/components/editor/editor-home-client";
import { getProjects } from "@/lib/projects";

export default async function EditorPage() {
  const { ownedProjects, sharedProjects } = await getProjects();

  return (
    <EditorHomeClient
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
    />
  );
}
