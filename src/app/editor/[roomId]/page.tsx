import { redirect } from "next/navigation";
import { AccessDenied } from "@/components/editor/access-denied";
import { EditorWorkspace } from "@/components/editor/editor-workspace";
import { getProjectWithAccessCheck } from "@/lib/project-access";

interface EditorPageProps {
  params: Promise<{
    roomId: string;
  }>;
}

/**
 * Server component for the editor workspace.
 * Performs access checks before rendering the workspace shell.
 */
export default async function EditorPage(props: EditorPageProps) {
  const { roomId } = await props.params;
  const { project, hasAccess, requiresAuth } =
    await getProjectWithAccessCheck(roomId);

  if (requiresAuth) {
    redirect("/sign-in");
  }

  if (!hasAccess || !project) {
    return <AccessDenied />;
  }

  return <EditorWorkspace project={project} />;
}
