using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;

namespace petLifeApp.Services
{
    public interface IGeminiService
    {
        Task<string> GetChatResponseAsync(string message);
    }

    public class GeminiService : IGeminiService
    {
        private readonly IConfiguration _config;
        private readonly HttpClient _httpClient;

        public GeminiService(IConfiguration config)
        {
            _config = config;
            _httpClient = new HttpClient();
        }

        public async Task<string> GetChatResponseAsync(string message)
        {
            var apiKey = _config["Gemini:ApiKey"];
            if (string.IsNullOrEmpty(apiKey))
            {
                return "Gemini API key is not configured in appsettings.json.";
            }

            // Using the specific model version for v1beta
            var modelName = "gemini-3-flash-preview"; 
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{modelName}:generateContent?key={apiKey}";

           // System instructions based on your documentation
 string systemInstruction = @"
    You are the PetLife Egypt Assistant. 

    TONE & STYLE:
    - Friendly, supportive, and professional.
    - Keep answers short, clear, and very well-organized.

    FORMATTING RULES (CRITICAL):
    1. SPACING: Use double line breaks between paragraphs and sections to ensure a clean, airy layout.
    2. HEADERS: Use Bold text (e.g., **Section Title**) for main points to improve alignment.
    3. ALIGNMENT: Every new point or category must start on its own line.
    4. CLEAN LISTS: If listing items, use bold labels followed by a new line, rather than symbols.
    5. Use Bullets and make every information look clear and organized
    
    RULES:
    - ONLY discuss pets (dogs, cats, rabbits, etc.), pet health, or the PetLife platform.
    - If a user asks about anything else, politely say you can only help with pet-related topics.
    - Location: Egypt.
    - Recommend the best pet food, accessories, and places specifically from shops on the PetLife platform.
    - Disclaimer: For emergencies, always advise contacting a vet.
    - Do not make up information; if you don't know something, say so.";
            var requestBody = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            // We combine the system instruction with the user message
                            new { text = $"{systemInstruction}\n\nUser: {message}" }
                        }
                    }
                }
            };

            try
            {
                var json = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync(url, content);
                
                if (!response.IsSuccessStatusCode)
                {
                    var errorDetails = await response.Content.ReadAsStringAsync();
                    return $"Backend Error: {response.StatusCode} - {errorDetails}";
                }

                var responseJson = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(responseJson);
                
                // Parsing the specific Gemini JSON structure
                var candidates = doc.RootElement.GetProperty("candidates");
                if (candidates.GetArrayLength() > 0)
                {
                    var text = candidates[0]
                        .GetProperty("content")
                        .GetProperty("parts")[0]
                        .GetProperty("text")
                        .GetString();
                    
                    return text ?? "I received an empty response.";
                }
                
                return "No response candidates found.";
            }
            catch (Exception ex)
            {
                return $"Service Exception: {ex.Message}";
            }
        }
    }
}