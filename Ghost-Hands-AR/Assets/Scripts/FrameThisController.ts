import {RectangleButton} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/RectangleButton"

// Orientation-guided composition proof of concept.
// The user selects the direction at the center of the view. This is NOT
// visual object detection or image-based subject tracking.
// For a stationary, distant subject, changing camera orientation can
// move that selected direction toward the left/lower rule-of-thirds area.
const TARGET_X = -0.105
const TARGET_Y = -0.068
const READY_TOLERANCE = 0.025

@component
export class FrameThisController extends BaseScriptComponent {
  @input
  guideContainer: SceneObject

  @input
  instructionText: Text3D

  @input
  buttonLabelText: Text

  // Existing prefab interaction retained, but repurposed to Select/Reselect.
  // No Scout or Reset mode is used.
  @input
  scoutButton: RectangleButton

  private cameraObject: SceneObject | null = null
  private subjectWorldDirection: vec3 | null = null
  private lastCue: string = ""
  private lastReady: boolean = false

  onAwake(): void {
    this.createEvent("OnStartEvent").bind(() => this.onStart())
    this.createEvent("UpdateEvent").bind(() => this.onUpdate())
  }

  private onStart(): void {
    if (!this.guideContainer || !this.instructionText ||
        !this.buttonLabelText || !this.scoutButton) {
      print("[FrameThis] ERROR: missing scene bindings")
      return
    }

    // FrameThis is parented directly beneath Camera Object in the saved scene.
    this.cameraObject = this.sceneObject.getParent()
    if (!this.cameraObject) {
      print("[FrameThis] ERROR: camera parent not found")
      this.setCue("Camera reference unavailable", false)
      return
    }

    this.guideContainer.enabled = true
    this.buttonLabelText.text = "Select view"
    this.scoutButton.onTriggerUp.add(() => this.selectViewDirection())
    this.setCue("Aim at subject, then Select view", false)
    print("[FrameThis] mode=ORIENTATION_GUIDE tracking=none")
  }

  private selectViewDirection(): void {
    if (!this.cameraObject) {
      return
    }

    const rotation = this.cameraObject.getTransform().getWorldRotation()
    this.subjectWorldDirection = rotation.multiplyVec3(new vec3(0, 0, -1))
    this.buttonLabelText.text = "Reselect"
    this.setCue("Turn a little right", false)
    print("[FrameThis] selected camera direction; this is not object tracking")
  }

  private onUpdate(): void {
    if (!this.cameraObject || !this.subjectWorldDirection) {
      return
    }

    // Express the selected world direction in the current camera frame.
    // Rotating the camera changes these coordinates continuously.
    const rotation = this.cameraObject.getTransform().getWorldRotation()
    const local = rotation.invert().multiplyVec3(this.subjectWorldDirection)
    if (-local.z < 0.15) {
      this.setCue("Subject direction behind you. Reselect", false)
      return
    }

    const x = local.x / -local.z
    const y = local.y / -local.z
    const dx = x - TARGET_X
    const dy = y - TARGET_Y
    const aligned = Math.abs(dx) <= READY_TOLERANCE &&
                    Math.abs(dy) <= READY_TOLERANCE

    if (aligned) {
      this.setCue("READY! Capture this!", true)
    } else if (Math.abs(dx) >= Math.abs(dy)) {
      this.setCue(dx > 0 ? "Turn a little right" : "Turn a little left", false)
    } else {
      this.setCue(dy > 0 ? "Look up a little" : "Look down a little", false)
    }
  }

  private setCue(cue: string, ready: boolean): void {
    if (cue === this.lastCue && ready === this.lastReady) {
      return
    }
    this.lastCue = cue
    this.lastReady = ready
    this.instructionText.text = cue
    if (this.buttonLabelText) {
      this.buttonLabelText.text = ready ? "READY" : (this.subjectWorldDirection ? "Reselect" : "Select view")
    }

    // The existing button label is the reliable secondary status indicator.
    // It changes colour to confirm readiness without requiring new scene assets.
    if (this.buttonLabelText) {
      this.buttonLabelText.textFill.color = ready
        ? new vec4(0.23, 1.0, 0.52, 1.0)
        : new vec4(1.0, 1.0, 1.0, 1.0)
    }
    print("[FrameThis] cue=" + cue + " ready=" + ready)
  }
}
