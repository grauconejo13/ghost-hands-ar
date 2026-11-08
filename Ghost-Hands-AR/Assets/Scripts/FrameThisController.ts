import {RectangleButton} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/RectangleButton"

const IDLE_INSTRUCTION: string = "Pinch Scout to start framing."
const FRAMING_INSTRUCTION: string = "Align your subject on a grid line or intersection."

@component
export class FrameThisController extends BaseScriptComponent {
  @input
  guideContainer: SceneObject

  @input
  instructionText: Text3D

  @input
  buttonLabelText: Text

  @input
  scoutButton: RectangleButton

  private active: boolean = false

  onAwake() {
    this.createEvent("OnStartEvent").bind(() => this.onStart())
  }

  private onStart(): void {
    if (!this.guideContainer || !this.instructionText || !this.buttonLabelText || !this.scoutButton) {
      print("[FrameThis] ERROR: one or more inputs are not assigned")
      return
    }
    this.scoutButton.onTriggerUp.add(() => this.onScoutReset())
    this.applyState()
  }

  private onScoutReset(): void {
    this.active = !this.active
    this.applyState()
  }

  private applyState(): void {
    this.guideContainer.enabled = this.active
    this.instructionText.text = this.active ? FRAMING_INSTRUCTION : IDLE_INSTRUCTION
    this.buttonLabelText.text = this.active ? "Reset" : "Scout"
    print(
      "[FrameThis] state=" +
        (this.active ? "SCOUT" : "IDLE") +
        " grid=" +
        this.guideContainer.enabled +
        ' instruction="' +
        this.instructionText.text +
        '" button="' +
        this.buttonLabelText.text +
        '"'
    )
  }
}
