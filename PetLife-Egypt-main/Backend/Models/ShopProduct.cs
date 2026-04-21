using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace petLifeApp.Models
{
    [Table("ShopProducts")]
    public class ShopProduct : BaseModel 
    {
        [PrimaryKey("ShopProductId", false)]
        public int ShopProductId { get; set; }

        [Column("ShopId")]
        public int ShopId { get; set; }

        [Column("ProductId")]
        public int ProductId { get; set; }

        [Column("Price")]
        public decimal Price { get; set; }

        [Column("StockQuantity")] 
        public int StockQuantity { get; set; }

        [Column("Currency")]
        public string Currency { get; set; } = "EGP";

        [Column("IsActive")]
        public bool IsActive { get; set; } = true;  
    }
}