using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace petLifeApp.Models
{
    [Table("ShopProducts")]
    public class ShopProductRecord : BaseModel
    {
        [PrimaryKey("Id", false)]
        public Guid Id { get; set; }

        [Column("ShopOwnerId")]
        public Guid? ShopOwnerId { get; set; }

        [Column("ProductId")]
        public Guid? ProductId { get; set; }

        [Column("Price")]
        public decimal Price { get; set; }

        [Column("StockQuantity")]
        public int StockQuantity { get; set; }
    }
}
