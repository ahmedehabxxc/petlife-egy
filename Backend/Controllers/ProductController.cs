using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using petLifeApp.Models;
using petLifeApp.Services.Interfaces;
using Supabase;
using System.Linq;

namespace petLifeApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductController : ControllerBase
    {
        private readonly IShopProductServices _productService;
        private readonly Supabase.Client _supabase;
        private readonly IConfiguration _config;

        public ProductController(IShopProductServices productService, Supabase.Client supabase, IConfiguration config)
        {
            _productService = productService;
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

        //add
        [HttpPost("add")]
        public async Task<IActionResult> AddProduct([FromBody] ShopProduct product)
        {
            try
            {
                var result = await _productService.AddProduct(
                    product.ShopId,
                    product.ProductId,
                    product.Price,
                    product.StockQuantity
                    , product.Currency
                    , product.IsActive
                );

                return Ok(new
                {
                    message = "Product added successfully!",
                    id = result?.ShopProductId
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        //delete
        [HttpDelete("delete")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var success = await _productService.DeleteProduct(id);
            if (!success)
            {
                return NotFound(new { message = "Product not found or could not be deleted." });
            }
            return Ok(new { message = "Product deleted successfully!" });
        }

        // STEP 1: Add product to Master Catalog
        [HttpPost("create-catalog-item")]
        public async Task<IActionResult> CreateCatalogItem([FromBody] Product product)
        {
            try
            {
                var result = await _productService.AddProductToCatalog(product);
                return Ok(new
                {
                    message = "Product added to Master Catalog!",
                    productId = result?.ProductId
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }


        [HttpGet("catalog")]
        public async Task<IActionResult> GetCatalog()
        {
            try
            {
                var adminClient = GetAdminClient();
                var serviceKey = _config["Supabase:ServiceRoleKey"];
                if (string.IsNullOrWhiteSpace(serviceKey))
                {
                    return BadRequest(new { message = "Service role key missing on the server. Update appsettings and restart the API." });
                }
                var shopProducts = await adminClient.From<ShopProductRecord>().Get();
                var products = await adminClient.From<ProductRecord>().Get();
                var owners = await adminClient.From<ShopOwnerRecord>().Get();

                var productMap = products.Models
                    .Where(p => p.Id != Guid.Empty)
                    .GroupBy(p => p.Id)
                    .ToDictionary(g => g.Key, g => g.First());

                var ownerMap = owners.Models
                    .Where(o => o.Id != Guid.Empty)
                    .GroupBy(o => o.Id)
                    .ToDictionary(g => g.Key, g => g.First());

                var payload = shopProducts.Models
                    .Where(sp => sp.ProductId.HasValue && productMap.ContainsKey(sp.ProductId.Value))
                    .Select(sp =>
                    {
                        var product = productMap[sp.ProductId!.Value];
                        var shopName = "Shop";
                        if (sp.ShopOwnerId.HasValue && ownerMap.TryGetValue(sp.ShopOwnerId.Value, out var owner))
                        {
                            shopName = owner.ShopName ?? shopName;
                        }

                        return new CatalogProductDto(
                            sp.Id,
                            sp.ShopOwnerId,
                            shopName,
                            product.Name ?? "Product",
                            product.Description,
                            product.Category,
                            product.ImageUrl,
                            sp.Price,
                            sp.StockQuantity,
                            product.CreatedAt
                        );
                    })
                    .ToList();

                return Ok(payload);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

<<<<<<< HEAD
=======
        [HttpGet("catalog/{id:guid}")]
        public async Task<IActionResult> GetCatalogItem(Guid id)
        {
            try
            {
                var adminClient = GetAdminClient();
                var shopProduct = await adminClient.From<ShopProductRecord>().Where(x => x.Id == id).Single();
                if (shopProduct == null || !shopProduct.ProductId.HasValue)
                    return NotFound(new { message = "Product not found." });

                var product = await adminClient.From<ProductRecord>()
                    .Where(x => x.Id == shopProduct.ProductId.Value)
                    .Single();
                if (product == null)
                    return NotFound(new { message = "Product not found." });

                var shopName = "Shop";
                if (shopProduct.ShopOwnerId.HasValue)
                {
                    var owner = await adminClient.From<ShopOwnerRecord>()
                        .Where(x => x.Id == shopProduct.ShopOwnerId.Value)
                        .Single();
                    shopName = owner?.ShopName ?? shopName;
                }

                return Ok(new CatalogProductDto(
                    shopProduct.Id,
                    shopProduct.ShopOwnerId,
                    shopName,
                    product.Name ?? "Product",
                    product.Description,
                    product.Category,
                    product.ImageUrl,
                    shopProduct.Price,
                    shopProduct.StockQuantity,
                    product.CreatedAt
                ));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

>>>>>>> 566e763e4723dcdbb86bc931af1d7ad2ab712daf
        public record CatalogProductDto(
            Guid Id,
            Guid? ShopOwnerId,
            string ShopName,
            string Name,
            string? Description,
            string? Category,
            string? ImageUrl,
            decimal Price,
            int StockQuantity,
            DateTime? CreatedAt
        );

        [HttpGet("catalog-debug")]
        public async Task<IActionResult> GetCatalogDebug()
        {
            try
            {
                var adminClient = GetAdminClient();
                var shopProducts = await adminClient.From<ShopProductRecord>().Get();
                var products = await adminClient.From<ProductRecord>().Get();
                var owners = await adminClient.From<ShopOwnerRecord>().Get();

                var firstShopProduct = shopProducts.Models.FirstOrDefault();
                var firstProduct = products.Models.FirstOrDefault();
                var firstOwner = owners.Models.FirstOrDefault();

                return Ok(new
                {
                    shopProducts = shopProducts.Models.Count,
                    products = products.Models.Count,
                    owners = owners.Models.Count,
                    sampleShopProduct = firstShopProduct == null ? null : new
                    {
                        id = firstShopProduct.Id,
                        shopOwnerId = firstShopProduct.ShopOwnerId,
                        productId = firstShopProduct.ProductId,
                        price = firstShopProduct.Price,
                        stockQuantity = firstShopProduct.StockQuantity
                    },
                    sampleProduct = firstProduct == null ? null : new
                    {
                        id = firstProduct.Id,
                        name = firstProduct.Name,
                        category = firstProduct.Category,
                        imageUrl = firstProduct.ImageUrl
                    },
                    sampleOwner = firstOwner == null ? null : new
                    {
                        id = firstOwner.Id,
                        userId = firstOwner.UserId,
                        shopName = firstOwner.ShopName
                    }
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

    }
}
