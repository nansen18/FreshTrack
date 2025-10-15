import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Image data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Analyzing freshness with Lovable AI...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a food freshness detection expert. Analyze the provided image of fruits or vegetables and determine:
1. Freshness level: "fresh", "aging", or "spoiled"
2. Freshness score: A percentage from 0-100 (100 = perfectly fresh, 0 = completely spoiled)
3. Product name: What fruit/vegetable is shown
4. Description: A brief, helpful description (1-2 sentences) about the freshness state

Consider factors like:
- Color vibrancy and uniformity
- Surface texture and smoothness
- Visible spots, bruises, or mold
- Firmness appearance
- Overall visual appeal

Respond ONLY with a valid JSON object in this exact format:
{
  "freshness_level": "fresh" | "aging" | "spoiled",
  "freshness_score": number (0-100),
  "product_name": "string",
  "description": "string"
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze the freshness of this produce.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
        temperature: 0.3
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received:', data);
    
    const aiResponse = data.choices?.[0]?.message?.content;
    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response from AI
    let result;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = JSON.parse(aiResponse);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      throw new Error('Invalid AI response format');
    }

    // Validate the response structure
    if (!result.freshness_level || !result.freshness_score || !result.description) {
      throw new Error('Incomplete AI response');
    }

    console.log('Freshness analysis complete:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in analyze-freshness function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
