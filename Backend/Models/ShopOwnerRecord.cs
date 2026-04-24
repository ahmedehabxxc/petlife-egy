using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace petLifeApp.Models
{
    [Table("ShopOwners")]
    public class ShopOwnerRecord : BaseModel
    {
        [PrimaryKey("Id", false)]
        public Guid Id { get; set; }

        [Column("UserId")]
        public long? UserId { get; set; }

        [Column("ShopName")]
        public string? ShopName { get; set; }
    }
}
