using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace petLifeApp.Models
{
    [Table("Products")]
    public class Product : BaseModel
    {
        [PrimaryKey("ProductId", false)]
        public int ProductId { get; set; }

        [Column("ProductName")]
        public string ProductName { get; set; } = string.Empty;
        [Column("ProductDescription")]
        public string? ProductDescription { get; set; }
        [Column("ProductCategory")]
        public string? ProductCategory { get; set; }

        [Column("ProductCategoryId")]
        public int ProductCategoryId { get; set; }

        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; }

        //public virtual ShopProduct ShopProduct { get; set; }
    }
}
