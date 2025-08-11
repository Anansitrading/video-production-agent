Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { creativeBrief, projectId, scenePrompts } = await req.json();

        if (!creativeBrief && !scenePrompts) {
            throw new Error('Creative brief or scene prompts are required');
        }

        // Get API keys from environment
        const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
        const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!openaiApiKey) {
            throw new Error('OpenAI API key not configured');
        }

        let scenes = scenePrompts;

        // Extract scenes from creative brief if not provided
        if (!scenes && creativeBrief) {
            const sceneExtractionPrompt = `Extract 3-5 key scenes from this creative brief and format them as detailed image generation prompts for cinematic storyboard frames.

Creative Brief:
${creativeBrief}

Return ONLY a JSON array of scene prompts, each optimized for DALL-E image generation with cinematic, 16:9 aspect ratio specifications. Each prompt should be detailed and vivid for high-quality storyboard visualization.

Format: ["detailed scene 1 prompt with cinematic style, 16:9 aspect ratio", "detailed scene 2 prompt...", ...]`;

            const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiApiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: sceneExtractionPrompt }]
                    }],
                    generationConfig: {
                        temperature: 0.3,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 1024
                    }
                })
            });

            if (geminiResponse.ok) {
                const geminiData = await geminiResponse.json();
                const responseText = geminiData.candidates[0].content.parts[0].text;
                
                try {
                    // Extract JSON array from response
                    const jsonMatch = responseText.match(/\[(.*?)\]/s);
                    if (jsonMatch) {
                        scenes = JSON.parse(`[${jsonMatch[1]}]`);
                    } else {
                        // Fallback: split by lines and clean up
                        scenes = responseText.split('\n')
                            .map(line => line.trim())
                            .filter(line => line && !line.startsWith('#'))
                            .slice(0, 5);
                    }
                } catch (parseError) {
                    console.error('Error parsing scenes:', parseError);
                    scenes = [
                        "Cinematic establishing shot with dramatic lighting, 16:9 aspect ratio, professional cinematography",
                        "Medium shot with compelling composition, cinematic depth of field, 16:9 aspect ratio",
                        "Close-up shot with emotional impact, professional lighting, 16:9 aspect ratio"
                    ];
                }
            }
        }

        if (!scenes || scenes.length === 0) {
            throw new Error('No scenes could be generated or provided');
        }

        // Generate images for each scene using DALL-E
        const storyboardFrames = [];
        const imageGenerationPromises = scenes.map(async (scenePrompt, index) => {
            try {
                const dalleResponse = await fetch('https://api.openai.com/v1/images/generations', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${openaiApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: 'dall-e-3',
                        prompt: `${scenePrompt}, professional cinematography, high quality, detailed, 16:9 aspect ratio`,
                        size: '1792x1024',
                        quality: 'hd',
                        n: 1
                    })
                });

                if (!dalleResponse.ok) {
                    const errorData = await dalleResponse.text();
                    console.error(`DALL-E error for scene ${index + 1}:`, errorData);
                    throw new Error(`DALL-E API error: ${errorData}`);
                }

                const dalleData = await dalleResponse.json();
                const imageUrl = dalleData.data[0].url;
                
                return {
                    frameNumber: index + 1,
                    sceneDescription: scenePrompt,
                    imagePrompt: scenePrompt,
                    imageUrl: imageUrl,
                    imageSeed: `dalle-${Date.now()}-${index}`,
                    duration: 4.0
                };
            } catch (error) {
                console.error(`Error generating image for scene ${index + 1}:`, error);
                return null;
            }
        });

        const generatedFrames = await Promise.all(imageGenerationPromises);
        const validFrames = generatedFrames.filter(frame => frame !== null);

        // Save frames to database if projectId provided
        if (projectId && supabaseUrl && serviceRoleKey && validFrames.length > 0) {
            const frameInserts = validFrames.map(frame => ({
                project_id: projectId,
                frame_number: frame.frameNumber,
                scene_description: frame.sceneDescription,
                image_prompt: frame.imagePrompt,
                image_url: frame.imageUrl,
                image_seed: frame.imageSeed,
                duration: frame.duration
            }));

            await fetch(`${supabaseUrl}/rest/v1/storyboard_frames`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(frameInserts)
            });

            // Update project status
            await fetch(`${supabaseUrl}/rest/v1/video_projects?id=eq.${projectId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: 'storyboard_generated',
                    scene_count: validFrames.length,
                    updated_at: new Date().toISOString()
                })
            });
        }

        return new Response(JSON.stringify({
            data: {
                storyboardFrames: validFrames,
                projectId,
                step: 2,
                status: 'completed',
                sceneCount: validFrames.length
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Storyboard generation error:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'STORYBOARD_GENERATION_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});