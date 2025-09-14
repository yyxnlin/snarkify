# Snarkify: Turn Arguments into Comedy Gold

Hack the North 2025

Devpost: https://devpost.com/software/snarkify

Demo: https://finish-vowel-79455690.figma.site/

## Inspiration
Arguments are very common in our every day relationships! What if there was a funny way to defuse arguments so that nobody is hurt? Introducing...Snarkify! 😡⚡

## What it does
Snarkify is an innovative augmented reality application built for Snap's Spectacles platform that combines real-time AI conversation with 3D object generation with face tracking abilities. The project demonstrates how to integrate multiple AI services within an AR environment, creating an immersive experience where users can interact with AI assistants through voice and generate 3D objects in their physical space.

### Technologies used:
1. Real-time AI Conversation: Connects to Google's Gemini Live API for streaming audio conversations
2. 3D Object Generation: Uses Snap's Snap3D service to generate interactive 3D models from text prompts
3. Voice Recognition: Implements automatic speech recognition (ASR) for hands-free interaction
4. Spatial UI: Features a floating orb interface that can be positioned in 3D space or screen space
5. Multimodal Input: Supports both audio and camera input for rich AI interactions

## How We Built It
### Architecture & Technology Stack
The project is built on several key technologies:
- Lens Studio 5.12.1: Snap's AR development platform
- TypeScript: Primary programming language for logic and components
- Remote Service Gateway: Snap's cloud service integration system
- Spectacles Interaction Kit (SIK): UI and interaction framework

### Key Components
1. GeminiAssistant.ts - AI Brain
- Establishes WebSocket connection to Gemini Live API
- Handles real-time audio streaming (16kHz input, 24kHz output)
- Processes function calls for 3D generation
- Manages conversation flow with custom system instructions
- Supports both audio and text-only modes
2. AIAssistantUIBridge.ts - Integration Hub
- Connects the AI assistant to the user interface
- Coordinates between voice input, AI processing, and 3D generation
- Auto-starts the AI session on app launch
- Manages the flow between different system components
3. SphereController.ts - Spatial UI
- Creates a floating orb interface that follows the user
- Supports both world-space and screen-space positioning
- Displays AI responses and user speech captions
- Handles hand tracking and spatial interactions
4. Snap3DInteractableFactory.ts - 3D Generation
- Interfaces with Snap's 3D generation service
- Creates interactive 3D objects that users can manipulate
- Manages the generation pipeline from text prompt to 3D model
- Supports mesh refinement and vertex coloring options
5. ASRQueryController.ts - Voice Input
- Implements speech-to-text functionality
- Provides visual feedback during voice recording
- Handles voice query processing with configurable accuracy modes

## Challenges We Ran Into
### Technical Integration Challenges
1. Real-time Audio Processing: Synchronizing 16kHz microphone input with 24kHz audio output while maintaining low latency for natural conversation flow
2. WebSocket State Management: Managing complex WebSocket connections with proper error handling, reconnection logic, and state synchronization between multiple AI services
3. Spatial UI Positioning: Creating a responsive UI that transitions smoothly between hand-tracked, world-space, and screen-space modes while maintaining user context
4. Cross-Service Communication: Coordinating between Gemini Live's function calling system and Snap3D's asynchronous generation pipeline
### Platform-Specific Constraints
1. Spectacles Hardware Limitations: Working within the computational and memory constraints of AR glasses
2. Network Dependency: Ensuring graceful degradation when internet connectivity is poor or intermittent
3. Audio Feedback Prevention: Preventing audio loops in development while maintaining natural conversation flow

## Accomplishments that we're proud of
### Innovation in AR-AI Integration
1. Seamless Multimodal Experience: Successfully created a natural conversation flow where users can speak to AI and see their ideas materialize as 3D objects in real space
2. Real-time Function Calling: Implemented sophisticated function calling between Gemini Live and Snap3D, allowing the AI to generate 3D content based on conversation context
3. Adaptive UI System: Built a spatial interface that intelligently switches between different interaction modes based on user context and device capabilities

### Technical Achievements
1. Custom System Instructions: Developed creative AI prompts that make the assistant listen to conversations and generate contextual 3D objects (like generating a clown wig when someone is called a clown)
2. Robust Audio Pipeline: Implemented a complete audio processing system with Base64 encoding, PCM16 conversion, and dynamic audio output management
3. Interactive 3D Objects: Created a complete pipeline from text prompt to manipulatable 3D objects that users can move, scale, and interact with in AR space
### User Experience Design
1. Intuitive Spatial Interaction: Designed natural hand-based interactions that feel native to AR environments
2. Visual Feedback Systems: Implemented comprehensive visual indicators for AI processing states, voice recording, and 3D generation progress
3. Graceful Error Handling: Built resilient systems that provide clear feedback when services fail or connectivity issues occur

## What We Learned
### AR Development Insights
1. Spatial Computing Paradigms: Gained deep understanding of how UI/UX principles translate to 3D space and the importance of maintaining spatial context
2. Performance Optimization: Learned to balance rich AI functionality with the constraints of mobile AR hardware
3. Cross-Platform Considerations: Understanding how to develop for both Lens Studio preview and actual Spectacles hardware
### AI Integration Patterns
1. Real-time AI Conversations: Mastered the complexities of maintaining natural conversation flow with streaming AI models
2. Function Calling Architecture: Developed patterns for reliable AI-to-service communication with proper error handling and status reporting
3. Multimodal AI Design: Learned to coordinate multiple input modalities (voice, camera, text) for rich AI interactions

## What's next?
### Enhanced AI Capabilities
1. Multi-AI Support: Integrate additional AI models (OpenAI, Claude, etc.) with seamless switching
2. Persistent Conversations: Add conversation history and context retention across sessions
3. AI Vision Integration: Enable the AI to see and comment on the user's environment through camera feed
4. Emotional Intelligence: Add sentiment analysis and emotional responses to conversations

### Advanced 3D Features
1. Physics Integration: Add realistic physics simulation to generated 3D objects
2, Animation Generation: Allow AI to create animated 3D content, not just static models
3. Gesture Recognition: Add hand gesture controls for manipulating objects and controlling the AI
4. Eye Tracking Integration: Use gaze for more natural UI interactions and AI attention
