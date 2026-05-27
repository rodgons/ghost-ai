## Error Type
Console Error

## Error Message
A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

https://react.dev/link/hydration-mismatch

  ...
    <HotReload globalError={[...]} webSocket={WebSocket} staticIndicatorState={{pathname:null, ...}}>
      <AppDevOverlayErrorBoundary globalError={[...]}>
        <ReplaySsrOnlyErrors>
        <DevRootHTTPAccessFallbackBoundary>
          <HTTPAccessFallbackBoundary notFound={<NotAllowedRootHTTPFallbackError>}>
            <HTTPAccessFallbackErrorBoundary pathname="/editor" notFound={<NotAllowedRootHTTPFallbackError>} ...>
              <RedirectBoundary>
                <RedirectErrorBoundary router={{...}}>
                  <Head>
                  <__next_root_layout_boundary__>
                    <SegmentViewNode type="layout" pagePath="layout.tsx">
                      <SegmentTrieNode>
                      <link>
                      <script>
                      <script>
                      <script>
                      <script>
                      <script>
                      <script>
                      <script>
                      <script>
                      <RootLayout>
                        <html
                          lang="en"
                          className="geist_a71539c9-module__T19VSG__variable geist_mono_8d43a2aa-module__8Li5zG__varia..."
-                         data-darkreader-proxy-injected="true"
                        >
                          ...
                            <div className="min-h-scre...">
                              ...
                                <button type="button" onClick={function} onMouseDown={function} onKeyDown={function} ...>
                                  <PanelLeftOpen className="h-4 w-4">
                                    <svg
                                      ref={null}
                                      xmlns="http://www.w3.org/2000/svg"
                                      width={24}
                                      height={24}
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth={2}
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="lucide lucide-panel-left-open h-4 w-4"
                                      aria-hidden="true"
-                                     data-darkreader-inline-stroke=""
-                                     style={{--darkreader-inline-stroke:"currentColor"}}
                                    >
                                  ...
                              ...
                                <aside id="editor-pro..." className="flex h-ful..." aria-label="Project si..." ...>
                                  ...
                                    <button type="button" onClick={function} onMouseDown={function} onKeyDown={function} ...>
                                      <X className="h-4 w-4">
                                        <svg
                                          ref={null}
                                          xmlns="http://www.w3.org/2000/svg"
                                          width={24}
                                          height={24}
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth={2}
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          className="lucide lucide-x h-4 w-4"
                                          aria-hidden="true"
-                                         data-darkreader-inline-stroke=""
-                                         style={{--darkreader-inline-stroke:"currentColor"}}
                                        >
                                  ...
                                    <div className="mb-3 flex ...">
                                      <FolderKanban className="h-5 w-5">
                                        <svg
                                          ref={null}
                                          xmlns="http://www.w3.org/2000/svg"
                                          width={24}
                                          height={24}
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth={2}
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          className="lucide lucide-folder-kanban h-5 w-5"
                                          aria-hidden="true"
-                                         data-darkreader-inline-stroke=""
-                                         style={{--darkreader-inline-stroke:"currentColor"}}
                                        >
                                  ...
                                    <button type="button" onClick={function} onMouseDown={function} onKeyDown={function} ...>
                                      <Plus className="h-4 w-4">
                                        <svg
                                          ref={null}
                                          xmlns="http://www.w3.org/2000/svg"
                                          width={24}
                                          height={24}
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth={2}
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          className="lucide lucide-plus h-4 w-4"
                                          aria-hidden="true"
-                                         data-darkreader-inline-stroke=""
-                                         style={{--darkreader-inline-stroke:"currentColor"}}
                                        >
                                      ...
                  ...



    at svg (<anonymous>:null:null)
    at EditorNavbar (src/components/editor/editor-navbar.tsx:57:15)
    at EditorWorkspace (src/app/editor/page.tsx:13:7)
    at EditorPage (src/app/editor/page.tsx:51:7)

## Code Frame
  55 |               <PanelLeftClose className="h-4 w-4" />
  56 |             ) : (
> 57 |               <PanelLeftOpen className="h-4 w-4" />
     |               ^
  58 |             )}
  59 |             <span className="sr-only">
  60 |               {sidebarOpen ? "Close sidebar" : "Open sidebar"}

Next.js version: 16.2.6 (Turbopack)
