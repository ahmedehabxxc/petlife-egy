using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace petLifeApp.Models
{
    [Table("ShopOwners")]
    public class ShopOwner : BaseModel
    {
        [PrimaryKey("ShopOwnerId", false)]
        public int ShopOwnerId { get; set; }

        [Column("UserId")]
        public int UserId { get; set; }

        [Column("ShopId")]
        public int ShopId { get; set; }

        [Column("ShopName")]
        public string? ShopName { get; set; }

        [Column("Phone")]
        public string? Phone { get; set; }

        [Column("Email")]
        public string? Email { get; set; }

        [Column("IsActive")]
        public bool? IsActive { get; set; }

        //Many-to-One
        [Reference(typeof(User))]
        public virtual User? User { get; set; }

        [Reference(typeof(Shop))]
        public virtual Shop? Shop { get; set; }

        //One-to-Many
        [Reference(typeof(ShopProduct))]
        public virtual List<ShopProduct> ShopProducts { get; set; }

        [Reference(typeof(Order))]
         public virtual List<Order> Orders { get; set; }

        public ShopOwner()
        {
            ShopProducts = new List<ShopProduct>();
            Orders = new List<Order>();
        }
    }
}


//         public virtual User? User { get; set; }
//         public virtual Shop? Shop { get; set; }
//         public virtual ICollection<ShopProduct> ShopProducts { get; set; }
//         public virtual ICollection<Order> Orders { get; set; }

//         public ShopOwner()
//         {
//             ShopProducts = new List<ShopProduct>();
//             Orders = new List<Order>();
//         }


//     }
// }
