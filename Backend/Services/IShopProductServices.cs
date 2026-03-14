using petLifeApp.Models;
using System.Threading.Tasks;

namespace petLifeApp.Services.Interfaces
{

    public interface IShopProductServices
    {
        Task<ShopProduct?> AddProduct(int shopId, int productId, decimal price, int quantity, string currency, bool isActive);

        Task<bool> DeleteProduct(int shopProductId);

        Task<Product?> AddProductToCatalog(Product product);
    }
}