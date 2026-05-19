using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace petLifeApp.Models
{
    [Table("VetReviews")]
    public class VetReviewRecord : BaseModel
    {
        [PrimaryKey("Id", false)]
        public Guid Id { get; set; }

        [Column("VetId")]
        public Guid VetId { get; set; }

        [Column("UserId")]
        public long UserId { get; set; }

        [Column("Rating")]
        public int Rating { get; set; }

        [Column("Comment")]
        public string? Comment { get; set; }

        [Column("CreatedAt")]
        public DateTime? CreatedAt { get; set; }

        [Column("UpdatedAt")]
        public DateTime? UpdatedAt { get; set; }
    }

    [Table("VetReviews")]
    public class VetReviewInsert : BaseModel
    {
        [PrimaryKey("Id", false)]
        public Guid Id { get; set; }

        [Column("VetId")]
        public Guid VetId { get; set; }

        [Column("UserId")]
        public long UserId { get; set; }

        [Column("Rating")]
        public int Rating { get; set; }

        [Column("Comment")]
        public string? Comment { get; set; }

        [Column("CreatedAt")]
        public DateTime? CreatedAt { get; set; }
    }
}
