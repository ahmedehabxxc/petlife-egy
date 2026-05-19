using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace petLifeApp.Models
{
    [Table("Users")]
    public class UserPhoneUpdate : BaseModel
    {
        [PrimaryKey("UserId", false)]
        public long UserId { get; set; }

        [Column("Phone")]
        public string? Phone { get; set; }
    }
}
