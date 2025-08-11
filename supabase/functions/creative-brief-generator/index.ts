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
        const { userPrompt, context, projectId } = await req.json();

        if (!userPrompt) {
            throw new Error('User prompt is required');
        }

        // Get API keys from environment
        const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!geminiApiKey) {
            throw new Error('Gemini API key not configured');
        }

        // Construct the creative brief generation prompt
        const briefPrompt = `You are a professional video production creative director. Based on the user's request, create a comprehensive creative brief for video production.

User Request: "${userPrompt}"
Additional Context: ${context || 'None provided'}

Please generate a creative brief that includes:
1. PROJECT GOAL: What is the main objective?
2. TARGET AUDIENCE: Who is this video for?
3. TONE & STYLE: What mood and visual style should it have?
4. KEY SCENES: List 3-5 key scenes that tell the story (each scene should be 4 seconds)
5. VISUAL STYLE: Cinematic style, color palette, composition
6. DELIVERABLES: Final video specifications

Format your response as a structured creative brief that's both professional and actionable.`;

        // Call Gemini API
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: briefPrompt }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048
                }
            })
        });

        if (!geminiResponse.ok) {
            const errorData = await geminiResponse.text();
            throw new Error(`Gemini API error: ${errorData}`);
        }

        const geminiData = await geminiResponse.json();
        const creativeBrief = geminiData.candidates[0].content.parts[0].text;

        // Save to database if projectId provided
        if (projectId && supabaseUrl && serviceRoleKey) {
            await fetch(`${supabaseUrl}/rest/v1/video_projects`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: projectId,
                    creative_brief: creativeBrief,
                    status: 'brief_generated',
                    updated_at: new Date().toISOString()
                })
            });
        }

        return new Response(JSON.stringify({
            data: {
                creativeBrief,
                projectId,
                step: 1,
                status: 'completed'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Creative brief generation error:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'CREATIVE_BRIEF_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});