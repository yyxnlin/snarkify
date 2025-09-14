import { Interactable } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";
import { LSTween } from "LSTween.lspkg/LSTween";
import Easing from "LSTween.lspkg/TweenJS/Easing";
import { InteractableManipulation } from "SpectaclesInteractionKit.lspkg/Components/Interaction/InteractableManipulation/InteractableManipulation";

import { HandInputData } from "SpectaclesInteractionKit.lspkg/Providers/HandInputData/HandInputData";
import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider";
import { PinchButton } from "SpectaclesInteractionKit.lspkg/Components/UI/PinchButton/PinchButton";

import Event from "SpectaclesInteractionKit.lspkg/Utils/Event";

@component
export class SphereController extends BaseScriptComponent {
  @ui.separator
  @ui.label("Manages the UI and hand intereactions for the AI assistant")
  @ui.separator
  @input
  private hoverMat: Material;

  @input
  private orbInteractableObj: SceneObject;

  @input
  private orbObject: SceneObject;

  @input
  private orbVisualParent: SceneObject;

  @input
  private orbScreenPosition: SceneObject;

  @input
  private closeObj: SceneObject;

  @input
  private closeButtonInteractable: SceneObject;

  @input
  private worldSpaceText: Text;

  @input
  private screenSpaceText: Text;

  @input
  private uiParent: SceneObject;

  private wasInFOV: boolean = true;

  private interactable: Interactable;
  private manipulate: InteractableManipulation;
  private orbButton: PinchButton;
  private closeButton: PinchButton;

  // Get SIK data
  private handProvider: HandInputData = HandInputData.getInstance();
  private menuHand = this.handProvider.getHand("left");

  private trackedToHand: boolean = true;
  private wcfmp = WorldCameraFinderProvider.getInstance();

  private minimizedSize: vec3 = vec3.one().uniformScale(0.3);
  private fullSize: vec3 = vec3.one();

  public isActivatedEvent: Event<boolean> = new Event<boolean>();

  onAwake() {
    this.interactable = this.orbInteractableObj.getComponent(
      Interactable.getTypeName()
    );
    this.manipulate = this.orbInteractableObj.getComponent(
      InteractableManipulation.getTypeName()
    );
    
    // Try to get button components, but they may be null if removed
    this.orbButton = this.orbInteractableObj.getComponent(
      PinchButton.getTypeName()
    );
    this.closeButton = this.closeButtonInteractable.getComponent(
      PinchButton.getTypeName()
    );
    
    print("Button components initialized - orbButton: " + (this.orbButton ? "found" : "null") + ", closeButton: " + (this.closeButton ? "found" : "null"));
    
    // Keep orb attached to head and activated (not tracked to hand)
    print("Setting orb to attach to user's head");
    this.setIsTrackedToHand(false);
    this.createEvent("OnStartEvent").bind(this.init.bind(this));
    this.createEvent("UpdateEvent").bind(this.onUpdate.bind(this));
    this.hoverMat.mainPass.activeHover = 0;
    this.uiParent.enabled = false;
  }

  initializeUI() {
    print("Initializing UI - enabling parent object");
    this.uiParent.enabled = true;
    print("UI initialized - orb should be attached to head in activated mode");
  }

  private setIsTrackedToHand(value: boolean) {
    print("Setting tracked to hand: " + value);
    this.trackedToHand = value;
    this.manipulate.enabled = !value;
    if (value) {
      this.setOrbToScreenPosition(true);
      LSTween.scaleToLocal(
        this.orbObject.getTransform(),
        this.minimizedSize,
        600
      )
        .easing(Easing.Quadratic.InOut)
        .start();

      LSTween.scaleToLocal(
        this.closeObj.getTransform(),
        vec3.one().uniformScale(0.1),
        600
      )
        .easing(Easing.Quadratic.InOut)
        .onComplete(() => {
          if (this.closeButton) {
            this.closeButton.sceneObject.enabled = false;
          }
        })
        .start();
      this.screenSpaceText.enabled = false;
      this.worldSpaceText.enabled = false;
    } else {
      LSTween.scaleToLocal(this.orbObject.getTransform(), this.fullSize, 400)
        .easing(Easing.Quadratic.InOut)
        .start();
      let worldPos = this.wcfmp.getForwardPosition(100);
      LSTween.moveToWorld(this.orbObject.getTransform(), worldPos, 600)
        .easing(Easing.Quadratic.InOut)
        .start();

      // Keep close button disabled for static positioning
      if (this.closeButton) {
        this.closeButton.sceneObject.enabled = false;
      }
      LSTween.scaleToLocal(this.closeObj.getTransform(), vec3.one(), 600)
        .easing(Easing.Quadratic.InOut)
        .start();
      this.screenSpaceText.enabled = false;
      this.worldSpaceText.enabled = true;
    }

    print("Invoking isActivatedEvent with value: " + (!value));
    this.isActivatedEvent.invoke(!value);
  }

  private init() {
    this.interactable.onHoverEnter.add(() => {
      LSTween.rawTween(200)
        .onUpdate((tweenData) => {
          let percent = tweenData.t as number;
          this.hoverMat.mainPass.activeHover = percent;
        })
        .start();
    });

    this.interactable.onHoverExit.add(() => {
      LSTween.rawTween(200)
        .onUpdate((tweenData) => {
          let percent = 1 - (tweenData.t as number);
          this.hoverMat.mainPass.activeHover = percent;
        })
        .start();
    });

    // Disable button interactions since we want head attachment
    if (this.orbButton) {
      print("Orb button found but disabled for head attachment");
      // Keep button event but don't change state
      this.orbButton.onButtonPinched.add(() => {
        print("Orb button pinched - but maintaining head attachment");
      });
    } else {
      print("No orb button found - skipping button event setup");
    }

    if (this.closeButton) {
      print("Close button found but disabled for head attachment");
      // Keep button event but don't change state
      this.closeButton.onButtonPinched.add(() => {
        print("Close button pinched - but maintaining head attachment");
      });
    } else {
      print("No close button found - skipping button event setup");
    }
  }

  private onUpdate() {
    this.positionOnHead();
    this.keepActiveOrbVisible();
  }

  private positionOnHead() {
    // Always use the close object since we're not tracking to hand
    let objectToTransform = this.closeObj.getTransform();
    
    // Position on top of the user's head like a hat/wig
    // Use camera position as head approximation and offset upward
    let headPosition = this.wcfmp.getWorldPosition();
    let orbPosition = headPosition.add(new vec3(0, 20, 0)); // 20 units above head
    objectToTransform.setWorldPosition(orbPosition);
    
    // Keep the orb facing forward (same orientation as head)
    let cameraTransform = this.wcfmp.getTransform();
    let headRotation = cameraTransform.getWorldRotation();
    objectToTransform.setWorldRotation(headRotation);
    
    // Always keep the orb enabled
    objectToTransform.getSceneObject().enabled = true;
  }

  private setOrbToScreenPosition(inScrPos: boolean) {
    if (!inScrPos) {
      this.orbVisualParent.setParent(this.orbScreenPosition);
      this.orbVisualParent.getTransform().setLocalPosition(vec3.zero());
      LSTween.scaleFromToLocal(
        this.orbVisualParent.getTransform(),
        vec3.one().uniformScale(0.01),
        vec3.one().uniformScale(0.3),
        200
      ).start();
      this.screenSpaceText.enabled = true;
      this.worldSpaceText.enabled = false;
    } else {
      this.orbVisualParent.setParent(this.orbObject);
      this.orbVisualParent.getTransform().setLocalPosition(vec3.zero());
      LSTween.scaleToLocal(
        this.orbVisualParent.getTransform(),
        vec3.one(),
        200
      ).start();
      this.screenSpaceText.enabled = false;
      this.worldSpaceText.enabled = true;
    }
  }

  private keepActiveOrbVisible() {
    if (this.trackedToHand) {
      return;
    }
    let orbPos = this.orbObject.getTransform().getWorldPosition();
    let inFov = this.wcfmp.inFoV(orbPos);
    if (inFov !== this.wasInFOV) {
      this.setOrbToScreenPosition(inFov);
    }
    this.wasInFOV = inFov;
  }

  public setText(data: { text: string; completed: boolean }) {
    if (data.completed) {
      // Format AI response with a label for clarity
      const aiResponse = "[AI] " + data.text;
      this.worldSpaceText.text = aiResponse;
      this.screenSpaceText.text = aiResponse;
    } else {
      // For streaming text, add to existing content
      this.worldSpaceText.text += data.text;
      this.screenSpaceText.text += data.text;
    }
  }

  public setUserSpeechText(data: { text: string; completed: boolean }) {
    // Format user speech with a distinct caption label and brackets
    const userCaption = "[USER] " + data.text;
    this.worldSpaceText.text = userCaption;
    this.screenSpaceText.text = userCaption;
  }
}
