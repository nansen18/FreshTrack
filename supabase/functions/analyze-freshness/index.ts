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
    const { imageBase64, temperature = 22, storageType = 'room_temp' } = await req.json();
    
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
            content: `You are a food freshness detection expert with predictive shelf-life capabilities. Analyze the provided image of fruits or vegetables and determine:

1. Freshness level: "fresh", "aging", or "spoiled"
2. Freshness score: A percentage from 0-100 (100 = perfectly fresh, 0 = completely spoiled)
3. Product name: What fruit/vegetable is shown
4. Description: A brief, helpful description (1-2 sentences) about the freshness state
5. Shelf life days: Estimated days until spoilage based on current condition, storage temperature (${temperature}°C), and storage type (${storageType})
6. Storage recommendation: Best practice storage advice for maximum shelf life

Consider factors like:
- Color vibrancy and uniformity
- Surface texture and smoothness
- Visible spots, bruises, or mold
- Firmness appearance
- Overall visual appeal
- Current storage temperature: ${temperature}°C
- Storage type: ${storageType}

Temperature impact on shelf life:
- Refrigerated (2-8°C): Extends shelf life significantly
- Room temp (18-25°C): Normal decay rate
- Warmer (>25°C): Accelerates spoilage
- Freezer (<0°C): Preserves for extended periods

Storage type considerations:
- "refrigerated": Items stored in fridge, slower decay
- "room_temp": Counter/table storage, moderate decay
- "pantry": Cool, dark storage, good for certain items
- "freezer": Long-term preservation

Respond ONLY with a valid JSON object in this exact format:
{
  "freshness_level": "fresh" | "aging" | "spoiled",
  "freshness_score": number (0-100),
  "product_name": "string",
  "description": "string",
  "shelf_life_days": number (realistic estimate 0-30 days),
  "storage_recommendation": "string (brief storage tip)"
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

    // Validate the response structure (check for undefined/null, not falsy values)
    if (!result.freshness_level || result.freshness_score === undefined || result.freshness_score === null || !result.description || result.shelf_life_days === undefined || !result.storage_recommendation) {
      console.error('Incomplete AI response - missing required fields:', result);
      throw new Error('Incomplete AI response');
    }

    // Ensure freshness_score is within valid range
    if (result.freshness_score < 0 || result.freshness_score > 100) {
      console.error('Invalid freshness_score:', result.freshness_score);
      result.freshness_score = Math.max(0, Math.min(100, result.freshness_score));
    }

    // Ensure shelf_life_days is within reasonable range
    if (result.shelf_life_days < 0 || result.shelf_life_days > 30) {
      console.error('Invalid shelf_life_days:', result.shelf_life_days);
      result.shelf_life_days = Math.max(0, Math.min(30, result.shelf_life_days));
    }

    console.log('Freshness analysis complete:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in analyze-freshness function:', error);
    
    // Return user-friendly error message
    const errorMessage = error.message?.includes('AI API error') 
      ? 'AI service temporarily unavailable. Please try again.'
      : error.message?.includes('Invalid AI response') 
      ? "Couldn't detect freshness. Try another image."
      : error.message || 'An unexpected error occurred';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
