using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using petLifeApp.Models;
using Supabase;
using System.Linq;
using System.IdentityModel.Tokens.Jwt;

namespace petLifeApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationsController : ControllerBase
    {
        private readonly Supabase.Client _supabase;
        private readonly IConfiguration _config;

        public NotificationsController(Supabase.Client supabase, IConfiguration config)
        {
            _supabase = supabase;
            _config = config;
        }

        private Supabase.Client GetAdminClient()
        {
            var supabaseUrl = _config["Supabase:Url"];
            var serviceRoleKey = _config["Supabase:ServiceRoleKey"];

            if (!string.IsNullOrWhiteSpace(supabaseUrl) && !string.IsNullOrWhiteSpace(serviceRoleKey))
            {
                return new Supabase.Client(supabaseUrl, serviceRoleKey);
            }

            return _supabase;
        }

        private async Task<long> ResolveUserIdAsync(long? userId)
        {
            if (userId.HasValue && userId.Value > 0)
            {
                return userId.Value;
            }

            var authHeader = Request.Headers.Authorization.FirstOrDefault();
            if (string.IsNullOrWhiteSpace(authHeader) || !authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                return 0;
            }

            var token = authHeader.Substring("Bearer ".Length).Trim();
            try
            {
                var handler = new JwtSecurityTokenHandler();
                var jwt = handler.ReadJwtToken(token);
                var sub = jwt.Claims.FirstOrDefault(c => c.Type == "sub")?.Value;
                if (!Guid.TryParse(sub, out var authId))
                {
                    return 0;
                }

                var adminClient = GetAdminClient();
                var user = await adminClient.From<User>().Where(x => x.AuthId == authId).Single();
                return user?.UserId ?? 0;
            }
            catch
            {
                return 0;
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetForUser([FromQuery] long? userId)
        {
            var resolvedUserId = await ResolveUserIdAsync(userId);
            if (resolvedUserId <= 0)
                return Ok(new List<NotificationDto>());

            try
            {
                var adminClient = GetAdminClient();
                var result = await adminClient
                    .From<Notification>()
                    .Where(x => x.UserId == resolvedUserId)
                    .Get();

                var payload = result.Models
                    .Where(n => n.Type != "message" || !n.SenderId.HasValue || !n.UserId.HasValue || n.SenderId.Value != n.UserId.Value)
                    .OrderByDescending(n => n.CreatedAt)
                    .Select(MapNotification)
                    .ToList();

                return Ok(payload);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("conversation/{conversationId:guid}")]
        public async Task<IActionResult> GetConversation(Guid conversationId, [FromQuery] long? userId)
        {
            var resolvedUserId = await ResolveUserIdAsync(userId);
            if (resolvedUserId <= 0)
                return Ok(new List<ChatMessageDto>());

            try
            {
                var adminClient = GetAdminClient();
                var result = await adminClient
                    .From<Notification>()
                    .Where(x => x.ConversationId == conversationId)
                    .Get();

                var merged = result.Models
                    .Where(n => n.UserId == resolvedUserId || n.SenderId == resolvedUserId)
                    .Where(n =>
                        string.Equals(n.Type, "message", StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(n.Title, "New message", StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(n.Title, "Message sent", StringComparison.OrdinalIgnoreCase))
                    .OrderBy(n => n.CreatedAt)
                    .ToList();

                var payload = new List<ChatMessageDto>();
                foreach (var n in merged)
                {
                    var senderName = "User";
                    if (n.SenderId.HasValue)
                    {
                        var sender = await adminClient
                            .From<User>()
                            .Where(x => x.UserId == n.SenderId.Value)
                            .Single();
                        senderName = sender?.UserName ?? senderName;
                    }

                    payload.Add(new ChatMessageDto(
                        n.Id,
                        n.SenderId?.ToString() ?? string.Empty,
                        senderName,
                        n.Message ?? string.Empty,
                        n.CreatedAt?.ToString("o") ?? DateTime.UtcNow.ToString("o")
                    ));
                }

                return Ok(payload);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("message")]
        public async Task<IActionResult> SendMessage([FromBody] SendMessageRequest request)
        {
            if (request.SenderUserId <= 0 || request.ReceiverUserId <= 0)
                return BadRequest(new { message = "SenderUserId and ReceiverUserId are required." });

            try
            {
                var adminClient = GetAdminClient();
                var conversationId = request.ConversationId ?? request.RelatedId ?? Guid.NewGuid();
                var now = DateTime.UtcNow;

                var recipient = new NotificationInsert
                {
                    Id = Guid.NewGuid(),
                    UserId = request.ReceiverUserId,
                    SenderId = request.SenderUserId,
                    Title = "New message",
                    Message = request.Content,
                    IsRead = false,
                    ActionUrl = $"/matching?conversationId={conversationId}",
                    Type = "message",
                    ConversationId = conversationId,
                    RelatedId = request.RelatedId,
                    CreatedAt = now
                };

                var senderCopy = new NotificationInsert
                {
                    Id = Guid.NewGuid(),
                    UserId = request.SenderUserId,
                    SenderId = request.SenderUserId,
                    Title = "Message sent",
                    Message = request.Content,
                    IsRead = true,
                    ActionUrl = $"/matching?conversationId={conversationId}",
                    Type = "message",
                    ConversationId = conversationId,
                    RelatedId = request.RelatedId,
                    CreatedAt = now
                };

                await adminClient.From<NotificationInsert>().Insert(recipient);
                await adminClient.From<NotificationInsert>().Insert(senderCopy);

                return Ok(new ChatMessageDto(
                    senderCopy.Id,
                    request.SenderUserId.ToString(),
                    "You",
                    request.Content,
                    now.ToString("o")
                ));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("adoption-request")]
        public async Task<IActionResult> SendAdoptionRequest([FromBody] AdoptionRequest request)
        {
            try
            {
                var adminClient = GetAdminClient();
                if (request == null)
                {
                    return BadRequest(new { message = "Invalid request payload." });
                }

                var senderUserId = await ResolveUserIdAsync(null);
                if (senderUserId <= 0)
                {
                    return Unauthorized(new { message = "Missing or invalid Authorization header." });
                }

                long receiverUserId = 0;
                Pet? pet = null;
                if (request.PetId.HasValue && request.PetId.Value != Guid.Empty)
                {
                    pet = await adminClient.From<Pet>().Where(x => x.Id == request.PetId.Value).Single();
                    if (pet == null)
                    {
                        return NotFound(new { message = "Pet not found." });
                    }

                    if (!pet.OwnerId.HasValue || pet.OwnerId.Value <= 0)
                    {
                        return BadRequest(new { message = "Pet owner not found." });
                    }

                    receiverUserId = pet.OwnerId.Value;
                }
                else if (request.ReceiverUserId.HasValue && request.ReceiverUserId.Value > 0)
                {
                    receiverUserId = request.ReceiverUserId.Value;
                }
                else
                {
                    return BadRequest(new { message = "PetId or ReceiverUserId is required." });
                }

                if (receiverUserId == senderUserId)
                {
                    return BadRequest(new { message = "You cannot send an adoption request to your own pet." });
                }

                var requestId = Guid.NewGuid();
                var now = DateTime.UtcNow;
                var adoptionRequest = new AdoptionRequestRecord
                {
                    Id = requestId,
                    SenderUserId = senderUserId,
                    ReceiverUserId = receiverUserId,
                    PetId = request.PetId,
                    Status = "pending",
                    CreatedAt = now,
                    UpdatedAt = now
                };

                await adminClient.From<AdoptionRequestRecord>().Insert(adoptionRequest);

                var notification = new NotificationInsert
                {
                    Id = Guid.NewGuid(),
                    UserId = receiverUserId,
                    SenderId = senderUserId,
                    Title = "Adoption request",
                    Message = pet != null ? $"Someone wants to adopt {pet.Name ?? "your pet"}." : "Someone sent an adoption request.",
                    IsRead = false,
                    ActionUrl = request.PetId.HasValue ? $"/pets/{request.PetId}" : "/matching?tab=adoption",
                    Type = "adoption_request",
                    RelatedId = requestId,
                    CreatedAt = now
                };

                await adminClient.From<NotificationInsert>().Insert(notification);
                return Ok(new { id = requestId, notificationId = notification.Id });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("mark-read/{id:guid}")]
        public async Task<IActionResult> MarkRead(Guid id)
        {
            try
            {
                var adminClient = GetAdminClient();
                var update = new NotificationInsert
                {
                    Id = id,
                    IsRead = true
                };

                await adminClient.From<NotificationInsert>().Update(update);
                return Ok(new { id });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        private static NotificationDto MapNotification(Notification n)
        {
            return new NotificationDto(
                n.Id,
                n.UserId,
                n.SenderId,
                n.Title,
                n.Message,
                n.IsRead ?? false,
                n.ActionUrl,
                n.Type,
                n.ConversationId,
                n.RelatedId,
                n.CreatedAt
            );
        }
    }

    public record SendMessageRequest(
        long SenderUserId,
        long ReceiverUserId,
        string Content,
        Guid? ConversationId,
        Guid? RelatedId
    );

    public record NotificationDto(
        Guid Id,
        long? UserId,
        long? SenderId,
        string? Title,
        string? Message,
        bool IsRead,
        string? ActionUrl,
        string? Type,
        Guid? ConversationId,
        Guid? RelatedId,
        DateTime? CreatedAt
    );

    public record ChatMessageDto(
        Guid Id,
        string SenderId,
        string SenderName,
        string Content,
        string Timestamp
    );

    public record AdoptionRequest(
        long? SenderUserId,
        long? ReceiverUserId,
        Guid? PetId
    );
}
