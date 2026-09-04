import { useEffect, useState } from "react";
import { getProjectCoverSignedUrl } from "./covers";

export function useProjectCover(path: string | null | undefined): string | null {
  const [state, setState] = useState<{ path: string; url: string | null }>({
    path: path ?? "",
    url: null,
  });

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    getProjectCoverSignedUrl(path)
      .then((signed) => {
        if (!cancelled) setState({ path, url: signed });
      })
      .catch(() => {
        if (!cancelled) setState({ path, url: null });
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return state.path === path ? state.url : null;
}