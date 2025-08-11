---
type: Page
title: Full Kijko plan
description: null
icon: null
createdAt: '2025-07-27T22:30:42.603Z'
creationDate: 2025-07-28 00:30
modificationDate: 2025-07-28 00:31
tags: []
coverImage: null
---

# Full Software Architecture for the "Video Production Agent"

## Overview

The **Video Production Agent** is a conversational, multimodal application that guides a user from an initial creative brief through storyboard generation to a rendered video. The system orchestrates multiple AI services (LLMs, image generation, video generation) and tools (like FFMPEG) in a stepwise pipeline, while providing an interactive chat-based UI. It must handle user inputs (text, voice, file uploads), produce intermediate outputs (texts, images, preview videos), allow user edits at certain stages, and finally produce a consolidated video with accompanying metadata (a "playbook"). The architecture is designed for **reliability, speed, and scalability**, using appropriate frameworks and languages for each component. Below we outline the system’s components, the files/modules needed (with their roles), the recommended technology stack, and the suggested implementation sequence.

## High-Level System Components

The application consists of **Front-End (UI)** and **Back-End (Server)** components, alongside external AI services and cloud resources:

- **User Interface (Front-End):** A web-based chat application (single-page app) that displays the conversation and outputs (text, images, videos, etc.), plus a side panel ("Explore Wall") for published results. It includes controls for microphone input, file uploads, and special commands (e.g., editing prompts, approving storyboards).

- **Backend Orchestrator:** A server that manages the conversation state and orchestrates the multi-step workflow. It interprets user messages and triggers the appropriate tools/services in sequence (LLM for brief, image generation, video generation, etc.). It also enforces guardrails (limits on content/size) and handles persistence (saving data to cloud storage and databases).

- **AI Tool Integrations:** Modules or services that interface with external AI APIs:

    - *LLM (Gemini-Pro-2.5)* for generating text (creative brief, scene analysis, playbook summary).

    - *Image Generator (Imagen 4)* for turning scene descriptions into images (storyboard frames).

    - *Video Generator (Veo 3)* for turning images into video clips (both low-res previews and final high-quality scenes).

    - *Speech API* for voice input (ASR – Automatic Speech Recognition) and possibly TTS (text-to-speech, if needed for voice outputs).

    - *Search API (PaLM or Google Search)* if needed for any information retrieval (less central to the main pipeline, but available).

    - *External Agents/APIs (Perplexity, Fal.ai via A2A routing)* for handling special user queries directed at third-party AI sources.

    - *FFmpeg* (command-line tool) for stitching video clips together and mixing audio.

- **Data Storage & Persistence:** Integration with **Google Cloud Storage** (for storing media files like images and videos), **Firestore** (for storing playbook metadata and Explore Wall entries), and possibly **Google Drive AppData** (for saving session state or user-specific data like conversation history or agent templates). This ensures outputs and states are saved reliably and can be retrieved or shared.

- **Explore Wall Publishing:** A mechanism to publish final results to a public or shared gallery (the "Explore Wall"). This likely involves pushing data to Firestore and having the front-end display a gallery of published videos with metadata (title, tags, thumbnail, and a “Remix” action to spawn a new session from a playbook).

- **Sub-Agent Management:** The ability to save the current agent configuration as a template and spawn new agent instances via commands. This requires storing agent configs (in a database or config file) and logic to initialize a new agent session with a saved template.

- **Guardrails & Privacy Enforcement:** Checks and filters throughout the pipeline to enforce constraints (e.g., max video length, SafeSearch for generations, file size limits, and stripping personally identifiable information before sending data to external services). These are implemented in the backend orchestration layer for safety and reliability.

Each of these components will correspond to one or more files or modules in the codebase, as detailed below.

## File Structure and Responsibilities

Below is a comprehensive list of the files (grouped by front-end and back-end) that need to be created, along with their purpose in the system:

### Front-End (UI) Files

- `index.html` – The main HTML page container for the single-page application (if not using a framework’s dev server). It loads the front-end bundle and includes any required meta tags (for theme/color) and links to Material Design styles.

- `App.jsx` (or `App.tsx` if using TypeScript) – The root React component (if using React) that sets up the overall layout. It would include the **chat panel** (main conversation view) on the left and the **Explore Wall** pane on the right. It also manages global UI state (e.g., theme toggling, connecting to backend services, user authentication if needed for Google Drive).

- `ChatPane.jsx` – Component responsible for rendering the chat conversation. It iterates over a list of message objects (user or agent messages) and renders each appropriately. It handles formatting different message types from the agent: text messages, image galleries, video previews, final video, and collapsible playbook text. This component may contain sub-components for different message types (for cleaner code).

- `MessageBubble.jsx` – A sub-component to render an individual chat message. For agent messages, it will detect the content type and either render text, an image or set of images, a video element, or a special panel:

    - Text content is rendered in a simple `<div>` or Material-UI Card.

    - For **storyboard images**: displays a gallery of images (e.g., a grid or carousel). Each image might have an edit icon or an overlay to allow prompt editing (see next component).

    - For **video clips**: renders an HTML5 `<video>` element (or a Material UI video player component) with controls for play/pause. Draft clips might autoplay in loop.

    - For **final video**: similar video player but possibly larger or with download option.

    - For **playbook YAML**: renders a collapsible section (closed by default) with a formatted text (monospace block or syntax highlighting) inside, showing the YAML content.

- `ImageFrameEditor.jsx` – A component that appears when the user wants to edit a particular storyboard frame’s prompt (triggered by clicking an edit button on an image). It could be a modal or inline edit field. It displays the current prompt text for that frame and allows the user to modify it. It also provides a “Regenerate” button that, when clicked, sends an update (via the backend) to re-generate that specific image frame using the new prompt. This will result in updating the image in the UI. *(If a simpler approach is used, this could also be done via the user typing a chat command like* `/edit_prompt 2: new prompt`*, but a visual editor is more user-friendly.)*

- `ChatInputBox.jsx` – The bottom input area where the user types messages or uses the microphone. It contains:

    - A text input field for user messages (commands or requests).

    - A “mic” button to capture audio. When pressed, it should start recording audio and streaming it to the backend (or directly to a speech API) for transcription. It provides user feedback like a recording indicator. If streaming transcription is enabled, it can display partial text as the user speaks (real-time ASR).

    - An “upload file” button or drag-drop target for the user to provide reference assets (images, video clips, documents, etc. as allowed by `UPLOAD_ACCEPT` in the spec). The component should handle multiple file types and send them to the server (likely through a dedicated upload endpoint or as part of the chat context).

- `ExploreWall.jsx` – The right-side panel component that shows published results (the “Explore Wall”). It displays a list/grid of cards, each representing a published video project. Each **card** might show a thumbnail (possibly the final video’s first frame or an uploaded cover image), the title of the video, some tags or brief description from the creative brief, and a “Remix” button. The Remix button, when clicked, could trigger the creation of a new agent session using that playbook (likely via a backend call or special command, using the sub-agent spawn feature). This component will retrieve the list of published entries from the database (Firestore) – either by direct client-side Firestore queries or via a backend API call that returns the list.

- `ExploreCard.jsx` – A sub-component for an individual published item in the Explore Wall. It formats the video thumbnail (as an embedded video element or an image snapshot), title, and tags. It also includes the “Remix” action button.

- `MaterialTheme.js` – A configuration file or code snippet to set up Material 3 theming for the UI. If using Material-UI (MUI) or a similar library, this will define the light theme palette, typography, etc., to align with Material You (Material 3) guidelines. This ensures the app has a modern aesthetic with minimal, clean components consistent with the spec.

- `firebaseConfig.js` (optional for front-end) – If the front-end needs direct access to Firestore (for reading the Explore Wall or for authentication), this file contains Firebase project configuration and initialization of Firebase SDK. (If we strictly use backend for database access, this file might not be needed on the client.)

- **Assets**: Static assets like **logo or icons** (e.g., a briefcase emoji icon used in system prompt description might be an icon) or loading spinners, etc. Also possibly CSS files if not entirely using JS styling. If bundling with a build tool, these might not be standalone files but worth noting.

- **Front-end Build/Config Files**: such as `package.json` (listing front-end dependencies like React, MUI, Firebase SDK, etc.), bundler config (if using webpack or Vite, etc.), and a script to build/deploy the front-end. These ensure the front-end can be built and served (for example, deployed via Firebase Hosting as indicated by the spec).

### Back-End (Server) Files

- `server.js` (or `app.js` / `main.py` depending on language) – The main entry point of the backend application. If using Node.js, this would set up an Express server (or a FastAPI app in Python, etc.). The server is responsible for managing WebSocket/SSE connections or HTTP endpoints for the chat. Key responsibilities:

    - Serve the front-end (if not using a separate static hosting).

    - Establish an endpoint (or socket) to receive user messages/commands and file uploads. For example, a WebSocket route for the chat stream, or HTTP routes like `POST /message` and `POST /upload`.

    - Implement a session management to track each user’s conversation state (could be in memory with a session ID or via a database if needed for persistence).

    - Coordinate the multi-step pipeline: upon receiving a user’s prompt or command, the server invokes the appropriate step logic (see step modules below). For complex multi-turn interactions, the server might use a state machine or a simple state flag to know which step is next or which step is currently awaiting user approval.

    - Stream results back to the client as they become available. For example, after generating the creative brief, send it as a message to the client; then proceed to generate images, sending each or the gallery when ready, etc. This can be done via WebSocket events or server-sent events so the UI updates in real-time without polling.

    - Enforce **guardrails** at entry points (e.g., validate upload file size < 1GB, check total requested video length < 2 min by counting planned scenes, apply SafeSearch flags on AI API calls).

    - Initialize any global configs like API keys, and connect to database services (Firestore, Cloud Storage) at startup.

- `config.js` (or `.env` file) – Configuration file for sensitive keys and settings. This stores API credentials for Google APIs (for Gemini, Imagen, etc., if required), Firestore/Storage credentials (if not using default application credentials on GCP), and other settings (SafeSearch mode flags, max limits, etc.). This file is not business logic per se, but it’s crucial to keep configuration separate from code. Use environment variables or a secure store in production to keep secrets safe.

- `routes.js` (if using Express) – Define HTTP API routes or WebSocket event handlers for various actions:

    - A route for receiving user chat messages (which triggers the pipeline progression).

    - A route for voice input (maybe receiving audio stream or chunks and forwarding to ASR service).

    - A route for file uploads (saving them and associating with the user’s session context).

    - Possibly routes for specific commands like approving storyboards or editing prompts, if not handled via the same chat endpoint.

    - Routes for retrieving published content (if front-end doesn’t directly use Firestore; e.g., `GET /explore` to list all published projects).

- **AI Integration Modules:** Dedicated modules for calling external AI services. Encapsulating each integration in its own file keeps the code organized and allows swapping implementations if needed. These modules will export functions that the pipeline steps can call. For example:

    - `geminiClient.js` – Contains functions to call the Google **Gemini-Pro-2.5** LLM API. For example, a function `generateCreativeBrief(context)` that sends the prompt (constructed from conversation context) to the Gemini model and returns the resulting brief text. It will handle the HTTP request to Google’s API (or SDK call), including any required formatting of the prompt and parsing of the response. It could also contain a utility to call Gemini for *analysis tasks*, such as extracting key scenes from the brief (if needed as a separate call).

    - `imagenClient.js` – Provides a function to call **Imagen 4**, Google’s image generation model. E.g., `generateImage(prompt, styleParams)` that sends a prompt string and style parameters (like `--ar 16:9` aspect ratio, and a cinematic style flag) to the Imagen API. It handles receiving the image (likely as a binary or base64) and saving it as a file (e.g., `frame_{n}.png`). This module should also ensure SafeSearch or content filter is enabled on the request (to respect the guardrail). If the API returns a seed or reference, the function should capture that for later use (for reproducibility in the playbook).

    - `veoClient.js` – Interfaces with **Veo 3**, the video generation model. It will have methods like:

        - `generateDraftClip(imageFile, duration)` to create a short low-res looping clip from a given image (for previews). This function will upload or send the image (frame) to Veo’s API with parameters (e.g., “2 seconds, loop, maintain composition”) and get back a video clip (saved as `clip_{n}_draft.mp4`).

        - `renderFinalClip(imageFile, sceneSeed)` to generate the final high-quality clip. It uses the reference image and possibly a seed or metadata (to ensure fidelity to the draft) and requests a longer, high-quality render (e.g., 4 seconds with audio). It saves the result as `clip_{n}_final.mp4`.

        - Both functions should handle asynchronous operation (video gen might take time). They might poll a status or wait on a callback depending on API. Errors (e.g., if generation fails or times out) should be caught and conveyed to the user.

    - `speechClient.js` – Wraps the **Google Speech API** for ASR (and possibly TTS). It could have:

        - `transcribeAudioStream(audioStream)` which takes in a stream of audio (from the user’s mic) and streams it to Google’s speech-to-text, receiving incremental transcripts. This likely uses Google’s streaming gRPC or REST for speech. The module sends partial text to the server which in turn relays it to the UI (for live transcription UX).

        - Optionally, a `textToSpeech(text)` if we later want to generate spoken responses (not explicitly in spec, but could be a future addition).

    - `searchClient.js` – (If needed) to call the **Google PaLM Search** or a general Google Search API. This might be used if the agent needs to gather external info during the conversation (though not explicitly in the main workflow, it might support user asking general questions or the agent verifying something for the video content).

    - `externalAgentsClient.js` – Handles calls to external Multi-Provider agents like **Perplexity** or **Fal.ai** via the Agent-to-Agent (A2A) protocol. For each supported external agent, this module defines how to format the request and endpoint:

        - e.g., `queryPerplexity(query, context)` that calls Perplexity’s API with the user’s question.

        - `queryFalAI(message)` similar for Fal.ai.

        - If a custom URL is provided (for a user-defined MCP), it could have a generic handler to forward the message.

        - This module abstracts the details so that the main server can simply call these when it sees a user message starting with `@Perplexity:` etc.

- **Pipeline Step Modules:** It’s helpful to separate each major step of the workflow into its own module for clarity and maintainability. Each step module will handle the logic of that step, often by calling the AI integration modules above. For example:

    - `step1_creativeBrief.js` – Function `doCreativeBrief(session)` that orchestrates Step 1 (Creative Discovery). It will take the current conversation context (the user’s prompts and any uploaded references), formulate the prompt (as specified in the SYSTEM_PROMPT_TEMPLATE) to ask Gemini for a concise creative brief (including goal, audience, tone, deliverables). It then calls `geminiClient.generateCreativeBrief(context)` and gets the result. The result (brief text in markdown) is saved to a file (e.g., `workspace/brief.md` for record) and also returned to be sent to the user as a chat message. If the LLM also provides structured data for key scenes, this function will capture that (perhaps as an array of scene descriptions in the session state) for use in the next step.

    - `step2_storyboard.js` – Function `doStoryboardFrames(session)` for Step 2 (Storyboard Generation). This depends on the output of step1 (the creative brief). It will retrieve the list of *key scenes* from the session (these could have been extracted by step1, or this function might call `geminiClient` again with the brief to get a list of scene descriptions). For each scene, it constructs a prompt for the image (by combining the scene description with style instructions like cinematic style and 16:9 ratio). Then for each prompt it calls `imagenClient.generateImage(prompt)` – possibly in parallel to speed up generation if multiple scenes:

        - The outputs are images `frame_1.png...frame_n.png` and perhaps prompt texts saved as `prompt_1.txt...prompt_n.txt` for reference.

        - This module returns a set of image paths (or URLs if uploaded) and their prompts. The server will send these images to the UI as a gallery message. The UI can allow the user to edit these prompts. If the user makes changes, those changes will call back perhaps an `editImageFrame(frameIndex, newPrompt)` function (could be part of this module or the main server logic) that re-invokes `imagenClient.generateImage` for that single frame to update it. This step module should be idempotent or re-callable for such updates.

    - `step3_videoPreviews.js` – Function `doLowResPreviews(session)` for Step 3 (Image → Video preview). After storyboard images are ready (and possibly adjusted by user), this step takes each image (frame) and calls `veoClient.generateDraftClip(image, 2s)`. It might iterate through frames one by one (or a few concurrently if the video API can handle parallel requests) to produce a short motion preview for each scene. Each draft clip `clip_i_draft.mp4` is saved. Once each is ready, the server can send the video back to the UI, or send them all when done. Likely it would display each inline under its corresponding image or in sequence as they finish. The user can watch these 2-second loops to get a sense of motion/composition for each scene.

    - `step4_reviewLoop.js` – This isn’t a generation step but a **gate/checkpoint** in the pipeline. It represents the user review & tweak phase. Implementation-wise, this could be handled in the main flow control rather than a separate module:

        - After previews are shown, the server will pause the automated pipeline and wait for the user’s input. The user can issue commands: “Approve storyboard” (to continue to final render) or edit commands like `/edit_prompt 2 "new prompt"` or `/replace_image 3 [upload]` or `/skip 4` to drop a scene.

        - The server logic needs to interpret these commands:

            - For `/edit_prompt` or if the UI already handled prompt editing via the gallery interface, it will call back into `step2_storyboard` for that specific frame, regenerate the image (and probably automatically regenerate the corresponding preview clip by re-invoking `step3_videoPreviews` for that frame).

            - For `/replace_image n`, if a user uploads a custom image to use instead of the AI-generated one, the server should accept that image and skip calling Imagen for that frame. The custom image could then be used in the previews and final render steps for consistency.

            - For `/skip n`, the server should mark that scene as removed – possibly adjusting the list of frames (so that final video will exclude it). It might also instruct the UI to remove that frame from the gallery and drop its video preview.

        - The loop continues: after any edit or replace, the updated frames can be re-previewed until the user is satisfied and signals approval (or if they say "approve" immediately without changes, proceed).

        - Implementing this might involve a state machine that goes back to Step 2 or 3 as needed when edits occur. The commands can be parsed in the main server and then delegate to appropriate step functions for regeneration.

    - `step5_finalRender.js` – Function `doFinalRender(session)` for Step 5 (Final high-quality video rendering). This runs after the user approves the storyboard/previews. It will iterate over each remaining scene frame and call `veoClient.renderFinalClip(frameImage, seed)`:

        - The `seed` or generation parameters from the draft stage should be reused if possible so that the final video is consistent with the preview (the spec mentions using the same seed for fidelity). The session should have stored the generation parameters from the draft step or the initial image generation.

        - Each call produces a `clip_i_final.mp4` of ~4 seconds with full quality and with audio (foley sound) as requested. These might be larger or slower to generate, so this step could be time-consuming. It can be done sequentially or in parallel if infrastructure allows (parallel saves time but uses more resources; might do 1-2 at a time to balance).

        - Save all final clips and monitor progress (if these are asynchronous, might need to poll for completion). Once done, the server can notify the UI that final rendering is complete (optionally showing each as it completes or a final "all done" message).

    - `step6_concatAndMix.js` – Function `doVideoConcatenation(session)` for Step 6 (Concatenate clips and mix audio). Using **FFmpeg**, this function will take all the final clip files and stitch them into one continuous video:

        - Construct the complex ffmpeg command as given in the spec (with multiple inputs and the concat filter). If there are N clips, the command must include all N inputs and set up the filter graph to concatenate video and audio streams sequentially.

        - Run this command (via Node’s `child_process.spawn` or Python’s `subprocess`) and produce `final_video.mp4`. Ensure to handle errors and wait for the process to finish.

        - The resulting `final_video.mp4` is the main deliverable. After creation, this function can also generate a thumbnail (like capture the first frame using ffmpeg or use one of the frames) if needed for the Explore Wall card.

        - Once final video is ready, the server should stream or send it to the client (perhaps not the entire video file through WebSocket due to size, but rather provide a URL or trigger the client to download/stream it from cloud storage as described below).

    - `step7_playbook.js` – Function `generatePlaybook(session)` for Step 7 (Playbook generation). This uses the LLM (Gemini) to summarize the entire project into a YAML playbook. Implementation:

        - Gather all relevant data: the creative brief text, the list of scene prompts and seeds, tool names and settings used, file names or their hashes, etc. This could be compiled into a structured string or passed as context to the LLM.

        - Craft a prompt instructing Gemini to output a YAML with all steps, prompts, seeds, tools, and asset hashes, making it a “reproducible playbook.”

        - Call `geminiClient` with this prompt and get the YAML text output. Alternatively, since we have structured data, we might *generate the YAML programmatically* and maybe have Gemini just provide additional commentary or verification. But as per spec, using the LLM for this keeps it conversational/consistent.

        - Save the YAML text to `playbook.yaml` file. Also store a copy in the database (Firestore) as part of the published record, so others can use it for Remix. The YAML includes hashes of source assets (we can compute MD5 or SHA of each image/video and include those).

        - This playbook text is then sent to the UI as a message in a collapsible panel for the user to review.

    - `step8_publish.js` – Function `publishToExploreWall(session)` for Step 8 (Publishing results). This handles taking the final outputs and making them available on the "Explore Wall":

        - Upload `final_video.mp4` to the designated Cloud Storage bucket (e.g., `gopal-media`). Make sure it has a unique name or path (perhaps include user or project ID and timestamp). After upload, get a public URL or a storage path. If the Explore Wall is public, you might set the ACL for the video to be readable (or use Firebase Hosting to serve it).

        - Upload the `playbook.yaml` similarly (or store its contents directly in Firestore).

        - Choose a thumbnail image for the card – could use the first frame (`frame_1.png`) or a generated thumbnail. Upload if needed.

        - Create a document in Firestore (e.g., in a collection `"playbooks"` or `"published_projects"`) with metadata: title (could use a short title from the creative brief or default to "Untitled Video"), maybe tags (if the user provided or derived from content), a reference to the video URL or storage path, a reference or embedded copy of the playbook YAML, and perhaps some user identifier or timestamp.

        - The Explore Wall front-end will then be able to fetch this document to display the new entry. Possibly call `publishToExploreWall` at the very end of the pipeline automatically. Alternatively, you might let the user explicitly hit a “Publish” button (which then triggers this function), depending on whether every project should be public. For now, spec implies auto-publish.

        - This module might use a helper library for Firestore and Cloud Storage (Google provides SDKs for Node/Python).

- `AgentRegistry.js` – This module manages Sub-Agent templates (step 9 of spec). It will store and retrieve agent configurations:

    - Provide a function `saveAgentTemplate(name, config)` that saves the current agent’s config under a given name. "Config" here includes possibly the system prompt template and default toolchain (from the GLOBAL SETTINGS), or even the entire pipeline definition. Since our pipeline is mostly fixed in code, it might simply store the system prompt or any customizations. However, if we foresee different agent variants (maybe an agent specialized for certain content), this could store those variations.

    - The storage could be done in Firestore (e.g., a collection "agents" with documents keyed by name containing the config JSON). Or a simpler approach: store in a local JSON file or in memory if persistence is not required across restarts (Firestore is preferable for scalability).

    - Also provide a function `spawnAgentSession(name, args)` for when a user calls `/{agent_name}`. This would retrieve the template and create a new session with that config. Implementation might involve duplicating the conversation state object and applying the new system prompt or settings, then treating subsequent messages as going to the new agent. In a multi-agent environment, this might also involve notifying the A2A router if using one. In our case, it could simply reset or reinitialize the dialogue with the new agent persona.

- `CommandParser.js` – A utility module to parse and handle special user commands (like the slash commands and @ mentions). While the main server can directly interpret, having this module keeps things tidy:

    - It can export a function `parseUserMessage(session, message)` that checks if the message starts with `/` or `@` and then returns a structured command object or calls the appropriate handler.

    - Handles commands:

        - `/save_agent {name}`: call `AgentRegistry.saveAgentTemplate(name, currentConfig)`, and respond to user with a confirmation.

        - `/agent_name {...args}`: detect if the command matches a saved agent template name, then call `AgentRegistry.spawnAgentSession(name, args)` to switch context (and maybe respond that agent is active).

        - `/edit_prompt n: ...` or variations: return a command indicating the frame number and new prompt text, so the server can route it to the storyboard regeneration logic.

        - `/replace_image n` (likely followed by or combined with an image upload): this one might be handled through the upload route rather than pure text (the user might upload an image and caption it as a replacement for frame n). We can coordinate by expecting an upload right after the command.

        - `/skip n`: mark a frame to skip in session state.

        - An "Approve storyboard" command could be just the user typing that phrase or clicking an Approve button. The parser can normalize that to a standard action for the pipeline (to proceed to final render).

    - Handles `@mcp_name:` syntax:

        - For e.g. `@Perplexity: What are the latest trends in video marketing?`, the parser would identify `mcp_name="Perplexity"` and the query. It calls `externalAgentsClient.queryPerplexity(query, context)` and returns the result (which is then sent as an agent message). These external calls likely happen outside the main video pipeline (as a side capability in conversation), so the server can handle them on the fly using this module.

- `Guardrails.js` – A module implementing content and usage guardrails:

    - Functions to check content safety of prompts or outputs. For instance, after getting an image or video, we could use Vision APIs to ensure nothing explicit was produced (if SafeSearch isn’t fully reliable, a secondary check).

    - Enforce length limits: e.g., `ensureVideoLengthLimit(sceneCount, sceneDuration)` to make sure total <= 2 min. The server can use this to warn or limit how many scenes or the duration requested.

    - `validateUpload(file)` to reject files over 1 GB or disallowed types. This can be used in the upload route.

    - `stripPII(text)` to remove personal data from any content sent to external agents. For example, before sending a user’s prompt to Perplexity or Fal, run this to redact emails, phone numbers, etc. (Could use regex or even an AI classifier if needed).

    - These functions would be invoked at appropriate points in the pipeline, mainly by the server or integration modules.

- `Persistence.js` – A module for session and data persistence:

    - `saveSessionState(session)` – would serialize the current conversation state (messages, any intermediate outputs, maybe user ID) to **Google Drive** AppData for that user. This allows the session to be resumed later. (This requires the user to be authenticated with Google and granting Drive access; the front-end might handle auth and provide a token to the back-end for Drive API calls.)

    - `loadSessionState(user)` – to restore a past session when the user returns.

    - This module might use the Google Drive SDK to upload a JSON file representing the session into the user’s Drive (AppData is a hidden application-specific storage).

    - It may also handle any caching of intermediate artifacts references if we wanted (though likely we rely on Cloud Storage for actual files).

    - Additionally, provide helpers for saving to Firestore or Storage if not done directly in step modules. For instance, `saveToFirestore(collection, data)` and `uploadToCloudStorage(filePath)` wrapping common calls. However, this could also be done inline in the step modules or a dedicated part of publish.

- **Configuration/Build Files**:

    - `package.json` – Lists back-end dependencies (e.g., Express or Fastify, Google Cloud client libraries, Socket.IO if used, ffmpeg static binaries or ffmpeg wrapper, etc.). Also defines scripts for running the server. If using TypeScript, include a tsconfig etc.

    - `Dockerfile` – A container configuration to package the backend application (and possibly serve the front-end). It would use a base image for Node (or Python) and include installation of FFmpeg (since FFmpeg is needed at runtime). This ensures the app can run on Google Cloud Run or similar, scaling reliably. The Dockerfile will copy the application code, install dependencies, and set the entry command (e.g., `node server.js`). Including FFmpeg in the image is critical so that the `ffmpeg` command in step6 works.

    - `firebase.json` and `firestore.rules` (if deploying front-end and using Firestore security) – for hosting configuration and security rules. This is relevant if using Firebase Hosting for the Explore Wall and Firestore for data. The hosting config can specify that the front-end is a single-page app (rewrite all routes to index.html). The Firestore rules should allow read access to the published projects (maybe open for read, and write access only to the server or authenticated users).

### Notes on External Files/Assets

In addition to the code files above, the system will deal with **user-provided files and generated media**:

- Uploaded assets (user references) will be stored (perhaps in a temp folder or directly to Cloud Storage) for use by the agent.

- Generated images (`frame_{n}.png`) and clips (`clip_{n}.mp4`) are temporary files. They can be stored in a working directory on the server (e.g., `/workspace`) as indicated in the spec. These may be cleaned up after they’re no longer needed (to save space).

- Final outputs (`final_video.mp4` and `playbook.yaml`) are saved and persist for sharing. After upload to cloud storage or Firestore, local copies can be removed.

- Log files (if any) for debugging and monitoring could be configured (not mandatory, but a production system might have a logging mechanism to track each step execution times, API responses, etc., possibly using a library or cloud logging).

## Implementation Plan (Development Order)

Building this project involves setting up the infrastructure and implementing features in a logical sequence. Below is an order in which to approach development, ensuring core functionality comes first, followed by enhancements and optimizations:

1. **Project Setup:** Initialize a code repository. Set up the back-end project with your chosen language and framework (e.g., initialize a Node.js project with Express, or a Python project with FastAPI). Create the `server.js` (or equivalent) and ensure a basic server runs (e.g., a health check route). Also, set up the front-end scaffolding (e.g., create-react-app or Next.js project) even if just a placeholder page to start with. This ensures you have the basic structure in place.

2. **Integrate Core AI Services:** Focus on back-end integration with the key AI tools since these are the backbone of functionality.

    - Start with the **Gemini LLM** integration. Implement `geminiClient.js` with a function to call the API (you may use mocking or a placeholder if the actual API isn’t available yet). Test it by writing a simple script or route that sends a dummy prompt and prints the response.

    - Next, implement the **Imagen API** interface in `imagenClient.js`. You can mock image generation initially (return a placeholder image) if needed, but ideally prepare it to call the real model once credentials are available.

    - Implement the **Veo video API** in `veoClient.js`. Again, possibly start with pseudo-calls or a simplified version (maybe use a static video clip as a placeholder for testing) if the real service is not easily accessible initially.

    - Set up the `ffmpegUtil` (this might be within the concat step code) by ensuring you can call the `ffmpeg` command via code. Test by manually concatenating two short sample videos to verify ffmpeg is working in your environment.

    - Implement the `speechClient.js` with Google Speech-to-Text. You can test microphone input later; for now ensure you can send an audio file to it and get text.

    - At this stage, you have the building blocks to perform each type of operation.

3. **Implement Pipeline Step Functions:** Develop the workflow logic step by step.

    - Implement `doCreativeBrief` (Step 1) to call Gemini with a prompt constructed from a dummy conversation context. For initial testing, you can simulate `conversation_context` with a hardcoded example. Verify it returns a sensible brief text.

    - Implement `doStoryboardFrames` (Step 2). For now, you might manually define a couple of scene descriptions to test image generation. Call `imagenClient.generateImage` for each and ensure images are saved. Use placeholders if the API is not ready, but structure the loop and saving mechanism. Confirm that after this step you have, say, 2-3 image files.

    - Implement `doLowResPreviews` (Step 3) calling `veoClient.generateDraftClip` on an existing image file. If the actual video generation is not yet integrated, you can simulate by copying a static short video or using ffmpeg to pan on the image as a fake clip. The goal is to ensure the loop and saving of preview videos works.

    - Tie Steps 1–3 together in the main server flow: when a user message arrives (or when you trigger manually), run `doCreativeBrief`, then `doStoryboardFrames`, then `doLowResPreviews`, and send each result to the (currently minimal) client or to logs for verification. This will confirm the sequential orchestration is working.

    - Implement the review loop (Step 4 logic). For now, simulate user approval or an edit command. You can craft a test in the server: after previews, call the same functions again if an edit is needed. Write handlers for commands like `/skip` or `/edit_prompt` that adjust the session state (e.g., remove an item from scenes list or change a prompt and regenerate image+preview). Test these handlers by calling them directly.

    - Implement `doFinalRender` (Step 5) to call the high-quality video generation for each scene. As a test, you might take the preview clips or images and just copy them as "final" clips to simulate. Eventually wire it to `veoClient.renderFinalClip`. Ensure multiple clips are produced as expected.

    - Implement `doVideoConcatenation` (Step 6) with FFmpeg. Use the draft or final clips you have to test that the concatenation command works and produces `final_video.mp4`. Verify that the duration and order are correct.

    - Implement `generatePlaybook` (Step 7). Initially, you can generate a simple YAML string in code (e.g., containing scene prompts and dummy seeds) to ensure formatting is correct, then later integrate the Gemini call to make it more sophisticated. Save the YAML to file.

    - Implement `publishToExploreWall` (Step 8). For testing, set up a local or test Firestore and a cloud storage bucket (or a local directory to simulate). Write the final video and YAML to these stores. Then ensure you can retrieve them (e.g., via the Firestore client or by listing the bucket). This confirms that your app can persist the outputs.

    - At this point, the core pipeline from start to finish can be executed end-to-end, albeit with some placeholders. It’s crucial to test each step individually and then as a whole pipeline with a sample input.

4. **Develop the Front-End UI:** With the back-end pipeline in place, start building the user interface and connect it to the server.

    - Build the **ChatPane** and **ChatInputBox** components first. Create a simple chat display that can show plain text messages, and an input box where you can send a message. Hook this up such that when the user submits text, it calls the backend (via a WebSocket emit or HTTP request) and then displays the agent’s response when received. Initially, just test with a simple echo from the backend or a dummy response to ensure connectivity.

    - Implement front-end **WebSocket or SSE logic**: if using WebSockets, integrate a library like Socket.IO on both server and client for simplicity. Have the server push messages for each step to the client as separate events (e.g., an event type for 'briefGenerated', 'imagesGenerated', 'previewGenerated', etc., or just a generic 'agentMessage' event with content type info). The client should listen and append messages to the ChatPane accordingly. Test this by triggering the pipeline from a single user message and watching the messages appear one by one.

    - Enhance **ChatPane** to handle rich content: images and video. Utilize HTML elements or Material UI components:

        - When an agent message event contains image URLs/Blobs for storyboard frames, display them in a gallery format. Implement the **ImageFrameEditor** overlay so if an image is clicked for editing, the user can input a new prompt. When a new prompt is submitted (perhaps via a small form or hitting enter), send a command to the backend (maybe use the same WebSocket connection, an event like 'editFrame' with frame index and new prompt). Ensure the backend receives this, regenerates the frame, and then the updated image is sent back and replaces the old one in the UI.

        - When a message contains a video clip (draft or final), render a video player component. Ensure videos are properly loaded. For efficiency, you might not want to send the actual binary over the socket; instead, once a draft video is generated and saved on the server (or uploaded to cloud storage), you can send an event with just a URL or path. The front-end can then set that as the video src to stream it. This is especially needed for the larger final video. (During local dev, you could encode the video as base64 just to see it works, but in production use streaming URLs.)

        - Implement the **collapsible playbook panel** for the YAML text. This could be a simple `<details>` HTML tag or a Material UI expansion panel component. By default it’s collapsed, showing perhaps a label like “Show Playbook (YAML)”, and expands on click to show the monospaced YAML text.

    - Implement the **ExploreWall** component. Set up Firestore on the client (or call the backend to fetch) to get the list of published entries. Display each using the ExploreCard sub-component. Make sure the thumbnail and video links are working (you might need to configure CORS on the bucket or use a proxy if necessary for videos to play from Cloud Storage).

    - The **Remix** button on a card: decide how this works. The likely flow is: when clicked, it should start a new chat session using the playbook. This might be accomplished by sending the playbook YAML to the backend and instantiating a new agent session with those parameters (perhaps via the `/agent_name` command mechanism or a dedicated endpoint). Implement this by allowing the front-end to either:

        - open a new window/tab with the agent (if multi-session UI is supported), or

        - in the same chat panel, clear current session and start with the new agent prompt. For simplicity, perhaps treat it as a command like `/load_playbook YAML_CONTENT`. But since spec suggests a saved sub-agent, you might instead have the backend store the YAML and assign it a name or ID, then the remix button could effectively do `/playbookID` to spawn.

    - Finally, polish the UI: apply the Material 3 theme across components, ensure responsiveness (the two-column layout should work on different screen sizes, maybe collapsing the Explore Wall on mobile). Add the microphone functionality: use the Web Audio API or MediaStream to capture audio, send it to backend (possibly chunked via the WebSocket). Display partial transcription as it comes in (this can be an event from backend if using streaming ASR, or handle on client if using a Web Speech API as fallback). Also, implement the file upload in the input box and send files to the backend (you might add a hidden form or use an API route; ensure the backend writes the file and notes it in session for context).

5. **Tie in Persistence and User Accounts:** Once the app is functional, integrate the persistence features.

    - Enable Google authentication on the front-end if using Drive for session. This likely involves OAuth to get a token for Drive and Firestore if needed. Simplest is using Firebase Auth with Google sign-in, which gives access to Firestore security and possibly a Cloud Function could use that credential for Drive if needed. Alternatively, have the user paste an API key or skip Drive if not crucial.

    - Implement the `Persistence.saveSessionState` calls in the backend: e.g., at certain checkpoints or on session end, save the conversation history and maybe the latest playbook to Drive. Implement `loadSessionState` when a user logs in or returns to restore their last session (this could also allow resuming an unfinished project).

    - Ensure the Firestore and Cloud Storage integration is fully working with security rules. Test uploading a final video via the backend and reading it from the front-end. Test that Firestore documents for explore wall items are created and are readable from the client. Adjust rules if needed (for example, allow read to all, write only via backend with admin privilege).

    - Implement any missing pieces of the Agent Registry: make sure `/save_agent` command triggers saving to Firestore (or some store), and that calling a saved agent (via `/agent_name`) properly loads its config (system prompt template and settings) into a new session. You can test this by saving an agent, then starting a new session with that name and verifying the pipeline still works but maybe with different initial behavior if the prompt template was different.

6. **Testing and Iteration:** Rigorously test each part of the system:

    - Test the full pipeline with various user inputs (different lengths of creative briefs, different numbers of scenes, different media). Ensure edge cases are handled (e.g., if the user provides fewer details and the LLM returns a very short or very long brief, or if an image generation fails due to content).

    - Test error conditions: e.g., disconnect the network from an API call to see if your code times out and recovers gracefully; try uploading a >1GB file to see if the server correctly rejects it; attempt a prompt that might trigger unsafe content to verify SafeSearch stops it.

    - Verify performance: measure how long each step takes. If image or video generation is slow, consider enabling parallel execution for those steps to reduce total time (spawn multiple requests at once if APIs allow, especially for image generation which can be parallelized). Make sure the server can handle multiple user sessions simultaneously (simulate two users generating videos in parallel and see if the app remains responsive and within memory/CPU limits).

    - Implement caching or reuse where possible: e.g., if two scenes have identical prompts or if user regenerates the same prompt again, you might reuse the result to save time (this is an optimization, not required but could improve performance).

    - Optimize the front-end: lazy-load heavy components, ensure video elements are cleaned up when not needed (to free memory), and paginate or limit the explore wall entries if that list grows large.

7. **Deployment and Scalability Setup:** Prepare the application for production deployment with scalability in mind.

    - Containerize the backend using the Dockerfile. Ensure it runs correctly in a container (test locally or in a staging environment). The container should bundle the Node/Python app, include FFmpeg, and have environment variables for API keys set via the cloud runtime (not baked into the image).

    - Deploy the backend to a scalable service (for example, **Google Cloud Run** or **Kubernetes**). Cloud Run can automatically scale instances based on traffic and has a generous timeout (good for long video generation tasks) and can integrate with other Google services easily. Set concurrency settings to allow multiple requests per container if memory permits (for example, maybe allow 5 chats concurrently per instance to better utilize resources, or scale to 0 when none).

    - Deploy the front-end to **Firebase Hosting** (as suggested). Run a production build of the React app and upload it. This will serve the UI from a CDN, ensuring fast delivery globally. The front-end will communicate with the backend via its URL (consider CORS config on the backend to allow the hosting domain).

    - Set up a Firestore database (in production mode with appropriate indexes if needed) and a Cloud Storage bucket for media. Use a CDN or direct links for videos if the audience is broad, to ensure smooth playback (maybe enable public read for the final video files, as they are presumably safe content).

    - Monitor usage and performance: integrating a monitoring tool or using Google’s Cloud Monitoring to track response times and resource usage. This helps ensure the app remains **reliable under load** and can scale out before becoming slow.

8. **Performance Tuning & Future Improvements:** After deployment, you may need to adjust the architecture for greater scale:

    - If certain steps become bottlenecks (e.g., video generation is very slow and one instance can’t handle too many requests), consider offloading that work to a background job queue. For example, when user approves storyboard, you could enqueue a job to do final rendering and notify the user when done (so they don’t hold a server thread for a long time). Technologies like Google Cloud Tasks or a RabbitMQ/Redis queue with worker processes could be used. This complicates the flow (the user might have to wait asynchronously or get notified), so this is an optional scaling strategy.

    - If using Python and GPU for AI calls, consider running those on AI Platform or Vertex AI endpoints rather than locally to leverage scalable infrastructure. The Node/Python backend should mainly orchestrate and not do heavy compute itself.

    - Implement content **caching** for repeated use of the same assets or prompts (though each project is unique, caching might apply if users remix the same playbook frequently – e.g., caching images so that remixing doesn’t regenerate identical frames).

    - Extend features: possibly add the text-to-speech to have the agent or final video narrate the brief, or integrate more editing options for the user. These can be done without changing core architecture, demonstrating the flexibility of the design.

By following this order, we build a working backbone first and then layer on interactivity, persistence, and scaling enhancements. This ensures at each stage we have a testable product and reduce complexity when debugging.

## Technology and Framework Choices (Performance & Scalability)

Choosing the right tech stack is crucial for meeting the performance and scalability goals of this project. Here are the recommendations for programming languages and frameworks for each part of the system:

- **Backend Language & Framework:** **Node.js with Express (JavaScript/TypeScript)** is a strong choice for the backend orchestrator. Node’s non-blocking I/O and event-driven nature are ideal for handling multiple simultaneous interactions and streaming data (like live chat updates or audio streams) efficiently. Express is lightweight and well-suited to building a REST and WebSocket API quickly. Additionally, Node has robust libraries for working with Google Cloud services (official SDKs) and handling file processing. It can easily spawn the FFmpeg process for video concatenation. If using TypeScript, it can help catch errors early and define clear interfaces for complex data (like the session state, message formats, etc.).*Why not Python?* Python (with FastAPI or Flask) is also viable, especially given the AI/ML context (many AI libraries are Python-based). However, since our heavy AI tasks are offloaded to external services, Python’s advantage is less pronounced there, and Node’s superior concurrency (without needing threads) can handle multiple requests and streaming more smoothly. Node also integrates well if we choose to use Socket.IO for real-time updates. In terms of raw performance, both can be scaled horizontally; Node might handle more concurrent connections per instance, whereas Python’s async capabilities could achieve similar results but require more careful implementation. Given the need for real-time interactivity (ASR streaming, multi-step message push), Node/Express with websockets is slightly more straightforward.

- **Real-Time Communication:** **WebSockets** (with Socket.IO or the native WebSocket API) are recommended to achieve a smooth interactive experience. This allows the server to push each intermediate result to the client immediately without the client polling. Socket.IO (for Node) simplifies reconnections and fallbacks, which adds reliability, and can also help in binary data transfer if needed (though we likely send URLs for images/videos rather than raw data). If using Python, one might use WebSocket support in FastAPI or a library like `uvicorn`’s WS, but that’s an extra complexity. SSE (Server-Sent Events) is a lighter alternative for one-way streaming of events (from server to client) which could also work since the client mostly needs to receive events. SSE is HTTP-based and easier to implement than raw websockets for simple streaming; however, it doesn’t support client-to-server messages except via normal posts, so websockets are more flexible for full duplex (e.g., streaming audio from client to server and transcription back simultaneously). Thus websockets are ideal here.

- **Front-End Framework:** **React** (JavaScript/TypeScript) is a good choice for building the front-end as a single-page application. It provides the flexibility to create interactive components needed for the chat interface and dynamic content like video players and image galleries. Coupled with **Material-UI (MUI)** or another Material Design 3 compatible library, we can quickly style the app to the desired look and feel. React’s virtual DOM ensures efficient updates which is beneficial when new messages are streaming in. Alternatives like Angular or Vue could also be used; Angular in particular has official Material components and a more structured approach, which could be beneficial for a large app. However, React’s component ecosystem and hooks make handling state for the chat and media preview straightforward. Vue is lightweight and could also handle this well if the team prefers. Ultimately, the choice can depend on developer familiarity. The key is to use a framework that supports component reuse and state management, which all of these do. React with Hooks or Context can manage the chat state, or Redux could be introduced if needed for more complex state sharing (e.g., between chat and explore wall).

- **Design Framework:** We will utilize **Material Design 3** guidelines for UI, likely via a library. MUI (v5+) can be configured for Material You design tokens, or Google’s MDC Web could be used for vanilla JS implementations of Material components. This ensures a modern aesthetic and consistency. It’s also responsive by design, helping the app to be usable on various screen sizes (important if, for example, someone accesses it on a tablet or phone).

- **Database and Storage:** We stick with **Google Cloud Firestore** and **Cloud Storage** as specified, which are optimized for scalability:

    - Firestore is a NoSQL document DB managed by Google – it scales automatically, has real-time listeners (which we could use for the Explore Wall to live-update new entries), and is easy to use from both backend and frontend. It will store relatively small documents (playbook metadata, agent templates, etc.), well within its capabilities.

    - Cloud Storage handles large binary files (images, videos) efficiently. By offloading media serving to Cloud Storage (potentially behind a CDN), we reduce load on our server and leverage Google’s infrastructure for fast, global delivery. This is crucial for performance when final videos (which could be tens of MBs) are viewed by many users.

    - Google Drive (AppData) for session storage is a bit unconventional but ensures user-specific data stays under the user’s control. It’s reliable and Google-managed, but if implementing this, ensure proper OAuth flows. Alternatively, an internal database could store sessions, but the spec’s approach is privacy-conscious. For scalability, reading/writing small JSON to Drive per session is fine given typical usage, but we might limit how frequently we save (e.g., at important checkpoints rather than every message) to avoid API quota issues.

- **Cloud Platform & Deployment:** **Google Cloud** is the natural choice given the integration with Google’s AI APIs and storage:

    - **Google Cloud Run** is ideal for the backend container deployment. It auto-scales the containerized app and can handle periods of no traffic by scaling down to zero (cost-efficient). It supports up to 15 minutes or more execution, which covers even lengthy video generation tasks. Additionally, it can allocate more CPU/memory per instance if needed for heavy workloads (like multiple FFmpeg processes).

    - If higher concurrency is needed and the team has DevOps resources, **Kubernetes (GKE)** is an option to orchestrate the containers with fine-grained control, but likely Cloud Run suffices and is simpler.

    - Use **Firebase Hosting** for the front-end, which integrates well with Cloud Run (via rewrites if needed) and provides an SSL domain, CDN, etc. This will make the UI very fast to load for users globally.

- **Performance Considerations:**

    - We ensure that heavy tasks (image & video generation) are mostly done on external services or asynchronously so they don’t block the event loop. In Node.js, calls to external APIs are non-blocking by default (async HTTP calls). The only blocking part might be the FFmpeg CLI. To avoid blocking Node’s single thread during video concatenation, we can spawn it as a child process. This runs in parallel to Node’s event loop. For very large videos or many concurrent ffmpeg jobs, it might be worth offloading to a worker process or limiting concurrency.

    - For **scalability**, each user session can be handled independently, so we can scale horizontally (multiple container instances) if one instance can't handle the load. Ensuring statelessness of the server (no in-memory only data that can’t be reconstructed) is important for horizontal scaling. Our use of external storage for session data helps – if a session needs to move to another instance, it could theoretically load the state. Using sticky sessions (same user sticks to one instance) is simpler though, given the interactive nature.

    - We must also consider the *cost* and rate limits of the external AI APIs. They may have QPS or concurrency limits. The architecture should handle API errors or slowdowns gracefully (e.g., exponential backoff retries or informative messages to user if a service is unavailable).

    - Another performance angle is **parallelism**: The architecture allows certain steps to run in parallel. For example, generating all storyboard images (step 2) can be done in parallel API calls since they are independent; similarly, the draft video generation for each frame (step 3) could be parallel. We should implement those with care to not overwhelm the system (perhaps limit to a certain number of parallel calls if there are many frames). This will significantly cut down waiting time for the user. The final rendering (step 5) can also be parallelized if resources allow.

    - **Caching and Reuse:** If the user regenerates a frame with the same prompt or if the “Remix” uses the same assets, we could reuse previous results to save time. This could be a future optimization; initial implementation can skip it.

    - Use of efficient data formats: When sending images or videos, prefer sending URLs or references. If we must send binary (for a quick preview), ensure we use compression. But given we have Cloud Storage, uploading there and sending a secure URL is better for performance (client streams from cloud directly).

    - **Security & Privacy:** Use HTTPS everywhere. Also, sanitize any user-provided prompt or file name before using it in commands (to avoid injection issues especially with ffmpeg command construction). Using safe libraries or the `spawn` array syntax (instead of concatenating strings) helps prevent command injection. Additionally, restrict ffmpeg input to only our working directory files.

    - **Monitoring:** Include tools or middleware to log performance metrics (response times for each step, memory usage). This helps identify bottlenecks under load. Google Cloud’s monitoring can alert if CPU is high or if instances scale up frequently, prompting us to maybe increase instance size or refine parallelism.

In summary, Node.js + React + Google Cloud services form an optimal stack: Node and React ensure real-time responsiveness and a scalable structure, while Google’s managed services (Firestore, Storage, Cloud Run, etc.) provide reliability and automatic scaling for the supporting infrastructure. This architecture, with clear separation of concerns (UI vs steps vs integrations) and attention to performance (non-blocking calls, parallel processing, horizontal scaling), will result in a fast, reliable, and scalable Video Production Agent application.

