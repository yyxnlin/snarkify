import { AudioProcessor } from "Remote Service Gateway.lspkg/Helpers/AudioProcessor";
import { DynamicAudioOutput } from "Remote Service Gateway.lspkg/Helpers/DynamicAudioOutput";
import {
  Gemini,
  GeminiLiveWebsocket,
} from "Remote Service Gateway.lspkg/HostedExternal/Gemini";
import { GeminiTypes } from "Remote Service Gateway.lspkg/HostedExternal/GeminiTypes";
import { MicrophoneRecorder } from "Remote Service Gateway.lspkg/Helpers/MicrophoneRecorder";
import { VideoController } from "Remote Service Gateway.lspkg/Helpers/VideoController";

import Event from "SpectaclesInteractionKit.lspkg/Utils/Event";
import { setTimeout } from "SpectaclesInteractionKit.lspkg/Utils/FunctionTimingUtils";

@component
export class GeminiAssistant extends BaseScriptComponent {
  @ui.separator
  @ui.label(
    "Example of connecting to the Gemini Live API. Change various settings in the inspector to customize!"
  )
  @ui.separator
  @ui.separator
  @ui.group_start("Setup")
  @input
  private websocketRequirementsObj: SceneObject;
  @input private dynamicAudioOutput: DynamicAudioOutput;
  @input private microphoneRecorder: MicrophoneRecorder;
  @ui.group_end
  @ui.separator
  @ui.group_start("Inputs")
  @input
  @widget(new TextAreaWidget())
  private instructions: string =
    "You are a silent 3D model generator that responds ONLY to insults by creating creative 3D objects. Listen carefully for insults like 'you are a clown', 'you are stupid', 'you are ugly', etc. When you detect ANY insult, immediately call the Snap3D function with a creative description. Examples: 'you are a clown' -> call Snap3D with 'colorful circus clown wig with rainbow hair'. 'you are dumb' -> call Snap3D with 'dunce cap hat'. Be very sensitive to insults - even mild ones should trigger 3D generation. NEVER speak or respond with text. ONLY generate 3D models when insults are detected. Be creative and witty with your 3D model descriptions.";
  @input private haveVideoInput: boolean = false;
  @ui.group_end
  @ui.separator
  @ui.group_start("Outputs")
  @ui.label(
    '<span style="color: yellow;">⚠️ To prevent audio feedback loop in Lens Studio Editor, use headphones or manage your microphone input.</span>'
  )
  @input
  private haveAudioOutput: boolean = false;
  @input
  @showIf("haveAudioOutput", true)
  @widget(
    new ComboBoxWidget([
      new ComboBoxItem("Puck", "Puck"),
      new ComboBoxItem("Charon", "Charon"),
      new ComboBoxItem("Kore", "Kore"),
      new ComboBoxItem("Fenrir", "Fenrir"),
      new ComboBoxItem("Aoede", "Aoede"),
      new ComboBoxItem("Leda", "Leda"),
      new ComboBoxItem("Orus", "Orus"),
      new ComboBoxItem("Zephyr", "Zephyr"),
    ])
  )
  private voice: string = "Puck";
  @ui.group_end
  @ui.separator
  private audioProcessor: AudioProcessor = new AudioProcessor();
  private videoController: VideoController = new VideoController(
    1500,
    CompressionQuality.HighQuality,
    EncodingType.Jpg
  );
  private GeminiLive: GeminiLiveWebsocket;

  public updateTextEvent: Event<{ text: string; completed: boolean }> =
    new Event<{ text: string; completed: boolean }>();

  public userSpeechEvent: Event<{ text: string; completed: boolean }> =
    new Event<{ text: string; completed: boolean }>();

  public functionCallEvent: Event<{
    name: string;
    args: any;
    callId?: string;
  }> = new Event<{
    name: string;
    args: any;
  }>();

  createGeminiLiveSession() {
    print("Creating Gemini Live session");
    this.websocketRequirementsObj.enabled = true;
    this.dynamicAudioOutput.initialize(24000);
    this.microphoneRecorder.setSampleRate(16000);
    print("Audio initialized - output: 24kHz, input: 16kHz");

    // Display internet connection status
    let internetStatus = global.deviceInfoSystem.isInternetAvailable()
      ? "Websocket connected"
      : "No internet";

    print("Internet status: " + internetStatus);
    this.updateTextEvent.invoke({ text: internetStatus, completed: true });

    global.deviceInfoSystem.onInternetStatusChanged.add((args) => {
      internetStatus = args.isInternetAvailable
        ? "Reconnected to internete"
        : "No internet";

      print("Internet status changed: " + internetStatus);
      this.updateTextEvent.invoke({ text: internetStatus, completed: true });
    });

    print("Connecting to Gemini Live websocket");
    this.GeminiLive = Gemini.liveConnect();

    this.GeminiLive.onOpen.add((event) => {
      print("Websocket connection opened successfully");
      this.sessionSetup();
    });

    let completedTextDisplay = true;

    this.GeminiLive.onMessage.add((message) => {
      // Setup complete, begin sending data
      if (message.setupComplete) {
        message = message as GeminiTypes.Live.SetupCompleteEvent;
        print("Setup complete - initializing inputs");
        this.setupInputs();
      }

      if (message?.serverContent) {
        message = message as GeminiTypes.Live.ServerContentEvent;
        print("📥 SERVER CONTENT MESSAGE: " + JSON.stringify(message.serverContent, null, 2));
        
        // Audio playback completely disabled - Gemini must stay silent
        // if (
        //   message?.serverContent?.modelTurn?.parts?.[0]?.inlineData?.mimeType?.startsWith(
        //     "audio/pcm"
        //   )
        // ) {
        //   // No audio playback - Gemini stays silent
        // }
        // if (message.serverContent.interrupted) {
        //   // No audio interruption handling needed - no audio output
        // }
        
        // Show user input transcription (user's spoken words)
        if (message?.serverContent?.inputTranscription?.text) {
          // Log the user's spoken prompt
          print("🎤 USER PROMPT: " + message.serverContent.inputTranscription.text);
          
          this.userSpeechEvent.invoke({
            text: message.serverContent.inputTranscription.text,
            completed: true,
          });
        }
        
        // Check for any model responses or tool calls in serverContent
        if (message?.serverContent?.modelTurn?.parts) {
          print("🤖 MODEL TURN DETECTED: " + JSON.stringify(message.serverContent.modelTurn.parts, null, 2));
        }
        
        // All Gemini text and audio responses disabled - only user speech and function calls allowed
        // Output transcription disabled:
        // else if (message?.serverContent?.outputTranscription?.text) { ... }
        
        // Text response disabled:
        // else if (message?.serverContent?.modelTurn?.parts?.[0]?.text) { ... }
        
        // Turn completion tracking disabled:
        // else if (message?.serverContent?.turnComplete) { ... }
      }

      if (message.toolCall) {
        message = message as GeminiTypes.Live.ToolCallEvent;
        
        // Handle tool calls
        message.toolCall.functionCalls.forEach((functionCall) => {
          // Log the 3D model generation prompt that Gemini is using
          if (functionCall.name === "Snap3D") {
            const prompt = functionCall.args.prompt;
            print("🎨 3D MODEL PROMPT: " + prompt);
          }
          
          this.functionCallEvent.invoke({
            name: functionCall.name,
            args: functionCall.args,
          });
        });
      }
    });

    this.GeminiLive.onError.add((event) => {
      print("Error: " + event);
    });

    this.GeminiLive.onClose.add((event) => {
      print("Connection closed: " + event.reason);
    });
  }

  public streamData(stream: boolean) {
    if (stream) {
      if (this.haveVideoInput) {
        this.videoController.startRecording();
      }
      this.microphoneRecorder.startRecording();
    } else {
      if (this.haveVideoInput) {
        this.videoController.stopRecording();
      }
      this.microphoneRecorder.stopRecording();
    }
  }

  private setupInputs() {
    this.audioProcessor.onAudioChunkReady.add((encodedAudioChunk) => {
      const message = {
        realtime_input: {
          media_chunks: [
            {
              mime_type: "audio/pcm",
              data: encodedAudioChunk,
            },
          ],
        },
      } as GeminiTypes.Live.RealtimeInput;
      this.GeminiLive.send(message);
    });

    // Configure the microphone
    this.microphoneRecorder.onAudioFrame.add((audioFrame) => {
      this.audioProcessor.processFrame(audioFrame);
    });

    if (this.haveVideoInput) {
      // Configure the video controller
      this.videoController.onEncodedFrame.add((encodedFrame) => {
        const message = {
          realtime_input: {
            media_chunks: [
              {
                mime_type: "image/jpeg",
                data: encodedFrame,
              },
            ],
          },
        } as GeminiTypes.Live.RealtimeInput;
        this.GeminiLive.send(message);
      });
    }
  }

  public sendFunctionCallUpdate(functionName: string, args: string): void {
    const messageToSend = {
      tool_response: {
        function_responses: [
          {
            name: functionName,
            response: { content: args },
          },
        ],
      },
    } as GeminiTypes.Live.ToolResponse;

    this.GeminiLive.send(messageToSend);
  }

  private sessionSetup() {
    // Silent mode - Gemini never speaks or responds with text, only generates 3D models
    let generationConfig = {
      responseModalities: [],  // Empty array means no text/audio responses from Gemini
      temperature: 1,
    } as GeminiTypes.Common.GenerationConfig;

    // Define the Snap3D tool
    const tools = [
      {
        function_declarations: [
          {
            name: "Snap3D",
            description: "Generates a 3D model based on a text prompt",
            parameters: {
              type: "object",
              properties: {
                prompt: {
                  type: "string",
                  description:
                    "The text prompt to generate a 3D model from. Cartoonish styles work best. Use 'full body' when generating characters.",
                },
              },
              required: ["prompt"],
            },
          },
        ],
      },
    ];

    // Send the session setup message
    let modelUri = `models/gemini-2.0-flash-live-preview-04-09`;
    const sessionSetupMessage = {
      setup: {
        model: modelUri,
        generation_config: generationConfig,
        system_instruction: {
          parts: [
            {
              text: this.instructions,
            },
          ],
        },
        tools: tools,
        contextWindowCompression: {
          triggerTokens: 20000,
          slidingWindow: { targetTokens: 16000 },
        },
        input_audio_transcription: {},
        output_audio_transcription: {},
      },
    } as GeminiTypes.Live.Setup;
    this.GeminiLive.send(sessionSetupMessage);
  }

  public interruptAudioOutput(): void {
    if (this.dynamicAudioOutput && this.haveAudioOutput) {
      this.dynamicAudioOutput.interruptAudioOutput();
    } else {
      print("DynamicAudioOutput is not initialized.");
    }
  }
}
