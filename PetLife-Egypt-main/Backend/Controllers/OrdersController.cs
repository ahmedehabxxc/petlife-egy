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
    public class OrdersController : ControllerBase
    {
        private readonly Supabase.Client _supabase;
        private readonly IConfiguration _config;

        public OrdersController(Supabase.Client supabase, IConfiguration config)
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
        public async Task<IActionResult> GetMyOrders([FromQuery] long? userId)
        {
            var resolvedUserId = await ResolveUserIdAsync(userId);
            if (resolvedUserId <= 0)
            {
                return Ok(new List<OrderSummaryDto>());
            }

            try
            {
                var adminClient = GetAdminClient();
                var orders = await adminClient.From<OrderRecord>()
                    .Where(x => x.UserId == resolvedUserId)
                    .Get();

                var orderList = orders.Models.OrderByDescending(o => o.CreatedAt).ToList();
                if (orderList.Count == 0)
                {
                    return Ok(new List<OrderSummaryDto>());
                }

                var orderIds = orderList.Select(o => o.Id).ToHashSet();
                var items = await adminClient.From<OrderItemRecord>().Get();
                var itemsByOrder = items.Models
                    .Where(i => i.OrderId.HasValue && orderIds.Contains(i.OrderId.Value))
                    .GroupBy(i => i.OrderId!.Value)
                    .ToDictionary(g => g.Key, g => g.Sum(x => x.Quantity));

                var payload = orderList.Select(o => new OrderSummaryDto(
                    o.Id,
                    o.CreatedAt,
                    o.TotalAmount,
                    o.Status ?? "pending",
                    itemsByOrder.GetValueOrDefault(o.Id, 0)
                )).ToList();

                return Ok(payload);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetOrder(Guid id, [FromQuery] long? userId)
        {
            var resolvedUserId = await ResolveUserIdAsync(userId);
            if (resolvedUserId <= 0)
            {
                return Unauthorized(new { message = "Unauthorized." });
            }

            try
            {
                var adminClient = GetAdminClient();
                var order = await adminClient.From<OrderRecord>()
                    .Where(x => x.Id == id)
                    .Single();

                if (order == null || order.UserId != resolvedUserId)
                {
                    return NotFound(new { message = "Order not found." });
                }

                var items = await adminClient.From<OrderItemRecord>().Get();
                var orderItems = items.Models
                    .Where(i => i.OrderId.HasValue && i.OrderId.Value == id)
                    .ToList();

                var shopProducts = await adminClient.From<ShopProductRecord>().Get();
                var products = await adminClient.From<ProductRecord>().Get();

                var shopProductMap = shopProducts.Models
                    .Where(sp => sp.Id != Guid.Empty)
                    .ToDictionary(sp => sp.Id, sp => sp);

                var productMap = products.Models
                    .Where(p => p.Id != Guid.Empty)
                    .ToDictionary(p => p.Id, p => p);

                var mappedItems = new List<OrderItemDto>();
                foreach (var item in orderItems)
                {
                    var name = "Product";
                    var imageUrl = "";
                    if (item.ShopProductId.HasValue && shopProductMap.TryGetValue(item.ShopProductId.Value, out var sp))
                    {
                        if (sp.ProductId.HasValue && productMap.TryGetValue(sp.ProductId.Value, out var prod))
                        {
                            name = prod.Name ?? name;
                            imageUrl = prod.ImageUrl ?? "";
                        }
                    }

                    mappedItems.Add(new OrderItemDto(
                        name,
                        imageUrl,
                        item.Quantity,
                        item.UnitPrice
                    ));
                }

                return Ok(new OrderDetailDto(
                    order.Id,
                    order.CreatedAt,
                    order.Status ?? "pending",
                    order.TotalAmount,
                    order.DeliveryNotes ?? "",
                    mappedItems
                ));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("debug")]
        public async Task<IActionResult> DebugOrders([FromQuery] long? userId)
        {
            var resolvedUserId = await ResolveUserIdAsync(userId);
            if (resolvedUserId <= 0)
            {
                return Ok(new { resolvedUserId = 0, orders = 0, items = 0, sampleOrder = (object?)null });
            }

            try
            {
                var adminClient = GetAdminClient();
                var orders = await adminClient.From<OrderRecord>()
                    .Where(x => x.UserId == resolvedUserId)
                    .Get();
                var items = await adminClient.From<OrderItemRecord>().Get();

                var sampleOrder = orders.Models.FirstOrDefault();
                return Ok(new
                {
                    resolvedUserId,
                    orders = orders.Models.Count,
                    items = items.Models.Count,
                    sampleOrder = sampleOrder == null ? null : new
                    {
                        id = sampleOrder.Id,
                        userId = sampleOrder.UserId,
                        total = sampleOrder.TotalAmount,
                        status = sampleOrder.Status,
                        createdAt = sampleOrder.CreatedAt
                    }
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateOrderRequest request)
        {
            var resolvedUserId = await ResolveUserIdAsync(null);
            if (resolvedUserId <= 0)
            {
                return Unauthorized(new { message = "Unauthorized." });
            }

            if (request == null || request.Items == null || request.Items.Count == 0)
            {
                return BadRequest(new { message = "Order items are required." });
            }

            try
            {
                var adminClient = GetAdminClient();
                var orderId = Guid.NewGuid();
                var total = request.Items.Sum(i => i.UnitPrice * i.Quantity);
                var notes = $"{request.Address} | {request.City} | {request.Phone}";

                var order = new OrderRecord
                {
                    Id = orderId,
                    UserId = resolvedUserId,
                    TotalAmount = total,
                    Status = "pending",
                    DeliveryNotes = notes,
                    CreatedAt = DateTime.UtcNow
                };

                var orderInsert = await adminClient.From<OrderRecord>().Insert(order);
                var createdOrder = orderInsert.Models.FirstOrDefault();
                if (createdOrder == null || createdOrder.Id == Guid.Empty)
                {
                    createdOrder = await adminClient.From<OrderRecord>().Where(x => x.Id == orderId).Single();
                }
                if (createdOrder == null || createdOrder.Id == Guid.Empty)
                {
                    return BadRequest(new { message = "Failed to create order. Check RLS or schema for Orders." });
                }

                foreach (var item in request.Items)
                {
                    var orderItem = new OrderItemRecord
                    {
                        Id = Guid.NewGuid(),
                        OrderId = createdOrder.Id,
                        ShopProductId = item.ShopProductId,
                        Quantity = item.Quantity,
                        UnitPrice = item.UnitPrice
                    };
                    await adminClient.From<OrderItemRecord>().Insert(orderItem);
                }

                return Ok(new { id = createdOrder.Id });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }

    public record CreateOrderItem(Guid ShopProductId, int Quantity, decimal UnitPrice);

    public record CreateOrderRequest(
        string Address,
        string City,
        string Phone,
        string PaymentMethod,
        List<CreateOrderItem> Items
    );

    public record OrderSummaryDto(
        Guid Id,
        DateTime? CreatedAt,
        decimal Total,
        string Status,
        int ItemCount
    );

    public record OrderItemDto(
        string Name,
        string ImageUrl,
        int Quantity,
        decimal UnitPrice
    );

    public record OrderDetailDto(
        Guid Id,
        DateTime? CreatedAt,
        string Status,
        decimal Total,
        string DeliveryNotes,
        List<OrderItemDto> Items
    );
}
