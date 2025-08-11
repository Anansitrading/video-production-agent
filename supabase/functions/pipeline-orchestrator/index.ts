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
        const { 
            userMessage, 
            projectId, 
            step = 1, 
            sessionData = {},
            action = 'start',
            frameId,
            newPrompt
        } = await req.json();

        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        let currentProjectId = projectId;
        let response = { data: {} };

        // Helper function to update progress
        const updateProgress = async (projectId: string, step: number, status: string, message: string, data?: any) => {
            if (supabaseUrl && serviceRoleKey) {
                await fetch(`${supabaseUrl}/rest/v1/video_projects?id=eq.${projectId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        status: `step_${step}_${status}`,
                        updated_at: new Date().toISOString(),
                        ...(data || {})
                    })
                });

                // Also create a progress entry for real-time tracking
                await fetch(`${supabaseUrl}/rest/v1/chat_sessions`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        project_id: projectId,
                        session_data: {
                            step,
                            status,
                            message,
                            timestamp: new Date().toISOString(),
                            data
                        }
                    })
                });
            }
        };

        // Create new project if starting
        if (!currentProjectId && action === 'start') {
            currentProjectId = crypto.randomUUID();
            
            if (supabaseUrl && serviceRoleKey) {
                await fetch(`${supabaseUrl}/rest/v1/video_projects`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: currentProjectId,
                        title: `Video Project ${new Date().toLocaleString()}`,
                        status: 'started',
                        created_at: new Date().toISOString()
                    })
                });
            }
        }

        // Handle special actions
        if (action === 'regenerate_frame' && frameId && newPrompt) {
            await updateProgress(currentProjectId, step, 'processing', 'Regenerating storyboard frame...');
            
            const frameResponse = await fetch(`${supabaseUrl}/functions/v1/frame-regenerator`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    frameId,
                    newPrompt,
                    projectId: currentProjectId
                })
            });

            if (!frameResponse.ok) {
                throw new Error('Frame regeneration failed');
            }

            const frameData = await frameResponse.json();
            await updateProgress(currentProjectId, step, 'completed', 'Storyboard frame regenerated successfully');
            
            return new Response(JSON.stringify({
                data: {
                    ...frameData.data,
                    projectId: currentProjectId,
                    message: 'Frame regenerated successfully!'
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        try {
            switch (step) {
                case 1: {
                    // Step 1: Generate Creative Brief
                    await updateProgress(currentProjectId, 1, 'processing', 'Generating creative brief...');
                    
                    const briefResponse = await fetch(`${supabaseUrl}/functions/v1/creative-brief-generator`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            userPrompt: userMessage,
                            context: sessionData.context || '',
                            projectId: currentProjectId
                        })
                    });

                    if (!briefResponse.ok) {
                        throw new Error('Creative brief generation failed');
                    }

                    const briefData = await briefResponse.json();
                    await updateProgress(currentProjectId, 1, 'completed', 'Creative brief generated successfully');
                    
                    response.data = {
                        ...briefData.data,
                        nextStep: 2,
                        message: 'Creative brief generated successfully! Proceeding to storyboard generation...'
                    };
                    break;
                }

                case 2: {
                    // Step 2: Generate Storyboard
                    await updateProgress(currentProjectId, 2, 'processing', 'Generating storyboard frames...');
                    
                    const storyboardResponse = await fetch(`${supabaseUrl}/functions/v1/storyboard-generator`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            creativeBrief: sessionData.creativeBrief,
                            scenePrompts: sessionData.scenePrompts,
                            projectId: currentProjectId
                        })
                    });

                    if (!storyboardResponse.ok) {
                        throw new Error('Storyboard generation failed');
                    }

                    const storyboardData = await storyboardResponse.json();
                    await updateProgress(currentProjectId, 2, 'completed', 'Storyboard frames generated successfully');
                    
                    response.data = {
                        ...storyboardData.data,
                        nextStep: 3,
                        message: 'Storyboard frames generated! Creating video previews...'
                    };
                    break;
                }

                case 3: {
                    // Step 3: Generate Draft Video Previews
                    await updateProgress(currentProjectId, 3, 'processing', 'Creating video previews...');
                    
                    const previewResponse = await fetch(`${supabaseUrl}/functions/v1/video-preview-generator`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            storyboardFrames: sessionData.storyboardFrames,
                            projectId: currentProjectId,
                            clipType: 'draft'
                        })
                    });

                    if (!previewResponse.ok) {
                        throw new Error('Video preview generation failed');
                    }

                    const previewData = await previewResponse.json();
                    await updateProgress(currentProjectId, 3, 'completed', 'Draft video previews ready for review');
                    
                    response.data = {
                        ...previewData.data,
                        nextStep: 4,
                        message: 'Draft video previews ready! Please review and approve to continue.'
                    };
                    break;
                }

                case 4: {
                    // Step 4: Review Loop - handled by user interaction
                    response.data = {
                        projectId: currentProjectId,
                        step: 4,
                        status: 'awaiting_review',
                        message: 'Please review the storyboard and videos. You can approve, edit prompts, or regenerate frames.',
                        nextStep: 5
                    };
                    break;
                }

                case 5: {
                    // Step 5: Generate Final High-Quality Videos
                    await updateProgress(currentProjectId, 5, 'processing', 'Generating final high-quality videos...');
                    
                    const finalResponse = await fetch(`${supabaseUrl}/functions/v1/video-preview-generator`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            storyboardFrames: sessionData.storyboardFrames,
                            projectId: currentProjectId,
                            clipType: 'final'
                        })
                    });

                    if (!finalResponse.ok) {
                        throw new Error('Final video generation failed');
                    }

                    const finalData = await finalResponse.json();
                    await updateProgress(currentProjectId, 5, 'completed', 'Final high-quality videos generated');
                    
                    response.data = {
                        ...finalData.data,
                        nextStep: 6,
                        message: 'Final high-quality videos generated! Concatenating into single video...'
                    };
                    break;
                }

                case 6: {
                    // Step 6: Video Concatenation
                    await updateProgress(currentProjectId, 6, 'processing', 'Concatenating videos with FFmpeg...');
                    
                    const concatResponse = await fetch(`${supabaseUrl}/functions/v1/video-concatenation`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            projectId: currentProjectId,
                            videoClips: sessionData.finalVideoClips || sessionData.videoClips,
                            audioTrack: sessionData.backgroundAudio
                        })
                    });

                    if (!concatResponse.ok) {
                        throw new Error('Video concatenation failed');
                    }

                    const concatData = await concatResponse.json();
                    await updateProgress(currentProjectId, 6, 'completed', 'Video concatenation completed');
                    
                    response.data = {
                        ...concatData.data,
                        nextStep: 7,
                        message: 'Video concatenation completed! Generating project playbook...'
                    };
                    break;
                }

                case 7: {
                    // Step 7: Generate Playbook
                    await updateProgress(currentProjectId, 7, 'processing', 'Generating project playbook...');
                    
                    const playbookResponse = await fetch(`${supabaseUrl}/functions/v1/playbook-generator`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            projectId: currentProjectId,
                            creativeBrief: sessionData.creativeBrief,
                            storyboardFrames: sessionData.storyboardFrames,
                            finalVideoUrl: sessionData.finalVideoUrl
                        })
                    });

                    if (!playbookResponse.ok) {
                        throw new Error('Playbook generation failed');
                    }

                    const playbookData = await playbookResponse.json();
                    await updateProgress(currentProjectId, 7, 'completed', 'Project playbook generated');
                    
                    response.data = {
                        ...playbookData.data,
                        nextStep: 8,
                        message: 'Project playbook generated! Publishing to Explore Wall...'
                    };
                    break;
                }

                case 8: {
                    // Step 8: Publish to Explore Wall
                    await updateProgress(currentProjectId, 8, 'processing', 'Publishing to Explore Wall...');
                    
                    if (supabaseUrl && serviceRoleKey) {
                        await fetch(`${supabaseUrl}/rest/v1/video_projects?id=eq.${currentProjectId}`, {
                            method: 'PATCH',
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                status: 'published',
                                updated_at: new Date().toISOString()
                            })
                        });
                    }

                    await updateProgress(currentProjectId, 8, 'completed', 'Project published successfully');
                    
                    response.data = {
                        projectId: currentProjectId,
                        step: 8,
                        status: 'completed',
                        message: 'Project completed and published to Explore Wall! 🎉',
                        isComplete: true
                    };
                    break;
                }

                default:
                    throw new Error(`Unknown step: ${step}`);
            }

        } catch (stepError) {
            console.error(`Error in step ${step}:`, stepError);
            await updateProgress(currentProjectId, step, 'error', stepError.message);
            throw stepError;
        }

        return new Response(JSON.stringify(response), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Pipeline orchestrator error:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'PIPELINE_ORCHESTRATOR_FAILED',
                message: error.message,
                step: req.body?.step || 'unknown'
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});