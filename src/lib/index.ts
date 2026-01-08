// Lib exports
export { VideoCompositor, LAYOUTS } from "./canvas/VideoCompositor";
export type { VideoSource, Overlay, LayoutType, LayoutConfig } from "./canvas/VideoCompositor";

export { AudioProcessor } from "./audio/AudioProcessor";
export type { AudioSource, AudioLevels } from "./audio/AudioProcessor";

export { RecordingManager, useRecording } from "./recording/RecordingManager";
export type { RecordingOptions, RecordingState } from "./recording/RecordingManager";

export { StreamManager, useStreamManager } from "./streaming/StreamManager";
export type { StreamDestination, StreamStats, StreamConfig } from "./streaming/StreamManager";

export { apiClient } from "./api/client";
