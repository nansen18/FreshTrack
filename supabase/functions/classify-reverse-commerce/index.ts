import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productName, expiryDate, daysUntilExpiry } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Classifying product:', { productName, expiryDate, daysUntilExpiry });

    const systemPrompt = `You are an AI assistant that categorizes food products for reverse commerce. 
Your job is to decide if a product should be:
1. "donate" - Still edible and safe for human consumption, suitable for donation to NGOs
2. "compost" - No longer suitable for consumption but can be composted or used for fertilizer

Consider:
- Products expired less than 3 days are often still safe to donate (especially packaged goods)
- Products expired more than 3 days or showing signs of decay should be composted
- Dairy and meat products have stricter safety windows
- Dry goods, canned items can be donated even past expiry
- Fresh produce decays faster

Respond with ONLY a JSON object in this exact format:
{
  "category": "donate" or "compost",
  "reasoning": "brief explanation of your decision",
  "co2_saved": estimated kg of CO2 saved (number between 0.5-5)
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `Product: ${productName}\nExpiry Date: ${expiryDate}\nDays until expiry: ${daysUntilExpiry}\n\nShould this be donated or composted?`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('Failed to classify product');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log('AI Response:', aiResponse);

    // Parse the JSON response from AI
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }

    const classification = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(classification), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in classify-reverse-commerce function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        category: 'compost', // Default fallback
        reasoning: 'Classification failed, defaulting to compost',
        co2_saved: 1.5
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});