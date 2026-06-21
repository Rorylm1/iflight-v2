import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface CarbonEquivalent {
  value: string;
  label: string;
  description: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * POST /api/carbon-equivalents
 *
 * Generates AI-powered, varied carbon equivalents for a given CO2 amount.
 * Each request returns different interesting comparisons to make the data
 * more engaging and memorable.
 *
 * Body: { co2Kg: number }
 * Returns: { equivalents: CarbonEquivalent[], treesNeeded: number, offsetCost: number }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { co2Kg } = body;

    if (typeof co2Kg !== "number" || co2Kg < 0) {
      return NextResponse.json(
        { error: "Invalid CO2 amount" },
        { status: 400 }
      );
    }

    // Calculate standard metrics that are always shown
    const treesNeeded = Math.ceil(co2Kg / 22); // ~22kg CO2 absorbed per tree per year
    const offsetCost = Math.round(co2Kg * 0.015 * 100) / 100; // ~£0.015 per kg via Gold Standard

    // If CO2 is 0, return empty equivalents
    if (co2Kg === 0) {
      return NextResponse.json({
        equivalents: [],
        treesNeeded: 0,
        offsetCost: 0,
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Fallback to static equivalents if no API key
      return NextResponse.json({
        equivalents: getStaticEquivalents(co2Kg),
        treesNeeded,
        offsetCost,
      });
    }

    try {
      const equivalents = await generateAIEquivalents(co2Kg, apiKey);
      return NextResponse.json({
        equivalents,
        treesNeeded,
        offsetCost,
      });
    } catch (aiError) {
      console.warn("AI generation failed, using static fallback:", aiError);
      return NextResponse.json({
        equivalents: getStaticEquivalents(co2Kg),
        treesNeeded,
        offsetCost,
      });
    }
  } catch (error) {
    console.error("Error in carbon equivalents API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Generate varied carbon equivalents using OpenAI
 */
async function generateAIEquivalents(
  co2Kg: number,
  apiKey: string
): Promise<CarbonEquivalent[]> {
  const prompt = `Generate exactly 4 creative, factual carbon footprint equivalents for ${co2Kg.toLocaleString()} kg of CO2 emissions.

Requirements:
- Mix categories: everyday activities, transport, food/drink, digital life, household
- Be factual and use real conversion factors
- Make comparisons surprising, memorable, and relatable
- Vary the comparisons each time (don't always use the same examples)
- Use whole numbers or simple decimals for the values

Example categories to draw from (pick different ones each time):
- Kettles boiled (0.015 kg CO2 per boil)
- Netflix streaming hours (0.036 kg CO2 per hour)
- Smartphone charges (0.005 kg CO2 per charge)
- Google searches (0.0003 kg CO2 per search)
- Cups of coffee (0.21 kg CO2 per cup)
- Cheeseburgers (3.5 kg CO2 per burger)
- Car miles driven (0.21 kg CO2 per mile)
- Train journeys London to Paris (4.3 kg CO2 per trip)
- Hot showers (0.42 kg CO2 per 8-min shower)
- Loads of laundry (0.6 kg CO2 per load)
- Days of home electricity (10 kg CO2 per day average)
- Pints of beer (0.5 kg CO2 per pint)
- Avocados (0.9 kg CO2 per avocado)
- Pairs of jeans (33 kg CO2 per pair)
- Emails sent (0.004 kg CO2 per email with attachment)

Return ONLY a valid JSON array with exactly 4 objects, no markdown, no explanation, no emoji:
[
  {"value": "1,234", "label": "cups of coffee", "description": "Based on ~0.21kg CO2 per cup"},
  ...
]`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a carbon footprint expert. Generate engaging, factual carbon emission equivalents. Always return valid JSON only, no markdown formatting.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.9, // Higher temperature for more variety
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data: OpenAIResponse = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("Empty response from OpenAI");
  }

  // Parse the JSON response, handling potential markdown code blocks
  let cleanedContent = content.trim();
  if (cleanedContent.startsWith("```json")) {
    cleanedContent = cleanedContent.slice(7);
  } else if (cleanedContent.startsWith("```")) {
    cleanedContent = cleanedContent.slice(3);
  }
  if (cleanedContent.endsWith("```")) {
    cleanedContent = cleanedContent.slice(0, -3);
  }
  cleanedContent = cleanedContent.trim();

  const equivalents: CarbonEquivalent[] = JSON.parse(cleanedContent);

  // Validate structure
  if (!Array.isArray(equivalents) || equivalents.length !== 4) {
    throw new Error("Invalid response structure");
  }

  return equivalents;
}

/**
 * Fallback static equivalents when AI is unavailable
 */
function getStaticEquivalents(co2Kg: number): CarbonEquivalent[] {
  return [
    {
      value: Math.round(co2Kg / 0.21).toLocaleString(),
      label: "miles driven",
      description: "In an average petrol car",
    },
    {
      value: Math.round(co2Kg / 0.21).toLocaleString(),
      label: "cups of coffee",
      description: "Including production & transport",
    },
    {
      value: Math.round(co2Kg / 0.036).toLocaleString(),
      label: "hours of streaming",
      description: "Netflix, YouTube, etc.",
    },
    {
      value: Math.round(co2Kg / 3.5).toLocaleString(),
      label: "cheeseburgers",
      description: "Including beef production",
    },
  ];
}
