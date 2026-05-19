using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace petLifeApp.Models
{
    /// <summary>
    /// Used for inserting into Users table without UserId (identity column).
    /// </summary>
    [Table("Users")]
    public class UserInsert : BaseModel
    {
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
    }
}
