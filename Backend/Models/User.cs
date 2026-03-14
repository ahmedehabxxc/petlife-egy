using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace petLifeApp.Models
{
    [Table("Users")]
    public class User : BaseModel
    {
        [PrimaryKey("UserId", false)]
        public long UserId { get; set; }

        [Column("AuthId")]
        public Guid AuthId { get; set; }

        [Column("UserName")]
        public string? UserName { get; set; }

        [Column("Email")]
        public string Email { get; set; } = null!;

        [Column("Phone")]
        public string? Phone { get; set; }

        [Column("Role")]
        public string? Role { get; set; }

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; }
    }
}
