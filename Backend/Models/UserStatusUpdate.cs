using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace petLifeApp.Models
{
    [Table("Users")]
    public class UserStatusUpdate : BaseModel
    {
        [PrimaryKey("UserId", false)]
        public long UserId { get; set; }

        [Column("IsActive")]
        public bool? IsActive { get; set; }
    }
}
