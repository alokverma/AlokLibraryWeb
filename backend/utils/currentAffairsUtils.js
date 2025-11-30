import OpenAI from 'openai';
import { getCurrentAffairsFromDB, saveCurrentAffairsToDB, getTodayDate } from './currentAffairsDbUtils.js';

/**
 * Fetch current affairs using OpenAI
 * Generates 20 bullet points covering all 10 categories
 * Uses database storage to cache daily data (1 API call per day)
 */

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generate current affairs using OpenAI
 */
async function generateCurrentAffairsWithAI() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not set');
      return null;
    }

    const systemPrompt = `You are a current affairs expert for India. Generate exactly 20 bullet points of current affairs in HINDI language covering all these 10 categories:
1. National News (राष्ट्रीय समाचार) - Important national events, government decisions, political developments
2. International News (अंतर्राष्ट्रीय समाचार) - Major global events affecting India or the world
3. Economy & Finance (अर्थव्यवस्था और वित्त) - RBI decisions, inflation, GDP, banks, markets, economic policies
4. Government Schemes / Policies (सरकारी योजनाएं / नीतियां) - New schemes, policy updates, launches, approvals
5. Science & Technology (विज्ञान और प्रौद्योगिकी) - Space missions (ISRO), DRDO, tech launches, discoveries, innovations
6. Environment & Climate (पर्यावरण और जलवायु) - Climate reports, pollution, environmental policies, wildlife conservation
7. Sports (खेल) - Match results, records, medals, tournament news, achievements
8. Awards & Appointments (पुरस्कार और नियुक्तियां) - New CEO appointments, Governor appointments, award winners, honors
9. Important Days & Themes (महत्वपूर्ण दिवस और विषय) - National/international days, themes, commemorations
10. Miscellaneous (विविध) - Unique, interesting, or exam-relevant news

IMPORTANT: All content must be in HINDI language (Devanagari script).
- Category names should be in Hindi
- All titles and descriptions must be in Hindi
- Use proper Hindi grammar and vocabulary
- Keep it simple and exam-relevant

Distribute the 20 points across these categories (approximately 2 points per category).
Each point should be:
- One-line summary in Hindi (max 100 words)
- Current and relevant (as of today)
- India-focused or India-relevant
- Factual and accurate
- Exam-relevant for competitive exams
- MUST include a valid "link" field with a real news article URL from reputable sources

Format your response as a JSON object with this exact structure:
{
  "categories": [
    {
      "id": "national",
      "name": "राष्ट्रीय समाचार",
      "items": [
        {
          "title": "Brief headline in Hindi",
          "description": "One-line description in Hindi",
          "link": "https://example.com/article-url",
          "source": "Source Name",
          "date": "YYYY-MM-DD"
        }
      ]
    },
    ... (repeat for all 10 categories)
  ]
}

IMPORTANT: For each news item, you MUST provide a valid "link" field with a real news article URL from reputable Indian news sources like:
- PIB (Press Information Bureau): https://www.pib.gov.in/
- The Hindu: https://www.thehindu.com/
- Times of India: https://timesofindia.indiatimes.com/
- Hindustan Times: https://www.hindustantimes.com/
- Indian Express: https://indianexpress.com/
- BBC Hindi: https://www.bbc.com/hindi
- DD News: https://www.ddnews.gov.in/
- Or other credible Indian news sources

If you cannot find a specific article URL, use a relevant category page URL from these sources. The link should be a valid HTTP/HTTPS URL.

Return ONLY valid JSON, no additional text. All text content must be in Hindi (Devanagari script).`;

    const userPrompt = `Generate today's (${new Date().toLocaleDateString('en-IN', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}) current affairs for India with 20 bullet points in HINDI language distributed across all 10 categories. 

CRITICAL REQUIREMENTS:
1. All content must be in Hindi (Devanagari script)
2. EVERY news item MUST include a "link" field with a valid URL from reputable Indian news sources
3. Use real article URLs from sources like:
   - PIB: https://www.pib.gov.in/
   - The Hindu: https://www.thehindu.com/
   - Times of India: https://timesofindia.indiatimes.com/
   - Hindustan Times: https://www.hindustantimes.com/
   - Indian Express: https://indianexpress.com/
   - BBC Hindi: https://www.bbc.com/hindi
   - DD News: https://www.ddnews.gov.in/
   - News18 Hindi: https://hindi.news18.com/
   - Aaj Tak: https://www.aajtak.in/
   - NDTV Hindi: https://hindi.ndtv.com/

If you cannot find a specific article URL, use the main category page URL from these sources. The link field is MANDATORY for every item.`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' }
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    // Parse JSON response
    const parsedResponse = JSON.parse(responseText);
    
    // Ensure all 10 categories are present (fallback to Hindi names if not in response)
    const categoryNames = {
      national: 'राष्ट्रीय समाचार',
      international: 'अंतर्राष्ट्रीय समाचार',
      economy: 'अर्थव्यवस्था और वित्त',
      government: 'सरकारी योजनाएं / नीतियां',
      science: 'विज्ञान और प्रौद्योगिकी',
      environment: 'पर्यावरण और जलवायु',
      sports: 'खेल',
      awards: 'पुरस्कार और नियुक्तियां',
      importantDays: 'महत्वपूर्ण दिवस और विषय',
      miscellaneous: 'विविध'
    };

    // Build complete structure and ensure links are present
    const allCategories = Object.keys(categoryNames).map(key => {
      const categoryData = parsedResponse.categories?.find(cat => cat.id === key);
      const items = (categoryData?.items || []).map(item => {
        // Ensure link is present, if not add a fallback URL
        if (!item.link || item.link.trim() === '') {
          // Add fallback URLs based on category
          const fallbackUrls = {
            national: 'https://www.pib.gov.in/indexd.aspx?reg=3&lang=2',
            international: 'https://www.thehindu.com/news/international/',
            economy: 'https://www.thehindu.com/business/',
            government: 'https://www.pib.gov.in/indexd.aspx?reg=3&lang=2',
            science: 'https://www.pib.gov.in/indexd.aspx?reg=3&lang=2',
            environment: 'https://www.thehindu.com/sci-tech/energy-and-environment/',
            sports: 'https://www.thehindu.com/sport/',
            awards: 'https://www.pib.gov.in/indexd.aspx?reg=3&lang=2',
            importantDays: 'https://www.pib.gov.in/indexd.aspx?reg=3&lang=2',
            miscellaneous: 'https://www.thehindu.com/news/'
          };
          item.link = fallbackUrls[key] || 'https://www.pib.gov.in/';
        }
        return item;
      });
      return {
        id: key,
        name: categoryNames[key],
        items: items
      };
    });

    return {
      lastUpdated: new Date().toISOString(),
      categories: allCategories
    };
  } catch (error) {
    console.error('Error generating current affairs with AI:', error.message);
    return null;
  }
}

/**
 * Get current affairs data
 * Checks database first - only calls OpenAI if no data exists for today
 */
export async function getCurrentAffairs() {
  const today = getTodayDate();
  
  // Check database first - if data exists for today, return it
  console.log(`Checking database for current affairs on ${today}...`);
  const dbData = await getCurrentAffairsFromDB(today);
  
  if (dbData) {
    console.log('✅ Returning current affairs from database (no OpenAI API call needed)');
    // Ensure all items have links (add fallback if missing)
    const fallbackUrls = {
      national: 'https://www.pib.gov.in/indexd.aspx?reg=3&lang=2',
      international: 'https://www.thehindu.com/news/international/',
      economy: 'https://www.thehindu.com/business/',
      government: 'https://www.pib.gov.in/indexd.aspx?reg=3&lang=2',
      science: 'https://www.pib.gov.in/indexd.aspx?reg=3&lang=2',
      environment: 'https://www.thehindu.com/sci-tech/energy-and-environment/',
      sports: 'https://www.thehindu.com/sport/',
      awards: 'https://www.pib.gov.in/indexd.aspx?reg=3&lang=2',
      importantDays: 'https://www.pib.gov.in/indexd.aspx?reg=3&lang=2',
      miscellaneous: 'https://www.thehindu.com/news/'
    };
    
    // Add links to items that don't have them
    if (dbData.categories) {
      dbData.categories = dbData.categories.map(category => ({
        ...category,
        items: category.items.map(item => {
          if (!item.link || item.link.trim() === '') {
            item.link = fallbackUrls[category.id] || 'https://www.pib.gov.in/';
          }
          return item;
        })
      }));
    }
    
    return dbData;
  }

  // No data for today - generate new data with OpenAI
  console.log(`No data found for ${today}. Generating new current affairs with OpenAI...`);
  const currentAffairs = await generateCurrentAffairsWithAI();

  if (currentAffairs) {
    // Save to database for future requests
    await saveCurrentAffairsToDB(today, currentAffairs);
    console.log('✅ Current affairs generated and saved to database');
    return currentAffairs;
  }

  // Fallback: return empty structure if AI generation fails
  const categoryNames = {
    national: 'राष्ट्रीय समाचार',
    international: 'अंतर्राष्ट्रीय समाचार',
    economy: 'अर्थव्यवस्था और वित्त',
    government: 'सरकारी योजनाएं / नीतियां',
    science: 'विज्ञान और प्रौद्योगिकी',
    environment: 'पर्यावरण और जलवायु',
    sports: 'खेल',
    awards: 'पुरस्कार और नियुक्तियां',
    importantDays: 'महत्वपूर्ण दिवस और विषय',
    miscellaneous: 'विविध'
  };

  return {
    lastUpdated: new Date().toISOString(),
    categories: Object.keys(categoryNames).map(key => ({
      id: key,
      name: categoryNames[key],
      items: []
    }))
  };
}
