const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const generateProgram = async (clientData, knowledgeContext = '') => {
  const {
    clientName,
    clientAge,
    clientGender,
    fitnessLevel,
    goals,
    injuries,
    equipment,
    daysPerWeek,
    sessionDuration,
  } = clientData;

  const knowledgeBlock = knowledgeContext.trim()
    ? `\n\nIMPORTANT — KNOWLEDGE BASE REFERENCE:\nYou MUST base your exercise selection, programming methodology, and rationale EXCLUSIVELY on the following reference material provided by the trainer. Do NOT use general knowledge — only use the principles, exercises, and approaches described in these sources:\n\n--- START KNOWLEDGE BASE ---${knowledgeContext}\n--- END KNOWLEDGE BASE ---\n\nIf the knowledge base does not cover a specific area, state that clearly in the rationale.`
    : '';

  const prompt = `You are an expert certified personal trainer and exercise physiologist. Generate a complete, detailed training program based on the following client profile:${knowledgeBlock}

CLIENT PROFILE:
- Name: ${clientName}
- Age: ${clientAge}
- Gender: ${clientGender}
- Fitness Level: ${fitnessLevel}
- Goals: ${goals.join(', ')}
- Injuries/Limitations: ${injuries || 'None reported'}
- Available Equipment: ${equipment || 'Full gym access'}
- Training Days Per Week: ${daysPerWeek}
- Session Duration: ${sessionDuration || 60} minutes

REQUIREMENTS:
1. CRITICAL: You MUST create exactly a ${daysPerWeek}-day training program. The "days" array in your JSON MUST contain exactly ${daysPerWeek} objects. Adapt the knowledge base principles to fit this exact frequency.
2. Each day MUST include: warmup exercises, mobility drills, strength training exercises
3. For EVERY exercise, provide the exact muscles trained with both common names AND anatomical names (Latin), and classify each as primary, secondary, or stabilizer
4. Adjust volume, intensity, and exercise selection based on the "${fitnessLevel}" fitness level
5. Include sets, reps, rest periods, and tempo for each exercise
6. Provide a detailed rationale explaining WHY this specific training approach was chosen over alternatives

RESPOND IN THIS EXACT JSON FORMAT (no markdown, no code blocks, just raw JSON):
{
  "programSplit": "Name of the split (e.g., Push/Pull/Legs, Upper/Lower, Full Body)",
  "days": [
    {
      "dayNumber": 1,
      "dayName": "Day name (e.g., Push Day, Upper Body A)",
      "focus": "Primary focus areas",
      "warmup": [
        {
          "name": "Exercise name",
          "sets": 2,
          "reps": "10-15",
          "restSeconds": 30,
          "tempo": "controlled",
          "musclesTrained": [
            {
              "commonName": "Common muscle name",
              "anatomicalName": "Latin anatomical name",
              "role": "primary"
            }
          ],
          "notes": "Form cues or modifications",
          "category": "warmup"
        }
      ],
      "mobility": [
        {
          "name": "Exercise name",
          "sets": 2,
          "reps": "30 seconds each side",
          "restSeconds": 15,
          "tempo": "slow and controlled",
          "musclesTrained": [
            {
              "commonName": "Common muscle name",
              "anatomicalName": "Latin anatomical name",
              "role": "primary"
            }
          ],
          "notes": "Form cues",
          "category": "mobility"
        }
      ],
      "strength": [
        {
          "name": "Exercise name",
          "sets": 3,
          "reps": "8-12",
          "restSeconds": 90,
          "tempo": "2-0-2-1",
          "musclesTrained": [
            {
              "commonName": "Common muscle name",
              "anatomicalName": "Latin anatomical name",
              "role": "primary"
            },
            {
              "commonName": "Common muscle name",
              "anatomicalName": "Latin anatomical name",
              "role": "secondary"
            }
          ],
          "notes": "Form cues, intensity guidelines",
          "category": "compound"
        }
      ],
      "cooldown": [
        {
          "name": "Static stretch or breathing exercise",
          "sets": 1,
          "reps": "30-60 seconds",
          "restSeconds": 0,
          "tempo": "hold",
          "musclesTrained": [
            {
              "commonName": "Common muscle name",
              "anatomicalName": "Latin anatomical name",
              "role": "primary"
            }
          ],
          "notes": "Breathing cues",
          "category": "cooldown"
        }
      ]
    }
    // ... YOU MUST CONTINUE GENERATING DAY OBJECTS UNTIL YOU HAVE EXACTLY ${daysPerWeek} DAYS IN THIS ARRAY! DO NOT STOP EARLY!
  ],
  "rationale": "A comprehensive 3-5 paragraph explanation of: (1) Why this specific training split was chosen for this client's level and goals, (2) Why the exercise selection is optimal, (3) Why the volume and intensity are set at these levels, (4) What alternative approaches were considered and why they were not chosen, (5) How this program should be progressed over time"
}

Ensure the program is evidence-based, practical, and appropriately scaled for a ${fitnessLevel} individual. You MUST generate EXACTLY ${daysPerWeek} day objects in the "days" array. Do not stop at 3 days if more are requested. Include at least 3-4 warmup exercises, 2-3 mobility drills, 4-6 strength exercises, and 2-3 cooldown stretches per day.`;

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: knowledgeContext.trim()
          ? 'You are an expert personal trainer and exercise physiologist. You MUST base your programming decisions EXCLUSIVELY on the reference material provided in the knowledge base. Do NOT use general knowledge outside those sources. You respond ONLY with valid JSON. No markdown, no code blocks. Ensure all anatomical names are accurate Latin terminology.'
          : 'You are an expert personal trainer and exercise physiologist. You respond ONLY with valid JSON. No markdown, no code blocks, no explanations outside the JSON structure. Ensure all anatomical names are accurate Latin terminology.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    max_tokens: 4000,
    response_format: { type: 'json_object' }
  });

  const responseText = completion.choices[0]?.message?.content;
  
  if (!responseText) {
    throw new Error('No response from AI model');
  }

  try {
    const programData = JSON.parse(responseText);
    return programData;
  } catch (parseError) {
    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Failed to parse AI response as JSON');
  }
};

const tweakProgram = async (currentProgram, tweakInstructions) => {
  const prompt = `You are an expert personal trainer. Here is a current training program in JSON format:

${JSON.stringify(currentProgram, null, 2)}

The trainer wants to make the following modifications:
"${tweakInstructions}"

Apply the requested changes while maintaining the same JSON structure. Keep all muscle anatomical names accurate. Update the rationale to reflect any changes made.

RESPOND ONLY WITH THE COMPLETE UPDATED JSON PROGRAM (same structure as input, no markdown, no code blocks):`;

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are an expert personal trainer. Respond ONLY with valid JSON. No markdown, no code blocks. Maintain all anatomical naming accuracy.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.5,
    max_tokens: 4000,
    response_format: { type: 'json_object' }
  });

  const responseText = completion.choices[0]?.message?.content;
  
  if (!responseText) {
    throw new Error('No response from AI model');
  }

  try {
    return JSON.parse(responseText);
  } catch {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Failed to parse AI tweak response');
  }
};

module.exports = { generateProgram, tweakProgram };
