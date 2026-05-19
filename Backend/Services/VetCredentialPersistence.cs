using Microsoft.Extensions.Logging;

namespace petLifeApp.Services
{
    public class VetCredentialPersistence
    {
        private readonly VetCredentialFileService _files;
        private readonly SupabaseCredentialStore _database;
        private readonly ILogger<VetCredentialPersistence> _logger;

        public VetCredentialPersistence(
            VetCredentialFileService files,
            SupabaseCredentialStore database,
            ILogger<VetCredentialPersistence> logger)
        {
            _files = files;
            _database = database;
            _logger = logger;
        }

        public async Task<string> SaveAsync(
            Guid vetId,
            byte[] bytes,
            string fileName,
            string? contentType,
            CancellationToken cancellationToken = default)
        {
            var savedName = await _files.SaveAsync(vetId, bytes, fileName);
            await _database.SaveCredentialsAsync(vetId, bytes, savedName, contentType, cancellationToken);
            return savedName;
        }

        public async Task<string> SaveDiskOnlyAsync(
            Guid vetId,
            byte[] bytes,
            string fileName,
            string? contentType,
            Exception? databaseError = null)
        {
            var savedName = await _files.SaveAsync(vetId, bytes, fileName);
            if (databaseError != null)
            {
                _logger.LogWarning(
                    databaseError,
                    "Credential saved to disk for vet {VetId} but database bytea write failed.",
                    vetId);
            }
            return savedName;
        }
    }
}
