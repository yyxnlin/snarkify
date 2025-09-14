import { GeminiAssistant } from "./GeminiAssistant";
import { Snap3DInteractableFactory } from "./Snap3DInteractableFactory";
import { HeadAttached3DFactory } from "./HeadAttached3DFactory";
import { SphereController } from "./SphereController";

@component
export class AIAssistantUIBridge extends BaseScriptComponent {
  @ui.separator
  @ui.label("Auto-connects the Gemini AI Assistant to the Sphere Controller UI on startup")
  @ui.separator
  @ui.group_start("Assistant")
  @ui.label(
    "Customize the voice and behavior of the Gemini assistant on its component."
  )
  @input
  private geminiAssistant: GeminiAssistant;
  @ui.group_end
  @ui.separator
  @ui.group_start("UI Elements")
  @input
  private sphereController: SphereController;

  @input
  private snap3DInteractableFactory: Snap3DInteractableFactory;
  
  @input
  private headAttached3DFactory: HeadAttached3DFactory;
  @ui.group_end
  private currentAssistant: GeminiAssistant;

  onAwake() {
    this.createEvent("OnStartEvent").bind(this.onStart.bind(this));
  }

  private onStart() {
    print("[AIAssistantUIBridge] Auto-starting Gemini Live session on app startup");
    // Auto-start the assistant immediately when the app starts
    this.startWebsocketAndUI();
  }

  private startWebsocketAndUI() {
    // Set the current assistant to Gemini first
    this.currentAssistant = this.geminiAssistant;
    this.geminiAssistant.createGeminiLiveSession();

    // Connect the assistant to the UI
    this.connectAssistantEvents();

    // Connect sphere controller activation to the assistant BEFORE initializing UI
    this.sphereController.isActivatedEvent.add((isActivated) => {
      this.currentAssistant.streamData(isActivated);
      if (!isActivated) {
        this.currentAssistant.interruptAudioOutput();
      }
    });

    this.sphereController.initializeUI();
    
    // Manually trigger activation since the orb should always be active in static mode
    this.currentAssistant.streamData(true);
  }

  private connectAssistantEvents() {
    // Gemini stays completely silent - no text or audio responses ever
    // this.currentAssistant.updateTextEvent.add((data) => {
    //   this.sphereController.setText(data);
    // });

    // Show user speech captions including insults
    this.currentAssistant.userSpeechEvent.add((data) => {
      this.sphereController.setUserSpeechText(data);
    });

    // Connect function call events
    this.currentAssistant.functionCallEvent.add((data) => {
      if (data.name === "Snap3D") {
        // Log the 3D generation request
        print("📦 GENERATING HEAD-ATTACHED 3D MODEL: " + data.args.prompt);
        
        // Silent mode - generate head-attached 3D object based on insult
        this.headAttached3DFactory.createHeadAttached3DObject(data.args.prompt)
          .then((result) => {
            print("✅ HEAD-ATTACHED MODEL SUCCESS: " + result);
          })
          .catch((error) => {
            print("❌ HEAD-ATTACHED MODEL ERROR: " + error);
          });
      }
    });
  }
}
