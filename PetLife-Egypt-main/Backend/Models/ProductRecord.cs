using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace petLifeApp.Models
{
    [Table("Products")]
    public class ProductRecord : BaseModel
    {
        [PrimaryKey("Id", false)]
        public Guid Id { get; set; }

        [Column("Name")]
        public string? Name { get; set; }

        [Column("Description")]
        public string? Description { get; set; }

        [Column("Category")]
        public string? Category { get; set; }

        [Column("ImageUrl")]
        public string? ImageUrl { get; set; }

        [Column("CreatedAt")]
        public DateTime? CreatedAt { get; set; }
    }
}
