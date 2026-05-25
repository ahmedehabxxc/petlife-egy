using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using petLifeApp.Models;
using Supabase;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;

namespace petLifeApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ShopOwnerController : ControllerBase
    {
        private readonly Supabase.Client _supabase;
        private readonly IConfiguration _config;

        public ShopOwnerController(Supabase.Client supabase, IConfiguration config)
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

        private async Task<ShopOwnerRecord?> EnsureShopOwnerAsync(long userId)
        {
            if (userId <= 0)
            {
                return null;
            }

            var adminClient = GetAdminClient();
            var owner = await GetShopOwnerAsync(userId);

            if (owner != null && owner.Id != Guid.Empty)
            {
                return owner;
            }

            User? user = null;
            try
            {
                user = await adminClient
                    .From<User>()
                    .Where(x => x.UserId == userId)
                    .Single();
            }
            catch
            {
                user = null;
            }

            var shopName = user?.UserName ?? user?.Email ?? "Shop";
            var insert = new ShopOwnerRecord
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                ShopName = shopName
            };
            await adminClient.From<ShopOwnerRecord>().Insert(insert);
            return insert;
        }

        private async Task<ShopOwnerRecord?> GetShopOwnerAsync(long userId)
        {
            if (userId <= 0)
            {
                return null;
            }

            var adminClient = GetAdminClient();
            try
            {
                var response = await adminClient
                    .From<ShopOwnerRecord>()
                    .Where(x => x.UserId == userId)
                    .Get();

                return response.Models.FirstOrDefault();
            }
            catch
            {
                return null;
            }
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard([FromQuery] long? userId)
        {
            var resolvedUserId = await ResolveUserIdAsync(userId);
            if (resolvedUserId <= 0)
            {
                return Ok(new ShopOwnerDashboardDto(
                    null,
                    0,
                    0m,
                    0m,
                    0,
                    new List<ShopOwnerOrderDto>()
                ));
            }

            try
            {
                var adminClient = GetAdminClient();
                var owner = await GetShopOwnerAsync(resolvedUserId);

                if (owner == null || owner.Id == Guid.Empty)
                {
                    return Ok(new ShopOwnerDashboardDto(
                        null,
                        0,
                        0m,
                        0m,
                        0,
                        new List<ShopOwnerOrderDto>()
                    ));
                }

                var shopProducts = await adminClient.From<ShopProductRecord>().Get();
                var ownerProducts = shopProducts.Models
                    .Where(p => p.ShopOwnerId.HasValue && p.ShopOwnerId.Value == owner.Id)
                    .ToList();

                var shopProductIds = ownerProducts.Select(p => p.Id).ToHashSet();
                if (shopProductIds.Count == 0)
                {
                    return Ok(new ShopOwnerDashboardDto(
                        owner.ShopName,
                        0,
                        0m,
                        0m,
                        0,
                        new List<ShopOwnerOrderDto>()
                    ));
                }

                var orderItems = await adminClient.From<OrderItemRecord>().Get();
                var ownerItems = orderItems.Models
                    .Where(i => i.ShopProductId.HasValue && shopProductIds.Contains(i.ShopProductId.Value))
                    .ToList();

                var orderIds = ownerItems
                    .Where(i => i.OrderId.HasValue)
                    .Select(i => i.OrderId!.Value)
                    .Distinct()
                    .ToList();

                var orders = await adminClient.From<OrderRecord>().Get();
                var ownerOrders = orders.Models
                    .Where(o => orderIds.Contains(o.Id))
                    .ToList();

                var customerIds = ownerOrders
                    .Where(o => o.UserId.HasValue)
                    .Select(o => o.UserId!.Value)
                    .Distinct()
                    .ToList();

                var users = await adminClient.From<User>().Get();
                var userMap = users.Models
                    .Where(u => customerIds.Contains(u.UserId))
                    .ToDictionary(u => u.UserId, u => u.UserName ?? u.Email);

                var orderItemLookup = ownerItems
                    .Where(i => i.OrderId.HasValue)
                    .GroupBy(i => i.OrderId!.Value)
                    .ToDictionary(g => g.Key, g => g.ToList());

                var now = DateTime.UtcNow;
                var incomeMonth = 0m;
                var refundsCount = 0;

                var orderDtos = new List<ShopOwnerOrderDto>();
                foreach (var order in ownerOrders.OrderByDescending(o => o.CreatedAt))
                {
                    var itemsForOrder = orderItemLookup.GetValueOrDefault(order.Id, new List<OrderItemRecord>());
                    var orderTotal = itemsForOrder.Sum(i => i.UnitPrice * i.Quantity);
                    var itemsCount = itemsForOrder.Sum(i => i.Quantity);
                    var status = (order.Status ?? "pending").ToLowerInvariant();

                    if (order.CreatedAt.HasValue &&
                        order.CreatedAt.Value.Year == now.Year &&
                        order.CreatedAt.Value.Month == now.Month &&
                        !string.Equals(status, "cancelled", StringComparison.OrdinalIgnoreCase))
                    {
                        incomeMonth += orderTotal;
                    }

                    if (string.Equals(status, "cancelled", StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(status, "refunded", StringComparison.OrdinalIgnoreCase))
                    {
                        refundsCount += 1;
                    }

                    var customerName = order.UserId.HasValue && userMap.TryGetValue(order.UserId.Value, out var name)
                        ? name
                        : "Customer";

                    orderDtos.Add(new ShopOwnerOrderDto(
                        order.Id,
                        customerName,
                        orderTotal,
                        itemsCount,
                        status,
                        order.CreatedAt
                    ));
                }

                var newOrdersCount = ownerOrders.Count(o => string.Equals(o.Status, "pending", StringComparison.OrdinalIgnoreCase));
                var profitMonth = incomeMonth;

                return Ok(new ShopOwnerDashboardDto(
                    owner.ShopName,
                    newOrdersCount,
                    incomeMonth,
                    profitMonth,
                    refundsCount,
                    orderDtos
                ));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile([FromQuery] long? userId)
        {
            var resolvedUserId = await ResolveUserIdAsync(userId);
            if (resolvedUserId <= 0)
            {
                return Ok(new ShopOwnerProfileDto(null));
            }

            try
            {
                var adminClient = GetAdminClient();
                var owner = await GetShopOwnerAsync(resolvedUserId);

                return Ok(new ShopOwnerProfileDto(owner?.ShopName));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateShopOwnerProfileRequest request)
        {
            var resolvedUserId = await ResolveUserIdAsync(null);
            if (resolvedUserId <= 0)
            {
                return Unauthorized(new { message = "Unauthorized." });
            }

            if (request == null || string.IsNullOrWhiteSpace(request.ShopName))
            {
                return BadRequest(new { message = "Shop name is required." });
            }

            try
            {
                var adminClient = GetAdminClient();
                var owner = await adminClient
                    .From<ShopOwnerRecord>()
                    .Where(x => x.UserId == resolvedUserId)
                    .Single();

                if (owner == null || owner.Id == Guid.Empty)
                {
                    var insert = new ShopOwnerRecord
                    {
                        Id = Guid.NewGuid(),
                        UserId = resolvedUserId,
                        ShopName = request.ShopName
                    };
                    await adminClient.From<ShopOwnerRecord>().Insert(insert);
                    return Ok(new ShopOwnerProfileDto(insert.ShopName));
                }

                var update = new ShopOwnerRecord
                {
                    Id = owner.Id,
                    UserId = owner.UserId,
                    ShopName = request.ShopName
                };
                await adminClient.From<ShopOwnerRecord>().Update(update);
                return Ok(new ShopOwnerProfileDto(request.ShopName));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("inventory")]
        public async Task<IActionResult> GetInventory([FromQuery] long? userId)
        {
            var resolvedUserId = await ResolveUserIdAsync(userId);
            if (resolvedUserId <= 0)
            {
                return Ok(new List<InventoryItemDto>());
            }

            try
            {
                var adminClient = GetAdminClient();
                var owner = await GetShopOwnerAsync(resolvedUserId);

                if (owner == null || owner.Id == Guid.Empty)
                {
                    return Ok(new List<InventoryItemDto>());
                }

                var shopProducts = await adminClient.From<ShopProductRecord>().Get();
                var ownerProducts = shopProducts.Models
                    .Where(p => p.ShopOwnerId.HasValue && p.ShopOwnerId.Value == owner.Id)
                    .ToList();

                var productIds = ownerProducts
                    .Where(p => p.ProductId.HasValue)
                    .Select(p => p.ProductId!.Value)
                    .ToHashSet();

                var products = await adminClient.From<ProductRecord>().Get();
                var productMap = products.Models
                    .Where(p => productIds.Contains(p.Id))
                    .ToDictionary(p => p.Id, p => p);

                var payload = ownerProducts.Select(sp =>
                {
                    var product = sp.ProductId.HasValue && productMap.TryGetValue(sp.ProductId.Value, out var p)
                        ? p
                        : null;

                    return new InventoryItemDto(
                        sp.Id,
                        sp.ProductId ?? Guid.Empty,
                        product?.Name ?? "Product",
                        product?.Description,
                        product?.Category,
                        product?.ImageUrl,
                        sp.Price,
                        sp.StockQuantity
                    );
                }).ToList();

                return Ok(payload);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("inventory")]
        public async Task<IActionResult> AddInventoryItem([FromBody] InventoryUpsertRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new { message = "Name is required." });
            }

            var resolvedUserId = await ResolveUserIdAsync(null);
            if (resolvedUserId <= 0)
            {
                return Unauthorized(new { message = "Unauthorized." });
            }

            try
            {
                var adminClient = GetAdminClient();
                var owner = await EnsureShopOwnerAsync(resolvedUserId);
                if (owner == null || owner.Id == Guid.Empty)
                {
                    return BadRequest(new { message = "Shop owner not found." });
                }

                var product = new ProductRecord
                {
                    Id = Guid.NewGuid(),
                    Name = request.Name,
                    Description = request.Description,
                    Category = request.Category,
                    ImageUrl = request.ImageUrl,
                    CreatedAt = DateTime.UtcNow
                };

                var productInsert = await adminClient.From<ProductRecord>().Insert(product);
                var createdProduct = productInsert.Models.FirstOrDefault();
                if (createdProduct == null || createdProduct.Id == Guid.Empty)
                {
                    return BadRequest(new { message = "Failed to create product. Check RLS policies or schema." });
                }

                var shopProduct = new ShopProductRecord
                {
                    Id = Guid.NewGuid(),
                    ShopOwnerId = owner.Id,
                    ProductId = createdProduct.Id,
                    Price = request.Price,
                    StockQuantity = request.StockQuantity
                };

                await adminClient.From<ShopProductRecord>().Insert(shopProduct);

                return Ok(new InventoryItemDto(
                    shopProduct.Id,
                    createdProduct.Id,
                    createdProduct.Name ?? "Product",
                    createdProduct.Description,
                    createdProduct.Category,
                    createdProduct.ImageUrl,
                    shopProduct.Price,
                    shopProduct.StockQuantity
                ));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("inventory/{id:guid}")]
        public async Task<IActionResult> UpdateInventoryItem(Guid id, [FromBody] InventoryUpsertRequest request)
        {
            if (id == Guid.Empty)
            {
                return BadRequest(new { message = "Invalid item id." });
            }

            var resolvedUserId = await ResolveUserIdAsync(null);
            if (resolvedUserId <= 0)
            {
                return Unauthorized(new { message = "Unauthorized." });
            }

            try
            {
                var adminClient = GetAdminClient();
                var shopProduct = await adminClient
                    .From<ShopProductRecord>()
                    .Where(x => x.Id == id)
                    .Single();

                if (shopProduct == null)
                {
                    return NotFound(new { message = "Item not found." });
                }

                var productId = shopProduct.ProductId ?? Guid.Empty;
                if (productId == Guid.Empty)
                {
                    return BadRequest(new { message = "Product not linked." });
                }

                var product = new ProductRecord
                {
                    Id = productId,
                    Name = request.Name,
                    Description = request.Description,
                    Category = request.Category,
                    ImageUrl = request.ImageUrl
                };

                await adminClient.From<ProductRecord>().Update(product);

                var update = new ShopProductRecord
                {
                    Id = id,
                    Price = request.Price,
                    StockQuantity = request.StockQuantity
                };

                await adminClient.From<ShopProductRecord>().Update(update);

                return Ok(new InventoryItemDto(
                    id,
                    productId,
                    request.Name ?? "Product",
                    request.Description,
                    request.Category,
                    request.ImageUrl,
                    request.Price,
                    request.StockQuantity
                ));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("inventory/{id:guid}")]
        public async Task<IActionResult> DeleteInventoryItem(Guid id)
        {
            if (id == Guid.Empty)
            {
                return BadRequest(new { message = "Invalid item id." });
            }

            var resolvedUserId = await ResolveUserIdAsync(null);
            if (resolvedUserId <= 0)
            {
                return Unauthorized(new { message = "Unauthorized." });
            }

            try
            {
                var adminClient = GetAdminClient();
                await adminClient.From<ShopProductRecord>().Where(x => x.Id == id).Delete();
                return Ok(new { id });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("orders")]
        public async Task<IActionResult> GetOrders([FromQuery] long? userId)
        {
            var resolvedUserId = await ResolveUserIdAsync(userId);
            if (resolvedUserId <= 0)
            {
                return Ok(new List<ShopOwnerOrderDetailDto>());
            }

            try
            {
                var adminClient = GetAdminClient();
                var owner = await GetShopOwnerAsync(resolvedUserId);

                if (owner == null || owner.Id == Guid.Empty)
                {
                    return Ok(new List<ShopOwnerOrderDetailDto>());
                }

                var shopProducts = await adminClient.From<ShopProductRecord>().Get();
                var ownerProducts = shopProducts.Models
                    .Where(p => p.ShopOwnerId.HasValue && p.ShopOwnerId.Value == owner.Id)
                    .ToList();

                var shopProductIds = ownerProducts.Select(p => p.Id).ToHashSet();
                if (shopProductIds.Count == 0)
                {
                    return Ok(new List<ShopOwnerOrderDetailDto>());
                }

                var products = await adminClient.From<ProductRecord>().Get();
                var productMap = products.Models.ToDictionary(p => p.Id, p => p);

                var orderItems = await adminClient.From<OrderItemRecord>().Get();
                var ownerItems = orderItems.Models
                    .Where(i => i.ShopProductId.HasValue && shopProductIds.Contains(i.ShopProductId.Value))
                    .ToList();

                var orderIds = ownerItems
                    .Where(i => i.OrderId.HasValue)
                    .Select(i => i.OrderId!.Value)
                    .Distinct()
                    .ToList();

                var orders = await adminClient.From<OrderRecord>().Get();
                var ownerOrders = orders.Models
                    .Where(o => orderIds.Contains(o.Id))
                    .OrderByDescending(o => o.CreatedAt)
                    .ToList();

                var users = await adminClient.From<User>().Get();
                var userMap = users.Models.ToDictionary(u => u.UserId, u => u);

                var itemsByOrder = ownerItems
                    .Where(i => i.OrderId.HasValue)
                    .GroupBy(i => i.OrderId!.Value)
                    .ToDictionary(g => g.Key, g => g.ToList());

                var payload = new List<ShopOwnerOrderDetailDto>();
                foreach (var order in ownerOrders)
                {
                    var items = itemsByOrder.GetValueOrDefault(order.Id, new List<OrderItemRecord>());
                    var mappedItems = new List<ShopOwnerOrderItemDto>();
                    foreach (var item in items)
                    {
                        var productName = "Product";
                        if (item.ShopProductId.HasValue)
                        {
                            var shopProduct = ownerProducts.FirstOrDefault(p => p.Id == item.ShopProductId.Value);
                            if (shopProduct?.ProductId.HasValue == true && productMap.TryGetValue(shopProduct.ProductId.Value, out var prod))
                            {
                                productName = prod.Name ?? productName;
                            }
                        }
                        mappedItems.Add(new ShopOwnerOrderItemDto(productName, item.Quantity));
                    }

                    var customerName = "Customer";
                    var phone = "";
                    if (order.UserId.HasValue && userMap.TryGetValue(order.UserId.Value, out var u))
                    {
                        customerName = u.UserName ?? u.Email;
                        phone = u.Phone ?? "";
                    }

                    var orderTotal = items.Sum(i => i.UnitPrice * i.Quantity);
                    var status = order.Status ?? "pending";
                    var address = order.DeliveryNotes ?? "";

                    payload.Add(new ShopOwnerOrderDetailDto(
                        order.Id,
                        customerName,
                        phone,
                        mappedItems,
                        orderTotal,
                        status,
                        address,
                        order.CreatedAt
                    ));
                }

                return Ok(payload);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("orders/{id:guid}/status")]
        public async Task<IActionResult> UpdateOrderStatus(Guid id, [FromBody] UpdateOrderStatusRequest request)
        {
            if (id == Guid.Empty || string.IsNullOrWhiteSpace(request?.Status))
            {
                return BadRequest(new { message = "Order id and status are required." });
            }

            var resolvedUserId = await ResolveUserIdAsync(null);
            if (resolvedUserId <= 0)
            {
                return Unauthorized(new { message = "Unauthorized." });
            }

            try
            {
                var adminClient = GetAdminClient();
                var update = new OrderStatusUpdate
                {
                    Id = id,
                    Status = request.Status
                };
                await adminClient.From<OrderStatusUpdate>().Update(update);
                return Ok(new { id, status = request.Status });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            try
            {
                var session = await _supabase.Auth.SignUp(request.Email, request.Password);
                if (session?.User == null) return BadRequest("Auth signup failed.");

                var newShopOwner = new ShopOwner
                {
                    ShopName = request.ShopName,
                    Phone = request.Phone,
                    Email = request.Email,
                    IsActive = false,
                };

                return Ok(new { message = "Registration successful. Pending admin approval." });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                var session = await _supabase.Auth.SignIn(request.Email, request.Password);

                var response = await _supabase.From<ShopOwner>()
                    .Where(x => x.Email == request.Email)
                    .Single();

                if (response == null || response.IsActive != true)
                {
                    return Ok(new { session, status = "Pending", message = "Account not yet active." });
                }

                return Ok(new { session, status = "Active" });
            }
            catch (Exception ex)
            {
                return Unauthorized(ex.Message);
            }
        }
    }

    public record RegisterRequest(string Email, string Password, string ShopName, string Phone);
    public record LoginRequest(string Email, string Password);

    public record ShopOwnerDashboardDto(
        string? ShopName,
        int NewOrders,
        decimal IncomeMonth,
        decimal ProfitMonth,
        int Refunds,
        List<ShopOwnerOrderDto> Orders
    );

    public record ShopOwnerOrderDto(
        Guid Id,
        string Customer,
        decimal Total,
        int Items,
        string Status,
        DateTime? CreatedAt
    );

    public record InventoryItemDto(
        Guid Id,
        Guid ProductId,
        string Name,
        string? Description,
        string? Category,
        string? ImageUrl,
        decimal Price,
        int StockQuantity
    );

    public record InventoryUpsertRequest(
        string? Name,
        string? Description,
        string? Category,
        string? ImageUrl,
        decimal Price,
        int StockQuantity
    );

    public record ShopOwnerOrderItemDto(string Name, int Qty);

    public record ShopOwnerOrderDetailDto(
        Guid Id,
        string Customer,
        string Phone,
        List<ShopOwnerOrderItemDto> Items,
        decimal Total,
        string Status,
        string Address,
        DateTime? CreatedAt
    );

    public record UpdateOrderStatusRequest(string Status);

    public record ShopOwnerProfileDto(string? ShopName);
    public record UpdateShopOwnerProfileRequest(string ShopName);
}
