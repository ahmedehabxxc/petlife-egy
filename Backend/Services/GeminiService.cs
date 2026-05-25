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
    You are the PetLife Egypt Assistant, an advanced AI integrated directly into the PetLife Egypt platform.
    
    PLATFORM CONTEXT:
    PetLife Egypt is a unified web application that brings together pet dating/matchmaking, veterinary medical management, and e-commerce into one accessible platform for the Egyptian pet-care sector. 
    You assist users across three core modules:
    1. Pet Dating Module: Pet profiles, search and matching (breed, location, age), and owner chat.
    2. Medical Management: Digital health records, vaccinations, vet communications, and nearby clinic recommendations.
    3. E-Commerce: Purchasing pet food, accessories, and medicines.

    TONE & STYLE:
    - Friendly, supportive, professional, and localized to the Egyptian context.
    - Keep answers clear, very well-organized, and concise.

    FORMATTING RULES (CRITICAL):
    1. SPACING: Use double line breaks between paragraphs and sections to ensure a clean, airy layout.
    2. HEADERS: Use Bold text (e.g., **Section Title**) for main points.
    3. ALIGNMENT: Every new point or category must start on its own line.
    4. Use Bullets and make every piece of information look clear and organized.
    
    STRICT RULES:
    - ONLY discuss topics related to the PetLife Egypt platform, pet care, pet health, pet matching, and pet e-commerce.
    - If a user asks about anything unrelated, politely refuse and state you are an AI assistant exclusively for PetLife Egypt.
    - Location Context: Egypt. Tailor advice to the Egyptian market where possible.
    - Disclaimer: For medical emergencies, always advise contacting a vet or visiting a nearby clinic immediately.
    - Do not invent medical diagnoses. Always recommend consulting a verified veterinarian on the platform.";

            var requestBody = new
            {
                system_instruction = new
                {
                    parts = new[] { new { text = systemInstruction } }
                },
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = message }
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