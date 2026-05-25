using Microsoft.AspNetCore.Mvc;
using petLifeApp.Services;

namespace petLifeApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatController : ControllerBase
    {
        private readonly IGeminiService _geminiService;

        public ChatController(IGeminiService geminiService)
        {
            _geminiService = geminiService;
        }

        [HttpPost("send")]
        public async Task<IActionResult> SendMessage([FromBody] ChatRequest request)
        {
            if (string.IsNullOrEmpty(request.Message))
                return BadRequest("Message cannot be empty.");

            var response = await _geminiService.GetChatResponseAsync(request.Message);
            return Ok(new { reply = response });
        }
        
    }

    public class ChatRequest
    {
        public string Message { get; set; } = string.Empty;
    }
}