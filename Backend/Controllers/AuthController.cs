using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Supabase;
using petLifeApp.Models;

namespace petLifeApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly Supabase.Client _supabase;
        private readonly IConfiguration _config;

        public AuthController(Supabase.Client supabase, IConfiguration config)
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

            // Fallback to the injected client (anon key) if no service role key is configured.
            return _supabase;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] AuthRegisterRequest request)
        {
            try
            {
                var role = string.IsNullOrWhiteSpace(request.Role) ? "pet_owner" : request.Role;
                var fullName = request.FirstName ?? string.Empty;
                if (!string.IsNullOrWhiteSpace(request.LastName))
                {
                    fullName = $"{fullName} {request.LastName}";
                }
                fullName = fullName.Trim();

                var options = new Supabase.Gotrue.SignUpOptions
                {
                    Data = new Dictionary<string, object>
            {
                { "username", fullName },
                { "role", role },
                { "phone", request.Phone ?? "" }
            }
                };

                var session = await _supabase.Auth.SignUp(request.Email, request.Password, options);

                if (session?.User == null)
                    return BadRequest(new { message = "Auth signup failed." });

                if (!Guid.TryParse(session.User.Id, out var authId))
                    return BadRequest(new { message = "Invalid auth user id." });

                var userInsert = new UserInsert
                {
                    AuthId = authId,
                    UserName = string.IsNullOrWhiteSpace(fullName) ? null : fullName,
                    Email = request.Email,
                    Phone = request.Phone,
                    Role = role
                };

                User? dbUser;
                try
                {
                    var adminClient = GetAdminClient();
                    await adminClient.From<UserInsert>().Insert(userInsert);
                    dbUser = await adminClient
                        .From<User>()
                        .Where(x => x.AuthId == authId)
                        .Single();

                    if (dbUser != null && string.Equals(role, "shop_owner", StringComparison.OrdinalIgnoreCase))
                    {
                        var existingOwner = await adminClient
                            .From<ShopOwnerRecord>()
                            .Where(x => x.UserId == dbUser.UserId)
                            .Get();

                        if (existingOwner.Models.Count == 0)
                        {
                            var shopName = dbUser.UserName ?? dbUser.Email ?? "Shop";
                            var ownerInsert = new ShopOwnerRecord
                            {
                                Id = Guid.NewGuid(),
                                UserId = dbUser.UserId,
                                ShopName = shopName
                            };
                            await adminClient.From<ShopOwnerRecord>().Insert(ownerInsert);
                        }
                    }
                }
                catch (Exception insertEx)
                {
                    return BadRequest(new
                    {
                        message = "User created in auth but profile insert failed. Check RLS and service role key.",
                        details = insertEx.Message
                    });
                }

                var token = session.AccessToken ?? session.RefreshToken ?? "";

                return Ok(new
                {
                    authId,
                    userId = dbUser?.UserId,
                    email = request.Email,
                    name = string.IsNullOrWhiteSpace(fullName) ? request.Email : fullName,
                    role,
                    confirmationRequired = string.IsNullOrEmpty(token),
                    token
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] AuthLoginRequest request)
        {
            try
            {
                var session = await _supabase.Auth.SignIn(request.Email, request.Password);
                if (session?.User == null)
                    return Unauthorized(new { message = "Invalid credentials." });

                if (!Guid.TryParse(session.User.Id, out var authId))
                    return Unauthorized(new { message = "Invalid auth user id." });
                var adminClient = GetAdminClient();
                var dbUser = await adminClient
                    .From<User>()
                    .Where(x => x.AuthId == authId)
                    .Single();

                if (dbUser == null)
                    return Unauthorized(new
                    {
                        message = "User record not found. Check RLS policies or ensure the Users.AuthId matches auth.users id."
                    });

                var token = session.AccessToken ?? session.RefreshToken ?? string.Empty;
                return Ok(new
                {
                    authId = dbUser.AuthId,
                    userId = dbUser.UserId,
                    email = dbUser.Email,
                    role = dbUser.Role ?? "pet_owner",
                    token,
                    name = dbUser.UserName ?? dbUser.Email
                });
            }
            catch (Exception ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }
    }

    public record AuthRegisterRequest(
        string Email,
        string Password,
        string FirstName,
        string? LastName,
        string? Phone,
        string? Role
    );

    public record AuthLoginRequest(string Email, string Password);
}
