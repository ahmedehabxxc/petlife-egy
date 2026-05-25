using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace petLifeApp.Models
{
    [Table("OrderItems")]
    public class OrderItemRecord : BaseModel
    {
        [PrimaryKey("Id", false)]
        public Guid Id { get; set; }

        [Column("OrderId")]
        public Guid? OrderId { get; set; }

        [Column("ShopProductId")]
        public Guid? ShopProductId { get; set; }

        [Column("Quantity")]
        public int Quantity { get; set; }

        [Column("UnitPrice")]
        public decimal UnitPrice { get; set; }
    }
}
