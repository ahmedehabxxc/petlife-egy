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
    public class MatchRequestsController : ControllerBase
    {
        private readonly Supabase.Client _supabase;
        private readonly IConfiguration _config;

        public MatchRequestsController(Supabase.Client supabase, IConfiguration config)
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

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateMatchRequest request)
        {
            try
            {
                var adminClient = GetAdminClient();
                if (request == null || request.PetId == Guid.Empty)
                {
                    return BadRequest(new { message = "PetId is required." });
                }

                var id = Guid.NewGuid();
                var senderUserId = await ResolveUserIdAsync(null);
                if (senderUserId <= 0)
                {
                    return Unauthorized(new { message = "Missing or invalid Authorization header." });
                }

                var pet = await adminClient.From<Pet>().Where(x => x.Id == request.PetId).Single();
                if (pet == null)
                {
                    return NotFound(new { message = "Pet not found." });
                }

                if (!pet.OwnerId.HasValue || pet.OwnerId.Value <= 0)
                {
                    return BadRequest(new { message = "Pet owner not found." });
                }

                var receiverUserId = pet.OwnerId.Value;
                if (receiverUserId == senderUserId)
                {
                    return BadRequest(new
                    {
                        message = "You cannot send a match request to your own pet.",
                        details = new { senderUserId, petOwnerId = receiverUserId }
                    });
                }

                var insert = new MatchRequestInsert
                {
                    Id = id,
                    SenderUserId = senderUserId,
                    ReceiverUserId = receiverUserId,
                    PetId = request.PetId,
                    Status = "pending"
                };

                await adminClient.From<MatchRequestInsert>().Insert(insert);

                var notification = new NotificationInsert
                {
                    Id = Guid.NewGuid(),
                    UserId = receiverUserId,
                    SenderId = senderUserId,
                    Title = "New match request",
                    Message = $"Someone wants to match with {pet?.Name ?? "your pet"}",
                    IsRead = false,
                    ActionUrl = "/matching?tab=requests",
                    Type = "match_request",
                    RelatedId = id,
                    CreatedAt = DateTime.UtcNow
                };

                await adminClient.From<NotificationInsert>().Insert(notification);

                return Ok(new { id });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("received")]
        public async Task<IActionResult> GetReceived([FromQuery] long? userId)
        {
            var resolvedUserId = await ResolveUserIdAsync(userId);
            if (resolvedUserId <= 0)
                return Ok(new List<MatchRequestDto>());

            try
            {
                var adminClient = GetAdminClient();
                var result = await adminClient
                    .From<MatchRequest>()
                    .Where(x => x.ReceiverUserId == resolvedUserId)
                    .Get();

                var rows = result.Models;
                var payload = new List<MatchRequestDto>();

                foreach (var row in rows)
                {
                    var sender = await adminClient.From<User>().Where(x => x.UserId == row.SenderUserId).Single();
                    var pet = await adminClient.From<Pet>().Where(x => x.Id == row.PetId).Single();

                    payload.Add(new MatchRequestDto(
                        row.Id,
                        row.SenderUserId,
                        row.ReceiverUserId,
                        row.PetId,
                        sender?.UserName ?? "User",
                        pet?.Name ?? "Pet",
                        pet?.ImageUrl,
                        row.Status,
                        row.CreatedAt
                    ));
                }

                return Ok(payload.OrderByDescending(p => p.CreatedAt));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("chats")]
        public async Task<IActionResult> GetChats([FromQuery] long? userId)
        {
            var resolvedUserId = await ResolveUserIdAsync(userId);
            if (resolvedUserId <= 0)
                return Ok(new List<MatchChatDto>());

            try
            {
                var adminClient = GetAdminClient();
                var result = await adminClient
                    .From<MatchRequest>()
                    .Get();

                var rows = result.Models
                    .Where(r => r.Status == "accepted" && (r.SenderUserId == resolvedUserId || r.ReceiverUserId == resolvedUserId))
                    .ToList();

                var payload = new List<MatchChatDto>();

                foreach (var row in rows)
                {
                    var otherUserId = row.SenderUserId == resolvedUserId ? row.ReceiverUserId : row.SenderUserId;
                    var otherUser = await adminClient.From<User>().Where(x => x.UserId == otherUserId).Single();
                    var pet = await adminClient.From<Pet>().Where(x => x.Id == row.PetId).Single();

                    payload.Add(new MatchChatDto(
                        row.Id,
                        otherUserId,
                        otherUser?.UserName ?? "User",
                        pet?.Name ?? "Pet",
                        pet?.ImageUrl
                    ));
                }

                return Ok(payload);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id:guid}/accept")]
        public async Task<IActionResult> Accept(Guid id)
        {
            try
            {
                var adminClient = GetAdminClient();
                var existing = await adminClient
                    .From<MatchRequest>()
                    .Where(x => x.Id == id)
                    .Single();

                if (existing == null)
                    return NotFound(new { message = "Match request not found." });

                var update = new MatchRequestInsert
                {
                    Id = id,
                    SenderUserId = existing.SenderUserId,
                    ReceiverUserId = existing.ReceiverUserId,
                    PetId = existing.PetId,
                    Status = "accepted"
                };
                await adminClient.From<MatchRequestInsert>().Update(update);

                var notification = new NotificationInsert
                {
                    Id = Guid.NewGuid(),
                    UserId = existing.SenderUserId,
                    SenderId = existing.ReceiverUserId,
                    Title = "Match accepted",
                    Message = "Your match request was accepted.",
                    IsRead = false,
                    ActionUrl = $"/matching?conversationId={id}",
                    Type = "match_accepted",
                    RelatedId = id,
                    CreatedAt = DateTime.UtcNow
                };
                await adminClient.From<NotificationInsert>().Insert(notification);

                return Ok(new { id, status = "accepted" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id:guid}/decline")]
        public async Task<IActionResult> Decline(Guid id)
        {
            try
            {
                var adminClient = GetAdminClient();
                var existing = await adminClient
                    .From<MatchRequest>()
                    .Where(x => x.Id == id)
                    .Single();

                if (existing == null)
                    return NotFound(new { message = "Match request not found." });

                var update = new MatchRequestInsert
                {
                    Id = id,
                    SenderUserId = existing.SenderUserId,
                    ReceiverUserId = existing.ReceiverUserId,
                    PetId = existing.PetId,
                    Status = "declined"
                };
                await adminClient.From<MatchRequestInsert>().Update(update);

                var notification = new NotificationInsert
                {
                    Id = Guid.NewGuid(),
                    UserId = existing.SenderUserId,
                    SenderId = existing.ReceiverUserId,
                    Title = "Match declined",
                    Message = "Your match request was declined.",
                    IsRead = false,
                    ActionUrl = "/matching?tab=requests",
                    Type = "match_declined",
                    RelatedId = id,
                    CreatedAt = DateTime.UtcNow
                };
                await adminClient.From<NotificationInsert>().Insert(notification);

                return Ok(new { id, status = "declined" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }

    public record CreateMatchRequest(Guid PetId);

    public record MatchRequestDto(
        Guid Id,
        long SenderUserId,
        long ReceiverUserId,
        Guid PetId,
        string SenderName,
        string PetName,
        string? PetPhoto,
        string Status,
        DateTime? CreatedAt
    );

    public record MatchChatDto(
        Guid ConversationId,
        long OtherUserId,
        string OtherUserName,
        string PetName,
        string? PetPhoto
    );
}
