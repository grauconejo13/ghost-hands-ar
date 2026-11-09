/** Maps getUserMedia failures to short, actionable messages. */
export function cameraErrorMessage(error: unknown): string {
  const name = typeof error === "object" && error !== null && "name" in error
    ? String((error as { name: unknown }).name)
    : "";
  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return "Camera permission was denied. Allow it in your browser's site settings, or use Try Demo.";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "No camera was found on this device. Use Try Demo instead.";
    case "NotReadableError":
    case "TrackStartError":
      return "The camera is in use by another app or tab. Close it and try again.";
    case "OverconstrainedError":
      return "This camera does not support the requested mode. Try switching cameras.";
    case "SecurityError":
      return "Camera access is blocked on this page. It needs HTTPS or localhost.";
    case "AbortError":
      return "The camera could not start. Try again.";
    default:
      return "The camera could not start. Use Try Demo instead.";
  }
}

export const INSECURE_CONTEXT_MESSAGE =
  "Camera access needs HTTPS (or localhost) and a browser with camera support. Try Demo still works.";
