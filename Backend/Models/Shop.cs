namespace petLifeApp.Models
{
    public class Shop
    {
        public int ShopId { get; set; }
        public required string ShopName { get; set; }
        public required string ShopLocation { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
