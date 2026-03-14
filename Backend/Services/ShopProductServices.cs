using Supabase;
using petLifeApp.Models;
using petLifeApp.Services.Interfaces;
using System.Threading.Tasks;
using System.Linq;

namespace petLifeApp.Services
{
    public class ShopProductServices : IShopProductServices
    {
        private readonly Client _supabase;

        public ShopProductServices(Client supabase)
        {
            _supabase = supabase;
        }

        public async Task<ShopProduct?> AddProduct(int shopId, int productId, decimal price, int quantity, string currency, bool isActive)
        {
            var shopProduct = new ShopProduct
            {
                ShopId = shopId,
                ProductId = productId,
                Price = price,
                StockQuantity = quantity,
                Currency = currency,
                IsActive = isActive
            };

            var result = await _supabase
                .From<ShopProduct>()
                .Insert(shopProduct);

            return result.Models.FirstOrDefault();
        }

        public async Task<bool> DeleteProduct(int shopProductId)
        {
            try
            {
                await _supabase
                    .From<ShopProduct>()
                    .Where(x => x.ShopProductId == shopProductId)
                    .Delete();
                
                return true;
            }
            catch
            {
                return false;
            }
        }
        public async Task<Product?> AddProductToCatalog(Product product)
        {
            var result = await _supabase
                .From<Product>()
                .Insert(product);

            return result.Model;
        }
    }
}