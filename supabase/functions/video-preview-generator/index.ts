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
        const { storyboardFrames, projectId, clipType = 'draft' } = await req.json();

        if (!storyboardFrames || storyboardFrames.length === 0) {
            throw new Error('Storyboard frames are required');
        }

        // Get API keys from environment
        const falApiKey = Deno.env.get('FAL_AI_API_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!falApiKey) {
            throw new Error('Fal.ai API key not configured');
        }

        console.log(`Generating ${clipType} video clips for ${storyboardFrames.length} frames`);

        // Generate video clips for each frame using Veo 3 via Fal.ai
        const videoClips = [];
        
        for (const frame of storyboardFrames) {
            try {
                console.log(`Processing frame ${frame.frameNumber}: ${frame.imageUrl}`);

                // Configure video generation parameters based on clip type
                const duration = clipType === 'draft' ? 2 : 4;
                const quality = clipType === 'draft' ? 'low' : 'high';

                // Call Fal.ai Veo 3 API
                const falResponse = await fetch('https://fal.run/fal-ai/veo-3/preview', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Key ${falApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        image_url: frame.imageUrl,
                        prompt: `${frame.sceneDescription}, cinematic motion, smooth camera movement, professional cinematography`,
                        duration: duration,
                        aspect_ratio: '16:9',
                        loop: clipType === 'draft',
                        quality: quality
                    })
                });

                if (!falResponse.ok) {
                    const errorData = await falResponse.text();
                    console.error(`Fal.ai API error for frame ${frame.frameNumber}:`, errorData);
                    
                    // Continue with next frame instead of failing completely
                    continue;
                }

                const falData = await falResponse.json();
                
                // Poll for completion if needed
                let videoUrl = falData.video?.url || falData.output?.url;
                let requestId = falData.request_id;

                if (requestId && !videoUrl) {
                    // Poll for completion
                    console.log(`Polling for completion of frame ${frame.frameNumber}`);
                    let attempts = 0;
                    const maxAttempts = 30; // 5 minutes max
                    
                    while (attempts < maxAttempts) {
                        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
                        
                        const statusResponse = await fetch(`https://fal.run/fal-ai/veo-3/requests/${requestId}`, {
                            headers: {
                                'Authorization': `Key ${falApiKey}`
                            }
                        });
                        
                        if (statusResponse.ok) {
                            const statusData = await statusResponse.json();
                            if (statusData.status === 'completed') {
                                videoUrl = statusData.video?.url || statusData.output?.url;
                                break;
                            } else if (statusData.status === 'failed') {
                                console.error(`Video generation failed for frame ${frame.frameNumber}`);
                                break;
                            }
                        }
                        attempts++;
                    }
                }

                if (videoUrl) {
                    const clipData = {
                        frameId: frame.id || `frame-${frame.frameNumber}`,
                        frameNumber: frame.frameNumber,
                        clipType: clipType,
                        videoUrl: videoUrl,
                        duration: duration,
                        generationSeed: `veo-${Date.now()}-${frame.frameNumber}`,
                        status: 'completed'
                    };
                    
                    videoClips.push(clipData);
                    console.log(`Successfully generated ${clipType} clip for frame ${frame.frameNumber}`);
                } else {
                    console.error(`No video URL received for frame ${frame.frameNumber}`);
                }

            } catch (frameError) {
                console.error(`Error processing frame ${frame.frameNumber}:`, frameError);
                continue;
            }
        }

        // Save video clips to database if projectId provided
        if (projectId && supabaseUrl && serviceRoleKey && videoClips.length > 0) {
            // First, get frame IDs from database
            const framesResponse = await fetch(`${supabaseUrl}/rest/v1/storyboard_frames?project_id=eq.${projectId}`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            if (framesResponse.ok) {
                const frames = await framesResponse.json();
                const frameIdMap = new Map();
                frames.forEach(frame => frameIdMap.set(frame.frame_number, frame.id));

                // Create video clip records
                const clipInserts = videoClips.map(clip => ({
                    frame_id: frameIdMap.get(clip.frameNumber) || clip.frameId,
                    clip_type: clip.clipType,
                    video_url: clip.videoUrl,
                    duration: clip.duration,
                    generation_seed: clip.generationSeed,
                    status: clip.status
                }));

                await fetch(`${supabaseUrl}/rest/v1/video_clips`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(clipInserts)
                });
            }

            // Update project status
            const newStatus = clipType === 'draft' ? 'draft_clips_generated' : 'final_clips_generated';
            await fetch(`${supabaseUrl}/rest/v1/video_projects?id=eq.${projectId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
            });
        }

        return new Response(JSON.stringify({
            data: {
                videoClips,
                projectId,
                step: clipType === 'draft' ? 3 : 5,
                status: 'completed',
                clipsGenerated: videoClips.length,
                clipType
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Video preview generation error:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'VIDEO_PREVIEW_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});